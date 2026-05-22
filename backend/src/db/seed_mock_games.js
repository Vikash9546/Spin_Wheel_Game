const prisma = require('./prisma');

async function seedMockGamesForUsers() {
  console.log('🏁 Starting mock games seeding...');
  try {
    // Find users who have transactions but 0 wheel participants
    const users = await prisma.user.findMany({
      include: {
        transactions: true,
        _count: {
          select: { wheelParticipants: true }
        }
      }
    });

    const targetUsers = users.filter(
      (u) => u.transactions.length > 0 && u._count.wheelParticipants === 0 && u.id !== 'SYSTEM_APP'
    );

    console.log(`Found ${targetUsers.length} users to seed mock games for.`);

    for (const user of targetUsers) {
      console.log(`Seeding mock games for user: ${user.name} (${user.email})`);
      const userId = user.id;
      const now = new Date();

      // We will seed 3 mock games to match their transactions:
      // 1. A completed game they won (representing the Mega Spin Win of 125,000 coins)
      // 2. A completed game they lost (to make the stats look interesting, e.g. 50% or 33% win rate)
      // 3. An aborted/refunded game (representing the refunded entry fee of 5,000 coins)

      // Game 1: Won game
      const wheel1 = await prisma.spinWheel.create({
        data: {
          status: 'COMPLETED',
          entryFee: 5000n,
          minPlayers: 3,
          winnerPool: 125000n,
          adminPool: 25000n,
          appPool: 25000n,
          startedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
          endedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          createdBy: 'test-admin-id',
          winnerId: userId,
          payoutProcessed: true,
        }
      });

      await prisma.wheelParticipant.create({
        data: {
          wheelId: wheel1.id,
          userId: userId,
          isWinner: true,
          joinedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        }
      });

      // Game 2: Lost game
      const wheel2 = await prisma.spinWheel.create({
        data: {
          status: 'COMPLETED',
          entryFee: 5000n,
          minPlayers: 3,
          winnerPool: 15000n,
          adminPool: 3000n,
          appPool: 3000n,
          startedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
          endedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
          createdBy: 'test-admin-id',
          winnerId: 'test-user-1-id', // Another user won
          payoutProcessed: true,
        }
      });

      await prisma.wheelParticipant.create({
        data: {
          wheelId: wheel2.id,
          userId: userId,
          isWinner: false,
          joinedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          eliminatedAt: new Date(now.getTime() - 4.5 * 60 * 60 * 1000),
        }
      });

      // Game 3: Aborted game (refunded)
      const wheel3 = await prisma.spinWheel.create({
        data: {
          status: 'ABORTED',
          entryFee: 5000n,
          minPlayers: 3,
          winnerPool: 0n,
          adminPool: 0n,
          appPool: 0n,
          startedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          endedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          createdBy: 'test-admin-id',
        }
      });

      await prisma.wheelParticipant.create({
        data: {
          wheelId: wheel3.id,
          userId: userId,
          isWinner: false,
          joinedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        }
      });

      console.log(`Successfully seeded mock games for ${user.name}`);
    }
  } catch (error) {
    console.error('Error during mock games seeding:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🏁 Seeding finished.');
  }
}

// If run directly
if (require.main === module) {
  seedMockGamesForUsers();
}

module.exports = seedMockGamesForUsers;
