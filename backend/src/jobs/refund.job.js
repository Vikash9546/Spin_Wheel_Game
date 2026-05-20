const prisma = require('../db/prisma');
const coinService = require('../services/coin.service');
const socketServer = require('../websocket/socket.server');

async function process(job) {
  const { wheelId } = job.data;

  console.log(`[refund] Starting refunds for wheel ${wheelId}`);

  // Fetch wheel and participants
  const wheel = await prisma.spinWheel.findUnique({
    where: { id: wheelId },
    include: {
      participants: true,
    },
  });

  if (!wheel) {
    console.error(`[refund] Wheel not found: ${wheelId}`);
    return;
  }

  if (wheel.status !== 'ABORTED') {
    console.error(`[refund] Cannot refund: Wheel ${wheelId} is in status ${wheel.status}, not ABORTED`);
    return;
  }

  const refundAmount = wheel.entryFee;
  let successCount = 0;
  let skipCount = 0;

  for (const participant of wheel.participants) {
    const userId = participant.userId;
    try {
      // Run isolated transaction per participant refund to keep lock times low
      const refunded = await prisma.$transaction(async (tx) => {
        // Lock user wallet
        await tx.$executeRaw`SELECT 1 FROM "users" WHERE id = ${userId} FOR UPDATE`;

        // Check if refund already exists (idempotency)
        const existingRefund = await tx.transaction.findFirst({
          where: {
            userId,
            type: 'REFUND',
            referenceType: 'SpinWheel',
            referenceId: wheelId,
          },
        });

        if (existingRefund) {
          return { success: false, skipped: true };
        }

        // Credit the refund
        const { user } = await coinService.credit(
          tx,
          userId,
          refundAmount,
          'REFUND',
          'SpinWheel',
          wheelId
        );

        return { success: true, coins: user.coins };
      });

      if (refunded.success) {
        successCount++;
        // Broadcast wallet update
        socketServer.emitToUser(userId, 'walletUpdated', {
          userId,
          coins: refunded.coins,
        });
      } else if (refunded.skipped) {
        skipCount++;
      }
    } catch (err) {
      console.error(`[refund] Failed to refund user ${userId} for wheel ${wheelId}:`, err.message);
      // We log and continue so that one user failure doesn't block other users' refunds.
      // The queue retry or a recovery job will catch up.
      throw err; // Throw to trigger BullMQ retry of the job
    }
  }

  console.log(`[refund] Completed refunds for wheel ${wheelId}. Successes: ${successCount}, Skipped: ${skipCount}`);
}

module.exports = {
  process,
};
