const prisma = require('../db/prisma');
const wheelService = require('../services/wheel.service');
const socketServer = require('../websocket/socket.server');

async function process(job) {
  const { wheelId } = job.data;

  // Read current wheel participant count
  const wheel = await prisma.spinWheel.findUnique({
    where: { id: wheelId },
    include: {
      participants: true,
    },
  });

  if (!wheel) {
    console.error(`[wheelStart] Wheel not found: ${wheelId}`);
    return;
  }

  // If the wheel has already been manually started or aborted, noop
  if (wheel.status !== 'WAITING') {
    console.log(`[wheelStart] Wheel ${wheelId} is already in status ${wheel.status}, skipping auto-start.`);
    return;
  }

  const participantCount = wheel.participants.length;

  if (participantCount >= wheel.minPlayers) {
    console.log(`[wheelStart] Auto-starting wheel ${wheelId} after 3-minute timer with ${participantCount} players.`);
    const startedWheel = await wheelService.startWheel(wheelId);
    
    // Broadcast the starting event to the wheel room
    socketServer.emitToWheel(wheelId, 'gameStarted', {
      wheelId,
      status: startedWheel.status,
      startedAt: startedWheel.startedAt,
      nextEliminationAt: startedWheel.nextEliminationAt,
      currentRound: startedWheel.currentRound,
    });

    // Also broadcast globally so all users know
    socketServer.broadcast('gameStarted', {
      wheelId,
      status: startedWheel.status,
      startedAt: startedWheel.startedAt,
      nextEliminationAt: startedWheel.nextEliminationAt,
      currentRound: startedWheel.currentRound,
    });
  } else {
    console.log(`[wheelStart] Auto-aborting wheel ${wheelId} after 3-minute timer: only ${participantCount}/${wheel.minPlayers} players joined. Refunding all participants.`);
    const abortedWheel = await wheelService.abortWheel(wheelId);

    // Broadcast abort event to wheel room (matches frontend SOCKET_EVENTS.GAME_ABORTED)
    socketServer.emitToWheel(wheelId, 'gameAborted', {
      wheelId,
      status: abortedWheel.status,
      message: `Aborted: minimum ${wheel.minPlayers} players required, only ${participantCount} joined. Entry fees are being refunded.`,
    });

    // Also broadcast globally so UI clears for all users
    socketServer.broadcast('gameAborted', {
      wheelId,
      status: abortedWheel.status,
      message: `Aborted: minimum ${wheel.minPlayers} players required, only ${participantCount} joined. Entry fees are being refunded.`,
    });
  }
}

module.exports = {
  process,
};
