const prisma = require('../db/prisma');
const coinService = require('./coin.service');

/**
 * Performs a deadlock-free payout settlement.
 * It locks all involved user wallets in a sorted alphabetical order by their IDs,
 * credits them with the respective amounts, logs transaction records, and completes the wheel.
 *
 * @param {object} tx - Prisma transaction client
 * @param {object} params
 * @param {string} params.wheelId - ID of the spin wheel
 * @param {string} params.winnerId - ID of the winner
 * @param {bigint} params.winnerAmount - Coins for the winner
 * @param {string} params.adminId - ID of the wheel creator/admin
 * @param {bigint} params.adminAmount - Coins for the admin
 * @param {string} params.appUserId - ID of the system app user
 * @param {bigint} params.appAmount - Coins for the app
 */
async function settlePayout({
  tx,
  wheelId,
  winnerId,
  winnerAmount,
  adminId,
  adminAmount,
  appUserId,
  appAmount,
}) {
  const winnerBig = BigInt(winnerAmount);
  const adminBig = BigInt(adminAmount);
  const appBig = BigInt(appAmount);

  // Filter out empty and get unique user IDs, then sort to avoid deadlocks.
  const uniqueUserIds = [...new Set([winnerId, adminId, appUserId])].filter(Boolean).sort();

  // Lock each user wallet row sequentially
  for (const userId of uniqueUserIds) {
    const user = await coinService.lockUser(tx, userId);
    if (!user) {
      throw new Error(`Failed to lock user during payout: ${userId}`);
    }
  }

  let winnerTx = null;
  if (winnerBig > 0n && winnerId) {
    const res = await coinService.credit(tx, winnerId, winnerBig, 'WIN_REWARD', 'SpinWheel', wheelId);
    winnerTx = res.transaction;
  }

  let adminTx = null;
  if (adminBig > 0n && adminId) {
    const res = await coinService.credit(tx, adminId, adminBig, 'ADMIN_REWARD', 'SpinWheel', wheelId);
    adminTx = res.transaction;
  }

  let appTx = null;
  if (appBig > 0n && appUserId) {
    const res = await coinService.credit(tx, appUserId, appBig, 'APP_COMMISSION', 'SpinWheel', wheelId);
    appTx = res.transaction;
  }

  // Update participant status for the winner
  await tx.wheelParticipant.update({
    where: {
      wheelId_userId: {
        wheelId,
        userId: winnerId,
      },
    },
    data: {
      isWinner: true,
    },
  });

  // Mark wheel as completed and save the winnerId
  const completedWheel = await tx.spinWheel.update({
    where: { id: wheelId },
    data: {
      status: 'COMPLETED',
      winnerId,
      endedAt: new Date(),
    },
  });

  return {
    wheel: completedWheel,
    winnerTx,
    adminTx,
    appTx,
  };
}

module.exports = {
  settlePayout,
};
