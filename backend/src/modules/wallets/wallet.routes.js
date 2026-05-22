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
// 5. GET /wallets/stats - Get user's real game performance stats
router.get('/wallets/stats', async (req, res) => {
  const userId = req.user.id;

  try {
    // Count total games played (wheels the user participated in that are COMPLETED or ABORTED)
    const gamesPlayed = await prisma.wheelParticipant.count({
      where: {
        userId,
        wheel: {
          status: { in: ['COMPLETED', 'ABORTED'] },
        },
      },
    });

    // Count total wins
    const totalWins = await prisma.wheelParticipant.count({
      where: {
        userId,
        isWinner: true,
      },
    });

    const totalLosses = Math.max(0, gamesPlayed - totalWins);

    // Win/Loss rate
    const winRate = gamesPlayed > 0 ? Math.round((totalWins / gamesPlayed) * 100) : 0;
    const lossRate = gamesPlayed > 0 ? 100 - winRate : 0;

    // Net profit: sum of all WIN_REWARD credits minus all JOIN_DEBIT debits
    const [winRewards, joinDebits, refunds] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'WIN_REWARD' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'JOIN_DEBIT' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'REFUND' },
        _sum: { amount: true },
      }),
    ]);

    const totalWinnings = Number(winRewards._sum.amount || 0n);
    const totalDebits = Number(joinDebits._sum.amount || 0n); // negative values
    const totalRefunds = Number(refunds._sum.amount || 0n);
    const netProfit = totalWinnings + totalDebits + totalRefunds;

    res.json({
      gamesPlayed,
      totalWins,
      totalLosses,
      winRate,
      lossRate,
      netProfit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
