const prisma = require('../db/prisma');
const wheelService = require('../services/wheel.service');
const socketServer = require('../websocket/socket.server');

async function process(job) {
  const { wheelId, round } = job.data;

  console.log(`[elimination] Processing round ${round} for wheel ${wheelId}`);

  const result = await wheelService.eliminatePlayer(wheelId, round);

  if (result.noop) {
    console.log(`[elimination] No-op: ${result.message}`);
    return;
  }

  const { completed, eliminatedUserId } = result;

  if (completed) {
    const { winnerId, settlement } = result;
    console.log(`[elimination] Game completed! Winner: ${winnerId}, Wheel: ${wheelId}`);

    // Broadcast player elimination
    socketServer.emitToWheel(wheelId, 'playerEliminated', {
      wheelId,
      eliminatedUserId,
      round,
      isWinnerDeclared: true,
    });

    // Broadcast winner declaration
    socketServer.emitToWheel(wheelId, 'winnerDeclared', {
      wheelId,
      winnerId,
      status: 'COMPLETED',
      winnerPool: result.wheel.winnerPool,
      adminPool: result.wheel.adminPool,
      appPool: result.wheel.appPool,
    });

    // Fetch and broadcast wallet updates for winner, admin, and app commission
    const userIdsToUpdate = [...new Set([winnerId, result.wheel.createdBy, 'SYSTEM_APP'])];
    for (const uId of userIdsToUpdate) {
      const dbUser = await prisma.user.findUnique({ where: { id: uId } });
      if (dbUser) {
        socketServer.emitToUser(uId, 'walletUpdated', {
          userId: uId,
          coins: dbUser.coins,
        });
      }
    }
  } else {
    const { nextRound, nextEliminationAt } = result;
    console.log(`[elimination] Player ${eliminatedUserId} eliminated. Next round: ${nextRound}`);

    // Broadcast player elimination to room
    socketServer.emitToWheel(wheelId, 'playerEliminated', {
      wheelId,
      eliminatedUserId,
      round,
      nextRound,
      nextEliminationAt,
      isWinnerDeclared: false,
    });
  }
}

module.exports = {
  process,
};
