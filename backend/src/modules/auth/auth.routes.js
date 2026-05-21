const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const prisma = require('../../db/prisma');
const { jwtSecret } = require('../../config');

const router = express.Router();
const scrypt = promisify(crypto.scrypt);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = String(passwordHash || '').split(':');
  if (!salt || !storedHash) return false;

  try {
    const hash = await scrypt(password, salt, 64);
    const stored = Buffer.from(storedHash, 'hex');
    return stored.length === hash.length && crypto.timingSafeEqual(stored, hash);
  } catch {
    return false;
  }
}

function sanitizeUser(user) {
  if (!user) return user;
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  return safeUser;
}

function generateToken(user, role = 'user') {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// User Registration
router.post('/register', async (req, res) => {
  const { name, email: rawEmail, password, role } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (req.body.coins !== undefined) {
    return res.status(400).json({ error: 'Coins cannot be set during registration' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!role || !['admin','user'].includes(role)) {
    return res.status(400).json({ error: 'Role must be "admin" or "user"' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        passwordHash: await hashPassword(password),
        coins: BigInt(1000),
        role: role && ['admin', 'user'].includes(role) ? role : 'user',
      },
    });
    const token = generateToken(user, user.role);
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = normalizeEmail(rawEmail);

  if (!validateEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user, user.role);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed Endpoint for testing and manual validation
router.post('/seed', async (req, res) => {
  try {
    const systemPasswordHash = await hashPassword(crypto.randomUUID());
    const adminPasswordHash = await hashPassword('admin123');
    const playerPasswordHash = await hashPassword('player123');

    await prisma.user.upsert({
      where: { id: 'SYSTEM_APP' },
      update: {
        email: 'system@app.local',
        passwordHash: systemPasswordHash,
      },
      create: {
        id: 'SYSTEM_APP',
        name: 'System App Wallet',
        email: 'system@app.local',
        passwordHash: systemPasswordHash,
        coins: 0n,
      },
    });

    const admin = await prisma.user.upsert({
      where: { id: 'test-admin-id' },
      update: {
        email: 'admin@eliminator.local',
        passwordHash: adminPasswordHash,
        coins: 10000n,
      },
      create: {
        id: 'test-admin-id',
        name: 'Admin User',
        role: 'admin',
        email: 'admin@eliminator.local',
        passwordHash: adminPasswordHash,
        coins: 10000n,
      },
    });

    const user1 = await prisma.user.upsert({
      where: { id: 'test-user-1-id' },
      update: {
        email: 'player1@eliminator.local',
        passwordHash: playerPasswordHash,
        coins: 5000n,
      },
      create: {
        id: 'test-user-1-id',
        name: 'Player 1',
        email: 'player1@eliminator.local',
        passwordHash: playerPasswordHash,
        coins: 5000n,
      },
    });

    const user2 = await prisma.user.upsert({
      where: { id: 'test-user-2-id' },
      update: {
        email: 'player2@eliminator.local',
        passwordHash: playerPasswordHash,
        coins: 5000n,
      },
      create: {
        id: 'test-user-2-id',
        name: 'Player 2',
        email: 'player2@eliminator.local',
        passwordHash: playerPasswordHash,
        coins: 5000n,
      },
    });

    const user3 = await prisma.user.upsert({
      where: { id: 'test-user-3-id' },
      update: {
        email: 'player3@eliminator.local',
        passwordHash: playerPasswordHash,
        coins: 5000n,
      },
      create: {
        id: 'test-user-3-id',
        name: 'Player 3',
        email: 'player3@eliminator.local',
        passwordHash: playerPasswordHash,
        coins: 5000n,
      },
    });

    res.json({
      admin: { user: sanitizeUser(admin), token: generateToken(admin, 'admin') },
      user1: { user: sanitizeUser(user1), token: generateToken(user1) },
      user2: { user: sanitizeUser(user2), token: generateToken(user2) },
      user3: { user: sanitizeUser(user3), token: generateToken(user3) },
      credentials: {
        admin: { email: 'admin@eliminator.local', password: 'admin123' },
        players: { password: 'player123' },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
