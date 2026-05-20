const prisma = require('../db/prisma');
const wheelService = require('../services/wheel.service');
const { getQueue } = require('./queue');

/**
 * Ensures required database constraints and indexes are created.
 */
async function initDatabaseConstraints() {
  console.log('🛡️ [Database] Initializing indexes and constraints...');
  try {
    // 1. Partial unique index to guarantee at most one active wheel (WAITING, STARTING, RUNNING) at a time
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS active_wheel_idx 
      ON "spin_wheels" ((true)) 
      WHERE status IN ('WAITING', 'STARTING', 'RUNNING');
    `);
    console.log('🛡️ [Database] Checked active_wheel_idx index.');

    // 2. Partial unique index to guarantee a user is only refunded once per wheel
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_refund_idx 
      ON "transactions" (user_id, reference_id) 
      WHERE type = 'REFUND';
    `);
    console.log('🛡️ [Database] Checked unique_refund_idx index.');
  } catch (err) {
    console.error('🛡️ [Database] Error initializing constraints:', err.message);
    throw err;
  }
}

/**
 * Recovers active wheel games after a backend crash or restart.
 */
async function recoverActiveGames() {
  // First ensure indexes are set up
  await initDatabaseConstraints();

  console.log('🔄 [Recovery] Checking for active games needing recovery...');
  try {
    // Find the single active wheel (if any)
    const activeWheel = await prisma.spinWheel.findFirst({
      where: {
        status: {
          in: ['WAITING', 'STARTING', 'RUNNING'],
        },
      },
      include: {
        participants: true,
      },
    });

    if (!activeWheel) {
      console.log('🔄 [Recovery] No active wheels found. System is clean.');
      return;
    }

    const now = Date.now();
    const queue = getQueue();

    if (activeWheel.status === 'WAITING') {
      const waitDuration = 3 * 60 * 1000; // 3 minutes
      const targetTime = activeWheel.createdAt.getTime() + waitDuration;
      const remainingDelay = targetTime - now;

      if (remainingDelay <= 0) {
        console.log(`🔄 [Recovery] Wheel ${activeWheel.id} missed its auto-start timer. Triggering auto-start job immediately.`);
        await queue.add(
          'wheelStart',
          { wheelId: activeWheel.id },
          { jobId: `start-${activeWheel.id}` } // Immediate
        );
      } else {
        console.log(`🔄 [Recovery] Wheel ${activeWheel.id} is WAITING. Scheduling auto-start job in ${Math.round(remainingDelay / 1000)}s.`);
        await queue.add(
          'wheelStart',
          { wheelId: activeWheel.id },
          { delay: remainingDelay, jobId: `start-${activeWheel.id}` }
        );
      }
    } else if (activeWheel.status === 'STARTING') {
      console.log(`🔄 [Recovery] Wheel ${activeWheel.id} crashed in STARTING status. Resetting state to WAITING to allow recovery.`);
      
      await prisma.spinWheel.update({
        where: { id: activeWheel.id },
        data: { status: 'WAITING' },
      });

      await queue.add(
        'wheelStart',
        { wheelId: activeWheel.id },
        { jobId: `start-${activeWheel.id}` }
      );
    } else if (activeWheel.status === 'RUNNING') {
      const nextEliminationTime = activeWheel.nextEliminationAt
        ? activeWheel.nextEliminationAt.getTime()
        : activeWheel.updatedAt.getTime();

      const remainingDelay = nextEliminationTime - now;

      if (remainingDelay <= 0) {
        console.log(`🔄 [Recovery] Wheel ${activeWheel.id} missed elimination round ${activeWheel.currentRound}. Executing immediately.`);
        await queue.add(
          'elimination',
          { wheelId: activeWheel.id, round: activeWheel.currentRound },
          { jobId: `elim-${activeWheel.id}-${activeWheel.currentRound}` }
        );
      } else {
        console.log(`🔄 [Recovery] Wheel ${activeWheel.id} is RUNNING. Scheduling elimination round ${activeWheel.currentRound} in ${Math.round(remainingDelay / 1000)}s.`);
        await queue.add(
          'elimination',
          { wheelId: activeWheel.id, round: activeWheel.currentRound },
          { delay: remainingDelay, jobId: `elim-${activeWheel.id}-${activeWheel.currentRound}` }
        );
      }
    }
  } catch (err) {
    console.error('🔄 [Recovery] Error during game recovery startup:', err.message);
  }
}

module.exports = {
  recoverActiveGames,
};
