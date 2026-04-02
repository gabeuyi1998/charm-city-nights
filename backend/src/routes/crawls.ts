import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/crawls — all active routes with user progress
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const routes = await prisma.crawlRoute.findMany({
      where: { isActive: true },
      include: {
        stops: {
          include: {
            bar: { select: { id: true, name: true, emoji: true, neighborhood: true } },
          },
          orderBy: { order: 'asc' },
        },
        progress: { where: { userId } },
      },
    });
    res.json({ data: routes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/crawls/:id
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const route = await prisma.crawlRoute.findUnique({
      where: { id: req.params.id },
      include: {
        stops: { include: { bar: true }, orderBy: { order: 'asc' } },
        progress: { where: { userId } },
      },
    });
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    res.json({ data: route });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crawls/:id/join
router.post('/:id/join', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const routeId = req.params.id;

    const route = await prisma.crawlRoute.findUnique({ where: { id: routeId } });
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    const progress = await prisma.crawlProgress.upsert({
      where: { userId_routeId: { userId, routeId } },
      create: { userId, routeId },
      update: {},
    });

    res.status(201).json({ data: progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/crawls/:id/checkin/:barId — mark a stop complete
router.post(
  '/:id/checkin/:barId',
  verifyToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id: routeId, barId } = req.params;

      const route = await prisma.crawlRoute.findUnique({
        where: { id: routeId },
        include: { stops: true },
      });
      if (!route) {
        res.status(404).json({ error: 'Route not found' });
        return;
      }

      const isValidStop = route.stops.some((s: { barId: string }) => s.barId === barId);
      if (!isValidStop) {
        res.status(400).json({ error: 'Bar is not a stop on this route' });
        return;
      }

      const existing = await prisma.crawlProgress.findUnique({
        where: { userId_routeId: { userId, routeId } },
      });
      if (!existing) {
        res.status(400).json({ error: 'Join the crawl first' });
        return;
      }

      const updatedStops = existing.completedStops.includes(barId)
        ? existing.completedStops
        : [...existing.completedStops, barId];

      const allComplete = route.stops.every((s: { barId: string }) => updatedStops.includes(s.barId));

      const progress = await prisma.crawlProgress.update({
        where: { userId_routeId: { userId, routeId } },
        data: {
          completedStops: updatedStops,
          isComplete: allComplete,
          ...(allComplete && { completedAt: new Date() }),
        },
      });

      let voucherGenerated = null;
      if (allComplete) {
        await prisma.user.update({
          where: { id: userId },
          data: { xp: { increment: route.totalXp } },
        });
        voucherGenerated = await prisma.voucher.create({
          data: {
            userId,
            barId: route.stops[0].barId,
            type: 'crawl_completion',
            value: 1,
            description: `Completed: ${route.name}!`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      res.json({ data: { progress, completed: allComplete, voucherGenerated } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
