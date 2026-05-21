const express = require('express');
const prisma = require('../../db/prisma');
const socketServer = require('../../websocket/socket.server');

const router = express.Router();

// Helper to safely format BigInts to Numbers
function formatTx(tx) {
  return {
    ...tx,
    amount: Number(tx.amount),
    balanceBefore: Number(tx.balanceBefore),
    balanceAfter: Number(tx.balanceAfter),
  };
}

// 1. POST /wallets/deposit - Top up balance
router.post('/wallets/deposit', async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  const depositAmount = Number(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ error: 'Valid positive amount is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock and retrieve user wallet
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error('User not found');

      const amountBI = BigInt(Math.floor(depositAmount));
      const balanceBefore = user.coins;
      const balanceAfter = balanceBefore + amountBI;

      // 2. Update user's coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: balanceAfter },
      });

      // 3. Log the deposit transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: amountBI,
          balanceBefore,
          balanceAfter,
          referenceType: 'MANUAL',
        },
      });

      return { updatedUser, transaction };
    });

    // 4. Broadcast live wallet update to the user
    socketServer.emitToUser(userId, 'walletUpdated', {
      userId,
      coins: result.transaction.balanceAfter,
    });

    res.status(200).json({
      success: true,
      balance: Number(result.updatedUser.coins),
      transaction: formatTx(result.transaction),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. POST /wallets/withdraw - Retrieve funds
router.post('/wallets/withdraw', async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ error: 'Valid positive amount is required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock and retrieve user wallet
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error('User not found');

      const amountBI = BigInt(Math.floor(withdrawAmount));
      if (user.coins < amountBI) {
        throw new Error('Insufficient balance to perform withdrawal');
      }

      const balanceBefore = user.coins;
      const balanceAfter = balanceBefore - amountBI;

      // 2. Update user's coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: balanceAfter },
      });

      // 3. Log the withdrawal transaction (negative amount)
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: -amountBI,
          balanceBefore,
          balanceAfter,
          referenceType: 'MANUAL',
        },
      });

      return { updatedUser, transaction };
    });

    // 4. Broadcast live wallet update to the user
    socketServer.emitToUser(userId, 'walletUpdated', {
      userId,
      coins: result.transaction.balanceAfter,
    });

    res.status(200).json({
      success: true,
      balance: Number(result.updatedUser.coins),
      transaction: formatTx(result.transaction),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. GET /wallets/transactions - Get list of transaction logs
router.get('/wallets/transactions', async (req, res) => {
  const userId = req.user.id;

  try {
    const txs = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(txs.map(formatTx));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /wallets/summary - Get summary metrics (Liquidity & Available coins)
router.get('/wallets/summary', async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate simulated overall system liquidity or volume
    const sumResult = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    });

    const totalSystemLiquidity = Number(sumResult._sum.amount || 0n) + 1280450; // Mock base + dynamic

    res.json({
      totalLiquidity: Math.max(1280450, totalSystemLiquidity),
      availableCoins: Number(user.coins),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
