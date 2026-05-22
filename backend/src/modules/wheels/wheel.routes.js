const express = require('express');
const wheelService = require('../../services/wheel.service');
const socketServer = require('../../websocket/socket.server');
const prisma = require('../../db/prisma');

const router = express.Router();

// Admin creates wheel
router.post('/wheels', async (req, res) => {
  // Only admins can create wheels
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only admins can create wheels' });
  }
  const { entryFee } = req.body;
  if (!entryFee) {
    return res.status(400).json({ error: 'entryFee is required' });
  }

  try {
    const wheel = await wheelService.createWheel(req.user.id, entryFee);
    
    // Broadcast creation globally
    socketServer.broadcast('wheelCreated', {
      wheelId: wheel.id,
      entryFee: wheel.entryFee,
      status: wheel.status,
      createdBy: wheel.createdBy,
    });

    res.status(201).json(wheel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User joins wheel
router.post('/wheels/:id/join', async (req, res) => {
  const wheelId = req.params.id;
  const userId = req.user.id;

  try {
    const { wheel, participant, transaction } = await wheelService.joinWheel(userId, wheelId);

    // Fetch participant count and user name for broadcast
    const [participantCount, joiningUser] = await Promise.all([
      prisma.wheelParticipant.count({ where: { wheelId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);

    // Fetch updated wheel with participants and user names
    const updatedWheel = await prisma.spinWheel.findUnique({
      where: { id: wheelId },
      include: {
        participants: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Broadcast userJoined to the wheel room AFTER database commit
    socketServer.emitToWheel(wheelId, 'userJoined', {
      wheelId,
      userId,
      userName: joiningUser?.name || 'Player',
      participantId: participant.id,
      winnerPool: wheel.winnerPool,
      adminPool: wheel.adminPool,
      appPool: wheel.appPool,
      participantCount,
      wheel: updatedWheel,
    });

    // Broadcast walletUpdated to the user AFTER database commit
    socketServer.emitToUser(userId, 'walletUpdated', {
      userId,
      coins: transaction.balanceAfter,
    });

    res.json({ wheel, participant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin/Creator starts wheel manually
router.post('/wheels/:id/start', async (req, res) => {
  const wheelId = req.params.id;

  try {
    const wheel = await prisma.spinWheel.findUnique({ where: { id: wheelId } });
    if (!wheel) {
      return res.status(404).json({ error: 'Wheel not found' });
    }

    // Require creator or admin role
    if (wheel.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only the creator can start this wheel' });
    }

    const startedWheel = await wheelService.startWheel(wheelId);

    // Broadcast gameStarted AFTER database commit
    socketServer.emitToWheel(wheelId, 'gameStarted', {
      wheelId,
      status: startedWheel.status,
      startedAt: startedWheel.startedAt,
      nextEliminationAt: startedWheel.nextEliminationAt,
      currentRound: startedWheel.currentRound,
      wheel: startedWheel,
    });

    res.json(startedWheel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin stops wheel mid-game — refunds all participants
router.post('/wheels/:id/stop', async (req, res) => {
  const wheelId = req.params.id;

  try {
    const wheel = await prisma.spinWheel.findUnique({ where: { id: wheelId } });
    if (!wheel) {
      return res.status(404).json({ error: 'Wheel not found' });
    }

    // Only creator or admin can stop
    if (wheel.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only the creator or admin can stop this wheel' });
    }

    const stoppedWheel = await wheelService.stopWheel(wheelId);

    // Broadcast game aborted to all clients in the room
    socketServer.emitToWheel(wheelId, 'gameAborted', {
      wheelId,
      status: stoppedWheel.status,
      message: 'Game stopped by admin. Refunds are being processed.',
    });

    // Also broadcast globally so UI clears
    socketServer.broadcast('gameAborted', {
      wheelId,
      status: stoppedWheel.status,
      message: 'Game stopped by admin. Refunds are being processed.',
    });

    res.json({ message: 'Game stopped. Refunds are being processed.', wheel: stoppedWheel });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get current active wheel
router.get('/wheels/active/current', async (req, res) => {
  try {
    const activeWheel = await wheelService.getActiveWheel();
    if (!activeWheel) {
      return res.json(null);
    }

    const wheelWithParticipants = await prisma.spinWheel.findUnique({
      where: { id: activeWheel.id },
      include: {
        participants: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    res.json(wheelWithParticipants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wheel history for the authenticated user
router.get('/wheels/history/list', async (req, res) => {
  try {
    const userId = req.user.id;
    // Retrieve wheels where the user participated and the wheel is completed
    const wheels = await prisma.spinWheel.findMany({
      where: { participants: { some: { userId } }, status: { in: ['COMPLETED', 'ABORTED'] } },
      include: { participants: { include: { user: { select: { name: true } } } } },
    });
    res.json(wheels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wheel details by ID
router.get('/wheels/:id', async (req, res) => {
  try {
    const wheel = await prisma.spinWheel.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!wheel) {
      return res.status(404).json({ error: 'Wheel not found' });
    }
    res.json(wheel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
