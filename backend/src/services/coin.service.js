const prisma = require('../db/prisma');

/**
 * Lock user row using SELECT FOR UPDATE and retrieve the user.
 * @param {object} tx - Prisma transaction client
 * @param {string} userId - ID of the user to lock
 * @returns {Promise<object>} The locked user object
 */
async function lockUser(tx, userId) {
  await tx.$executeRaw`SELECT 1 FROM "users" WHERE id = ${userId} FOR UPDATE`;
  return await tx.user.findUnique({ where: { id: userId } });
}

/**
 * Atomic debit operation.
 * @param {object} tx - Prisma transaction client
 * @param {string} userId - User ID
 * @param {bigint} amount - Amount to deduct (positive bigint)
 * @param {string} type - TransactionType enum value
 * @param {string} referenceType - E.g. 'SpinWheel'
 * @param {string} referenceId - Related entity ID
 */
async function debit(tx, userId, amount, type, referenceType, referenceId) {
  const bigintAmount = BigInt(amount);
  if (bigintAmount <= 0n) {
    throw new Error('Debit amount must be greater than zero');
  }

  const user = await lockUser(tx, userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const balanceBefore = user.coins;
  if (balanceBefore < bigintAmount) {
    throw new Error(`Insufficient balance for user ${userId}. Required: ${bigintAmount.toString()}, Available: ${balanceBefore.toString()}`);
  }

  const balanceAfter = balanceBefore - bigintAmount;

  // Update user coins
  await tx.user.update({
    where: { id: userId },
    data: { coins: balanceAfter },
  });

  // Create append-only ledger transaction record
  const transaction = await tx.transaction.create({
    data: {
      userId,
      type,
      amount: -bigintAmount,
      balanceBefore,
      balanceAfter,
      referenceType,
      referenceId,
    },
  });

  return { user, transaction };
}

/**
 * Atomic credit operation.
 * @param {object} tx - Prisma transaction client
 * @param {string} userId - User ID
 * @param {bigint} amount - Amount to credit (positive bigint)
 * @param {string} type - TransactionType enum value
 * @param {string} referenceType - E.g. 'SpinWheel'
 * @param {string} referenceId - Related entity ID
 */
async function credit(tx, userId, amount, type, referenceType, referenceId) {
  const bigintAmount = BigInt(amount);
  if (bigintAmount <= 0n) {
    throw new Error('Credit amount must be greater than zero');
  }

  const user = await lockUser(tx, userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const balanceBefore = user.coins;
  const balanceAfter = balanceBefore + bigintAmount;

  // Update user coins
  await tx.user.update({
    where: { id: userId },
    data: { coins: balanceAfter },
  });

  // Create append-only ledger transaction record
  const transaction = await tx.transaction.create({
    data: {
      userId,
      type,
      amount: bigintAmount,
      balanceBefore,
      balanceAfter,
      referenceType,
      referenceId,
    },
  });

  return { user, transaction };
}

/**
 * Get or create the SYSTEM_APP system user.
 * @param {object} tx - Prisma transaction client
 * @returns {Promise<object>} The system app user object
 */
async function getOrCreateSystemAppUser(tx) {
  const systemAppId = 'SYSTEM_APP';
  let systemUser = await tx.user.findUnique({ where: { id: systemAppId } });
  if (!systemUser) {
    systemUser = await tx.user.create({
      data: {
        id: systemAppId,
        name: 'System App Wallet',
        coins: 0n,
      },
    });
  }
  return systemUser;
}

module.exports = {
  lockUser,
  debit,
  credit,
  getOrCreateSystemAppUser,
};
