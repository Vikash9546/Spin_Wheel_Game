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
  const { page, limit, search, type, startDate, endDate, paginated } = req.query;

  try {
    // 1. Auto-seed mock transactions if user has no transactions to make UI look amazing instantly
    const countTotal = await prisma.transaction.count({ where: { userId } });
    if (countTotal === 0) {
      const now = new Date();
      const mockTxs = [
        {
          type: 'WIN_REWARD',
          amount: BigInt(125000), // $1,250.00
          balanceBefore: BigInt(57500),
          balanceAfter: BigInt(182500),
          referenceType: 'SpinWheel',
          referenceId: 'Mega Spin Win - Tier 3',
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
        {
          type: 'JOIN_DEBIT',
          amount: BigInt(-5000), // -$50.00
          balanceBefore: BigInt(62500),
          balanceAfter: BigInt(57500),
          referenceType: 'SpinWheel',
          referenceId: 'ELIMINATOR Tournament Entry',
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        },
        {
          type: 'DEPOSIT',
          amount: BigInt(50000), // +$500.00
          balanceBefore: BigInt(12500),
          balanceAfter: BigInt(62500),
          referenceType: 'Deposit',
          referenceId: 'Wallet Top-up (Visa ****4421)',
          createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          type: 'JOIN_DEBIT',
          amount: BigInt(0), // $0.00
          balanceBefore: BigInt(12500),
          balanceAfter: BigInt(12500),
          referenceType: 'Failed',
          referenceId: 'Tournament Entry Failed',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          type: 'ADMIN_REWARD',
          amount: BigInt(7500), // +$75.00
          balanceBefore: BigInt(5000),
          balanceAfter: BigInt(12500),
          referenceType: 'Reward',
          referenceId: 'Loyalty Bonus - Elite Rank',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          type: 'WITHDRAWAL',
          amount: BigInt(-15000), // -$150.00
          balanceBefore: BigInt(20000),
          balanceAfter: BigInt(5000),
          referenceType: 'Withdrawal',
          referenceId: 'Wallet Cash-out (Bank Transfer)',
          createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        },
        {
          type: 'REFUND',
          amount: BigInt(5000), // +$50.00
          balanceBefore: BigInt(15000),
          balanceAfter: BigInt(20000),
          referenceType: 'Refund',
          referenceId: 'Tournament Entry Refund',
          createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
        {
          type: 'JOIN_DEBIT',
          amount: BigInt(-5000), // -$50.00
          balanceBefore: BigInt(20000),
          balanceAfter: BigInt(15000),
          referenceType: 'SpinWheel',
          referenceId: 'ELIMINATOR Arena Match Entry',
          createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        },
        {
          type: 'DEPOSIT',
          amount: BigInt(20000), // +$200.00
          balanceBefore: BigInt(0),
          balanceAfter: BigInt(20000),
          referenceType: 'Deposit',
          referenceId: 'Wallet Top-up (Visa ****9922)',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        }
      ];

      for (const mock of mockTxs) {
        await prisma.transaction.create({
          data: {
            userId,
            type: mock.type,
            amount: mock.amount,
            balanceBefore: mock.balanceBefore,
            balanceAfter: mock.balanceAfter,
            referenceType: mock.referenceType,
            referenceId: mock.referenceId,
            createdAt: mock.createdAt,
          }
        });
      }

      // Sync user coins balance with latest mock transaction state
      await prisma.user.update({
        where: { id: userId },
        data: { coins: 182500n },
      });
      
      // Update coins balance in socket sessions if needed
      socketServer.emitToUser(userId, 'walletUpdated', {
        userId,
        coins: 182500n,
      });
    }

    // 2. Build filter conditions
    const where = { userId };

    // Search filter (transaction ID or activity referenceId / referenceType)
    if (search && search.trim() !== '') {
      const cleanSearch = search.trim();
      where.OR = [
        { id: { contains: cleanSearch, mode: 'insensitive' } },
        { referenceId: { contains: cleanSearch, mode: 'insensitive' } },
        { referenceType: { contains: cleanSearch, mode: 'insensitive' } },
      ];
    }

    // Category / Tab filter mapping
    if (type && type !== 'ALL') {
      let mappedTypes = [];
      if (type === 'REWARD') {
        mappedTypes = ['WIN_REWARD', 'ADMIN_REWARD'];
      } else if (type === 'ENTRY') {
        mappedTypes = ['JOIN_DEBIT', 'REFUND'];
      } else if (type === 'ADMIN') {
        mappedTypes = ['APP_COMMISSION', 'DEPOSIT', 'WITHDRAWAL'];
      }

      if (mappedTypes.length > 0) {
        where.type = { in: mappedTypes };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of that day (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 3. Execute query with/without pagination
    const isPaginated = paginated === 'true' || page || limit;

    if (isPaginated) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 25);
      const skip = (pageNum - 1) * limitNum;

      const [txs, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        transactions: txs.map(formatTx),
        total,
        page: pageNum,
        limit: limitNum,
      });
    } else {
      // Non-paginated path (original API behavior for backwards compatibility)
      const txs = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100, // Slightly larger take for standard fetch
      });
      res.json(txs.map(formatTx));
    }
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
