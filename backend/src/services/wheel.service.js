const { randomInt } = require('node:crypto');
const prisma = require('../db/prisma');
const coinService = require('./coin.service');
const payoutService = require('./payout.service');

// Fisher-Yates Shuffle using cryptographically secure randomness
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1); // [0, i] — uniform, CSPRNG-backed
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Check if there is already an active wheel.
 */
async function getActiveWheel(tx) {
  return await (tx || prisma).spinWheel.findFirst({
    where: {
      status: {
        in: ['WAITING', 'STARTING', 'RUNNING'],
      },
    },
  });
}

/**
 * Admin creates a new wheel.
 * Triple-layer protection against concurrent creation:
 * 1. pg_advisory_xact_lock serializes all createWheel calls
 * 2. Application-level check provides clean error message
 * 3. active_wheel_idx DB constraint is the final safety net
 */
async function createWheel(adminId, entryFee) {
  const feeBig = BigInt(entryFee);
  if (feeBig <= 0n) {
    throw new Error('Entry fee must be positive');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Layer 1: Acquire an advisory lock to serialize concurrent wheel creation attempts.
      // Lock ID 1001 is arbitrary but must be consistent across all createWheel calls.
      // This prevents the TOCTOU race where two admins both see "no active wheel".
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(1001)`;

      // Layer 2: Application-level check (provides clean error message)
      const activeWheel = await getActiveWheel(tx);
      if (activeWheel) {
        throw new Error(`An active wheel already exists with status ${activeWheel.status} (ID: ${activeWheel.id})`);
      }

      const newWheel = await tx.spinWheel.create({
        data: {
          status: 'WAITING',
          entryFee: feeBig,
          minPlayers: 3,
          createdBy: adminId,
          winnerPool: 0n,
          adminPool: 0n,
          appPool: 0n,
        },
      });

      // Schedule the 3-minute auto-start countdown
      const { getQueue } = require('../jobs/queue');
      const queue = getQueue();
      await queue.add(
        'wheelStart',
        { wheelId: newWheel.id },
        { delay: 3 * 60 * 1000, jobId: `start-${newWheel.id}` }
      );

      return newWheel;
    }, { maxWait: 20000, timeout: 30000 });
  } catch (err) {
    // Layer 3: Catch DB unique constraint violation from active_wheel_idx
    if (err.code === 'P2002' || err.message?.includes('active_wheel_idx') || err.message?.includes('Unique constraint')) {
      throw new Error('An active wheel already exists. Only one wheel can be active at a time.');
    }
    throw err;
  }
}

/**
 * User joins the wheel.
 */
async function joinWheel(userId, wheelId) {
  return await prisma.$transaction(async (tx) => {
    // Lock the wheel row to serialize concurrent joins and prevent race conditions on pools
    await tx.$executeRaw`SELECT 1 FROM "spin_wheels" WHERE id = ${wheelId} FOR UPDATE`;

    const wheel = await tx.spinWheel.findUnique({
      where: { id: wheelId },
      include: {
        participants: true,
      },
    });

    if (!wheel) {
      throw new Error(`Wheel not found: ${wheelId}`);
    }

    if (wheel.status !== 'WAITING') {
      throw new Error(`Cannot join wheel: Status is ${wheel.status}`);
    }

    // Enforce maximum participant cap to prevent unbounded joins
    const MAX_PARTICIPANTS = 12;
    if (wheel.participants.length >= MAX_PARTICIPANTS) {
      throw new Error(`Wheel is full: maximum ${MAX_PARTICIPANTS} participants allowed`);
    }

    // Check if user has already joined
    const alreadyJoined = wheel.participants.some((p) => p.userId === userId);
    if (alreadyJoined) {
      throw new Error(`User ${userId} has already joined the wheel`);
    }

    // Load GameConfig or use defaults
    const config = (await tx.gameConfig.findFirst()) || {
      winnerPercentage: 70,
      adminPercentage: 15,
      appPercentage: 15,
    };

    const fee = wheel.entryFee;
    const winnerShare = (fee * BigInt(config.winnerPercentage)) / 100n;
    const adminShare = (fee * BigInt(config.adminPercentage)) / 100n;
    const appShare = fee - winnerShare - adminShare; // App receives remainder to prevent rounding leakage

    // Debit the user's coins atomically
    const { transaction } = await coinService.debit(tx, userId, fee, 'JOIN_DEBIT', 'SpinWheel', wheelId);

    // Create participant record
    const participant = await tx.wheelParticipant.create({
      data: {
        wheelId,
        userId,
      },
    });

    // Update wheel pool balances
    const updatedWheel = await tx.spinWheel.update({
      where: { id: wheelId },
      data: {
        winnerPool: { increment: winnerShare },
        adminPool: { increment: adminShare },
        appPool: { increment: appShare },
      },
    });

    return { wheel: updatedWheel, participant, transaction };
  }, { maxWait: 20000, timeout: 30000 });
}

/**
 * Starts the wheel (transitions from WAITING -> RUNNING).
 */
async function startWheel(wheelId) {
  return await prisma.$transaction(async (tx) => {
    // Lock the wheel row
    await tx.$executeRaw`SELECT 1 FROM "spin_wheels" WHERE id = ${wheelId} FOR UPDATE`;

    const wheel = await tx.spinWheel.findUnique({
      where: { id: wheelId },
      include: { participants: true },
    });

    if (!wheel) {
      throw new Error(`Wheel not found: ${wheelId}`);
    }

    if (wheel.status !== 'WAITING') {
      if (wheel.status === 'STARTING' || wheel.status === 'RUNNING') {
        return wheel; // Idempotency
      }
      throw new Error(`Cannot start wheel in status ${wheel.status}`);
    }

    const participants = wheel.participants;
    if (participants.length < 3) {
      throw new Error(`Cannot start wheel: Minimum 3 participants required, got ${participants.length}`);
    }

    // Shuffle participant user IDs
    const participantUserIds = participants.map((p) => p.userId);
    const shuffledIds = shuffle(participantUserIds);

    // Eliminate the first N-1 players. The last player remaining (index N-1) is the winner.
    const eliminationOrder = shuffledIds.slice(0, shuffledIds.length - 1);

    // Transition state to RUNNING and save elimination order
    const startedWheel = await tx.spinWheel.update({
      where: { id: wheelId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        currentRound: 1,
        eliminationOrder: eliminationOrder,
        nextEliminationAt: new Date(Date.now() + 7 * 1000),
      },
    });

    // Schedule the first elimination job in 7 seconds
    const { getQueue } = require('../jobs/queue');
    const queue = getQueue();
    await queue.add(
      'elimination',
      { wheelId: wheelId, round: 1 },
      { delay: 7 * 1000, jobId: `elim-${wheelId}-1` }
    );

    return startedWheel;
  }, { maxWait: 20000, timeout: 30000 });
}

/**
 * Abort wheel and trigger refunds.
 */
async function abortWheel(wheelId) {
  return await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT 1 FROM "spin_wheels" WHERE id = ${wheelId} FOR UPDATE`;

    const wheel = await tx.spinWheel.findUnique({ where: { id: wheelId } });
    if (!wheel) {
      throw new Error(`Wheel not found: ${wheelId}`);
    }

    if (wheel.status !== 'WAITING') {
      if (wheel.status === 'ABORTED') {
        return wheel; // Idempotency
      }
      throw new Error(`Cannot abort wheel in status ${wheel.status}`);
    }

    const abortedWheel = await tx.spinWheel.update({
      where: { id: wheelId },
      data: {
        status: 'ABORTED',
        endedAt: new Date(),
      },
    });

    // Add refund job to BullMQ
    const { getQueue } = require('../jobs/queue');
    const queue = getQueue();
    await queue.add(
      'refund',
      { wheelId },
      { jobId: `refund-${wheelId}` }
    );

    return abortedWheel;
  }, { maxWait: 20000, timeout: 30000 });
}

