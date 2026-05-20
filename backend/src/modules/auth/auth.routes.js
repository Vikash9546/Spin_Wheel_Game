const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../../db/prisma');
const { jwtSecret } = require('../../config');

const router = express.Router();

function generateToken(user, role = 'user') {
  return jwt.sign(
    { id: user.id, name: user.name, role },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// User Registration
router.post('/register', async (req, res) => {
  const { name, coins } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        coins: BigInt(coins || 0),
      },
    });
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login (Passwordless for demonstration/testing)
router.post('/login', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed Endpoint for testing and manual validation
router.post('/seed', async (req, res) => {
  try {
    const appUser = await prisma.user.upsert({
      where: { id: 'SYSTEM_APP' },
      update: {},
      create: {
        id: 'SYSTEM_APP',
        name: 'System App Wallet',
        coins: 0n,
      },
    });

    const admin = await prisma.user.upsert({
      where: { id: 'test-admin-id' },
      update: { coins: 10000n },
      create: {
        id: 'test-admin-id',
        name: 'Admin User',
        coins: 10000n,
      },
    });

    const user1 = await prisma.user.upsert({
      where: { id: 'test-user-1-id' },
      update: { coins: 5000n },
      create: {
        id: 'test-user-1-id',
        name: 'Player 1',
        coins: 5000n,
      },
    });

    const user2 = await prisma.user.upsert({
      where: { id: 'test-user-2-id' },
      update: { coins: 5000n },
      create: {
        id: 'test-user-2-id',
        name: 'Player 2',
        coins: 5000n,
      },
    });

    const user3 = await prisma.user.upsert({
      where: { id: 'test-user-3-id' },
      update: { coins: 5000n },
      create: {
        id: 'test-user-3-id',
        name: 'Player 3',
        coins: 5000n,
      },
    });

    res.json({
      admin: { user: admin, token: generateToken(admin, 'admin') },
      user1: { user: user1, token: generateToken(user1) },
      user2: { user: user2, token: generateToken(user2) },
      user3: { user: user3, token: generateToken(user3) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
