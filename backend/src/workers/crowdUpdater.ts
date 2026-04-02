import cron from 'node-cron';
import prisma from '../lib/prisma';
import { io } from '../index';

const MAX_EXPECTED_CHECKINS = 50;

// Every 5 minutes — recalculate crowd levels from recent check-ins
cron.schedule('*/5 * * * *', async () => {
  try {
    const bars = await prisma.bar.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await Promise.all(
      bars.map(async ({ id: barId }: { id: string }) => {
        const count = await prisma.checkIn.count({
          where: { barId, createdAt: { gt: cutoff } },
        });

        const crowd = Math.min(
          Math.round((count / MAX_EXPECTED_CHECKINS) * 100),
          99,
        );

        await prisma.bar.update({
          where: { id: barId },
          data: { currentCrowd: crowd },
        });

        io.to(`bar:${barId}`).emit('crowd:update', { barId, currentCrowd: crowd });
      }),
    );
  } catch (err) {
    console.error('CrowdUpdater error:', err);
  }
});

console.log('🔄 CrowdUpdater worker started — runs every 5 minutes');