/**
 * Stop a RUNNING wheel mid-game.
 * Cancels pending elimination jobs, marks wheel ABORTED, and triggers refunds.
 */
async function stopWheel(wheelId) {
  // Use same lock ID derivation as eliminatePlayer to prevent stop/elim race
  let lockId = 0;
  for (let i = 0; i < wheelId.length; i++) {
    lockId = ((lockId << 5) - lockId + wheelId.charCodeAt(i)) | 0;
  }
  lockId = Math.abs(lockId) + 10000;

  return await prisma.$transaction(async (tx) => {
    // Advisory lock — same lock as eliminatePlayer to prevent stop/elimination race
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId})`;
    await tx.$executeRaw`SELECT 1 FROM "spin_wheels" WHERE id = ${wheelId} FOR UPDATE`;

    const wheel = await tx.spinWheel.findUnique({
      where: { id: wheelId },
      include: { participants: true },
    });

    if (!wheel) {
      throw new Error(`Wheel not found: ${wheelId}`);
    }

    // Allow stopping from WAITING or RUNNING states
    if (!['WAITING', 'RUNNING'].includes(wheel.status)) {
      if (wheel.status === 'ABORTED') {
        return wheel; // Idempotency
      }
      throw new Error(`Cannot stop wheel in status ${wheel.status}`);
    }

    // Cancel any pending BullMQ jobs for this wheel
    const { getQueue } = require('../jobs/queue');
    const queue = getQueue();

    // Helper: properly remove a BullMQ job by its custom jobId
    async function removeJob(jobId) {
      try {
        const job = await queue.getJob(jobId);
        if (job) await job.remove();
      } catch (_) {}
    }

    // Cancel the auto-start job if still pending
    await removeJob(`start-${wheelId}`);

    // Cancel all pending elimination jobs (one per round)
    const totalRounds = wheel.participants.length - 1;
    for (let r = wheel.currentRound || 1; r <= totalRounds; r++) {
      await removeJob(`elim-${wheelId}-${r}`);
    }

    // Transition wheel to ABORTED
    const stoppedWheel = await tx.spinWheel.update({
      where: { id: wheelId },
      data: {
        status: 'ABORTED',
        endedAt: new Date(),
      },
    });

    // Schedule refund job
    await queue.add(
      'refund',
      { wheelId },
      { jobId: `refund-${wheelId}` }
    );

    return stoppedWheel;
  }, { maxWait: 20000, timeout: 30000 });
}

/**
 * Run player elimination (7 seconds round logic).
 *
 * Synchronization layers:
 * 1. pg_advisory_xact_lock — serializes all operations on this wheel
 * 2. Status check — noop if wheel is no longer RUNNING
 * 3. Round idempotency — noop if round already processed
 * 4. Unique BullMQ jobId — prevents duplicate job enqueue
 */
async function eliminatePlayer(wheelId, expectedRound) {
  const { getQueue } = require('../jobs/queue');

  // Generate a stable integer lock ID from the wheelId string
  // This ensures different wheels don't block each other
  let lockId = 0;
  for (let i = 0; i < wheelId.length; i++) {
    lockId = ((lockId << 5) - lockId + wheelId.charCodeAt(i)) | 0;
  }
  // Ensure positive and avoid collision with createWheel lock (1001)
  lockId = Math.abs(lockId) + 10000;

  const result = await prisma.$transaction(async (tx) => {
    // Layer 1: Advisory lock — serializes ALL concurrent operations on this wheel.
    // Prevents duplicate eliminations from BullMQ retries, stalled job re-processing,
    // or race conditions with stopWheel/abortWheel.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId})`;

    // Layer 2: Row lock + fetch
    await tx.$executeRaw`SELECT 1 FROM "spin_wheels" WHERE id = ${wheelId} FOR UPDATE`;

    const wheel = await tx.spinWheel.findUnique({
      where: { id: wheelId },
      include: { participants: true },
    });

    if (!wheel) {
      throw new Error(`Wheel not found: ${wheelId}`);
    }

    // Status validation — wheel may have been stopped/aborted while this job waited
    if (wheel.status !== 'RUNNING') {
      return { noop: true, message: `Wheel is not running, status is ${wheel.status}` };
    }

    // Layer 3: Round idempotency — if this round was already processed (BullMQ retry)
    if (wheel.currentRound > expectedRound) {
      return { noop: true, message: `Round ${expectedRound} already processed. Current round: ${wheel.currentRound}` };
    }

    // Extra safety: if expectedRound doesn't match currentRound, reject
    if (wheel.currentRound !== expectedRound) {
      return { noop: true, message: `Round mismatch: expected ${expectedRound}, wheel is at ${wheel.currentRound}` };
    }

    const round = wheel.currentRound;
    const order = wheel.eliminationOrder;
    const userIdToEliminate = order[round - 1];

    if (!userIdToEliminate) {
      throw new Error(`No player to eliminate at round ${round} for wheel ${wheelId}`);
    }

    // Verify user hasn't already been eliminated (double-elimination guard)
    const participant = await tx.wheelParticipant.findUnique({
      where: {
        wheelId_userId: {
          wheelId,
          userId: userIdToEliminate,
        },
      },
    });

    if (participant?.eliminatedAt) {
      return { noop: true, message: `Player ${userIdToEliminate} already eliminated at round ${round}` };
    }

    // Mark the participant as eliminated
    await tx.wheelParticipant.update({
      where: {
        wheelId_userId: {
          wheelId,
          userId: userIdToEliminate,
        },
      },
      data: {
        eliminatedAt: new Date(),
      },
    });

    const isLastRound = round === order.length;

    if (isLastRound) {
      // Find the only remaining participant who has not been eliminated
      const winnerParticipant = await tx.wheelParticipant.findFirst({
        where: {
          wheelId,
          eliminatedAt: null,
        },
      });

      if (!winnerParticipant) {
        throw new Error(`No survivor found for wheel ${wheelId}`);
      }

      const winnerId = winnerParticipant.userId;

      // Mark winner
      await tx.wheelParticipant.update({
        where: {
          wheelId_userId: { wheelId, userId: winnerId },
        },
        data: { isWinner: true },
      });

      // Get or create system app user
      const appUser = await coinService.getOrCreateSystemAppUser(tx);

      // Perform payouts inside this same transaction
      const settlement = await payoutService.settlePayout({
        tx,
        wheelId,
        winnerId,
        winnerAmount: wheel.winnerPool,
        adminId: wheel.createdBy,
        adminAmount: wheel.adminPool,
        appUserId: appUser.id,
        appAmount: wheel.appPool,
      });

      return {
        completed: true,
        round,
        eliminatedUserId: userIdToEliminate,
        winnerId,
        settlement,
        wheel: settlement.wheel,
      };
    } else {
      // Advance to next round
      const nextRound = round + 1;
      const nextEliminationTime = new Date(Date.now() + 7 * 1000);

      const updatedWheel = await tx.spinWheel.update({
        where: { id: wheelId },
        data: {
          currentRound: nextRound,
          nextEliminationAt: nextEliminationTime,
        },
      });

      // Schedule the next elimination round (inside the transaction to ensure atomicity)
      const queue = getQueue();
      await queue.add(
        'elimination',
        { wheelId, round: nextRound },
        { delay: 7 * 1000, jobId: `elim-${wheelId}-${nextRound}` }
      );

      return {
        completed: false,
        round,
        eliminatedUserId: userIdToEliminate,
        nextRound,
        nextEliminationAt: nextEliminationTime,
        wheel: updatedWheel,
      };
    }
  }, { maxWait: 20000, timeout: 30000 });

  return result;
}

module.exports = {
  getActiveWheel,
  createWheel,
  joinWheel,
  startWheel,
  abortWheel,
  stopWheel,
  eliminatePlayer,
};
