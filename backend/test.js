const assert = require('assert');
const prisma = require('./src/db/prisma');
const coinService = require('./src/services/coin.service');
const wheelService = require('./src/services/wheel.service');
const payoutService = require('./src/services/payout.service');

// Mock socket server to prevent crash when emitting
const socketServer = require('./src/websocket/socket.server');
socketServer.emitToWheel = () => {};
socketServer.emitToUser = () => {};
socketServer.broadcast = () => {};

// Mock Queue to prevent real BullMQ connections during test
const queueModule = require('./src/jobs/queue');
queueModule.getQueue = () => ({
  add: async (name, data, opts) => {
    console.log(`[Mock Queue] Job added: ${name}`, data, opts);
    return { id: 'mock-job-id' };
  }
});

async function runTests() {
  console.log('🧪 Starting Spin Wheel Game Integration Tests...');

  try {
    // 0. Clean DB
    await prisma.transaction.deleteMany();
    await prisma.wheelParticipant.deleteMany();
    await prisma.spinWheel.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Test Users
    console.log('1. Creating test users...');
    const admin = await prisma.user.create({ data: { id: 'admin-id', name: 'Admin', email: 'admin@test.local', passwordHash: 'test-hash', coins: 1000n } });
    const user1 = await prisma.user.create({ data: { id: 'user-1', name: 'Player 1', email: 'user1@test.local', passwordHash: 'test-hash', coins: 1000n } });
    const user2 = await prisma.user.create({ data: { id: 'user-2', name: 'Player 2', email: 'user2@test.local', passwordHash: 'test-hash', coins: 1000n } });
    const user3 = await prisma.user.create({ data: { id: 'user-3', name: 'Player 3', email: 'user3@test.local', passwordHash: 'test-hash', coins: 1000n } });
    const user4 = await prisma.user.create({ data: { id: 'user-4', name: 'Player 4', email: 'user4@test.local', passwordHash: 'test-hash', coins: 1000n } });

    // 2. Verify Single Active Wheel Constraint
    console.log('2. Verifying active wheel constraint...');
    const wheel1 = await wheelService.createWheel(admin.id, 100n);
    assert.strictEqual(wheel1.status, 'WAITING');
    assert.strictEqual(wheel1.entryFee, 100n);

    // Verify we cannot create a second active wheel
    await assert.rejects(
      wheelService.createWheel(admin.id, 150n),
      /An active wheel already exists/
    );

    // 3. Verify Join Flow
    console.log('3. Verifying join flow...');
    await wheelService.joinWheel(user1.id, wheel1.id);
    await wheelService.joinWheel(user2.id, wheel1.id);
    await wheelService.joinWheel(user3.id, wheel1.id);

    // Check balances
    const u1 = await prisma.user.findUnique({ where: { id: user1.id } });
    const u2 = await prisma.user.findUnique({ where: { id: user2.id } });
    const u3 = await prisma.user.findUnique({ where: { id: user3.id } });
    assert.strictEqual(u1.coins, 900n);
    assert.strictEqual(u2.coins, 900n);
    assert.strictEqual(u3.coins, 900n);

    // Check wheel pools
    const updatedWheel = await prisma.spinWheel.findUnique({ where: { id: wheel1.id } });
    // entry fee = 100.
    // winner percentage = 70 => 70
    // admin percentage = 15 => 15
    // app percentage = 15 => 15
    // 3 players joined => winner pool = 210, admin pool = 45, app pool = 45
    assert.strictEqual(updatedWheel.winnerPool, 210n);
    assert.strictEqual(updatedWheel.adminPool, 45n);
    assert.strictEqual(updatedWheel.appPool, 45n);

    // Verify duplicate join prevention
    await assert.rejects(
      wheelService.joinWheel(user1.id, wheel1.id),
      /has already joined/
    );

    // 4. Verify Concurrent Joins (Simulate race conditions)
    console.log('4. Verifying concurrent joins...');
    // User 4 tries to join multiple times concurrently
    const joins = await Promise.allSettled([
      wheelService.joinWheel(user4.id, wheel1.id),
      wheelService.joinWheel(user4.id, wheel1.id),
      wheelService.joinWheel(user4.id, wheel1.id)
    ]);
    const fulfilled = joins.filter(r => r.status === 'fulfilled');
    const rejected = joins.filter(r => r.status === 'rejected');
    
    // Exactly one should succeed, others fail due to unique constraint or balance lock checks
    assert.strictEqual(fulfilled.length, 1);
    assert.strictEqual(rejected.length, 2);

    const u4 = await prisma.user.findUnique({ where: { id: user4.id } });
    assert.strictEqual(u4.coins, 900n); // Deducted only once!

    // 5. Verify Game Start and Elimination Order (Fisher-Yates)
    console.log('5. Verifying game start and elimination order...');
    const startedWheel = await wheelService.startWheel(wheel1.id);
    assert.strictEqual(startedWheel.status, 'RUNNING');
    assert.strictEqual(startedWheel.currentRound, 1);
    assert.strictEqual(startedWheel.eliminationOrder.length, 3); // 4 players - 1 winner = 3 eliminated
    console.log(`Generated elimination order: ${startedWheel.eliminationOrder}`);

    // Verify all players in elimination order are unique and members of the game
    const uniqueOrderIds = new Set(startedWheel.eliminationOrder);
    assert.strictEqual(uniqueOrderIds.size, 3);

    // 6. Verify Player Elimination Loop and Settlement
    console.log('6. Verifying elimination loop...');
    // Round 1
    const res1 = await wheelService.eliminatePlayer(wheel1.id, 1);
    assert.strictEqual(res1.completed, false);
    assert.strictEqual(res1.round, 1);
    assert.strictEqual(res1.nextRound, 2);

    // Verify player is marked eliminated
    const p1 = await prisma.wheelParticipant.findUnique({
      where: { wheelId_userId: { wheelId: wheel1.id, userId: res1.eliminatedUserId } }
    });
    assert.ok(p1.eliminatedAt !== null);

    // Round 2
    const res2 = await wheelService.eliminatePlayer(wheel1.id, 2);
    assert.strictEqual(res2.completed, false);

    // Round 3 (Last Round)
    const res3 = await wheelService.eliminatePlayer(wheel1.id, 3);
    assert.strictEqual(res3.completed, true);
    assert.strictEqual(res3.wheel.status, 'COMPLETED');
    assert.ok(res3.winnerId);

    // Verify survivor is the winner
    const winnerParticipant = await prisma.wheelParticipant.findUnique({
      where: { wheelId_userId: { wheelId: wheel1.id, userId: res3.winnerId } }
    });
    assert.strictEqual(winnerParticipant.isWinner, true);
    assert.ok(winnerParticipant.eliminatedAt === null);

    // Check payouts
    // Total players joined = 4. Total pools:
    // winnerPool = 280, adminPool = 60, appPool = 60
    const winnerCoins = await prisma.user.findUnique({ where: { id: res3.winnerId } });
    const adminCoins = await prisma.user.findUnique({ where: { id: admin.id } });
    const appCoins = await prisma.user.findUnique({ where: { id: 'SYSTEM_APP' } });

    // Winner starts with 900, wins 280 => 1180
    assert.strictEqual(winnerCoins.coins, 1180n);
    // Admin starts with 1000, receives 60 admin reward => 1060
    assert.strictEqual(adminCoins.coins, 1060n);
    // App starts with 0, receives 60 commission => 60
    assert.strictEqual(appCoins.coins, 60n);

    console.log('✅ All integration tests passed successfully!');

    // Restore standard dev database seeding so the local browser UI isn't broken
    console.log('🔄 Restoring standard dev/admin users seed data...');
    const crypto = require('crypto');
    const { promisify } = require('util');
    const scrypt = promisify(crypto.scrypt);
    const hashPassword = async (pwd) => {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await scrypt(pwd, salt, 64);
      return `${salt}:${hash.toString('hex')}`;
    };

    const systemPasswordHash = await hashPassword(crypto.randomUUID());
    const adminPasswordHash = await hashPassword('admin123');
    const playerPasswordHash = await hashPassword('player123');

    await prisma.user.upsert({
      where: { id: 'SYSTEM_APP' },
      update: { email: 'system@app.local', passwordHash: systemPasswordHash },
      create: {
        id: 'SYSTEM_APP',
        name: 'System App Wallet',
        email: 'system@app.local',
        passwordHash: systemPasswordHash,
        coins: 0n,
      },
    });

    await prisma.user.upsert({
      where: { id: 'test-admin-id' },
      update: { email: 'admin@eliminator.local', passwordHash: adminPasswordHash, coins: 10000n },
      create: {
        id: 'test-admin-id',
        name: 'Admin User',
        role: 'admin',
        email: 'admin@eliminator.local',
        passwordHash: adminPasswordHash,
        coins: 10000n,
      },
    });

    for (let i = 1; i <= 3; i++) {
      await prisma.user.upsert({
        where: { id: `test-user-${i}-id` },
        update: { email: `player${i}@eliminator.local`, passwordHash: playerPasswordHash, coins: 5000n },
        create: {
          id: `test-user-${i}-id`,
          name: `Player ${i}`,
          email: `player${i}@eliminator.local`,
          passwordHash: playerPasswordHash,
          coins: 5000n,
        },
      });
    }
    console.log('✅ Dev/admin database state restored.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration tests failed:', err);
    process.exit(1);
  }
}

runTests();
