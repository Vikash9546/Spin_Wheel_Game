require('dotenv').config();
const prisma = require('./src/db/prisma');
const wheelService = require('./src/services/wheel.service');

async function main() {
  try {
    const activeWheel = await wheelService.getActiveWheel();
    console.log('Active wheel:', activeWheel);
    
    if (activeWheel) {
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
      console.log('Wheel with participants:', wheelWithParticipants);
    }
  } catch (e) {
    console.error('Error occurred:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
