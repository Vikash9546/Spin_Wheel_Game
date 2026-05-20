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
    console.log(`[wheelStart] Starting wheel ${wheelId} with ${participantCount} players.`);
    const startedWheel = await wheelService.startWheel(wheelId);
    
    // Broadcast the starting event to the room
    socketServer.emitToWheel(wheelId, 'gameStarted', {
      wheelId,
      status: startedWheel.status,
      startedAt: startedWheel.startedAt,
      nextEliminationAt: startedWheel.nextEliminationAt,
      currentRound: startedWheel.currentRound,
    });
  } else {
    console.log(`[wheelStart] Aborting wheel ${wheelId}: only ${participantCount} players joined.`);
    const abortedWheel = await wheelService.abortWheel(wheelId);

    // Broadcast abort event
    socketServer.emitToWheel(wheelId, 'wheelAborted', {
      wheelId,
      status: abortedWheel.status,
      message: `Aborted: minimum players required (${wheel.minPlayers}) was not met. Refunds scheduled.`,
    });
  }
}

module.exports = {
  process,
};
