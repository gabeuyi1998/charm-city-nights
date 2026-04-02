import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/manager/dashboard
router.get(
  '/dashboard',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const bar = await prisma.bar.findFirst({ where: { ownerId: req.user!.id } });
      if (!bar) {
        res.status(404).json({ error: 'No bar found for this manager' });
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [todayCheckins, vouchersRedeemed, videoViewsAgg, pendingVideos] =
        await Promise.all([
          prisma.checkIn.count({
            where: { barId: bar.id, createdAt: { gte: todayStart } },
          }),
          prisma.voucher.count({
            where: {
              barId: bar.id,
              status: 'REDEEMED',
              redeemedAt: { gte: todayStart },
            },
          }),
          prisma.video.aggregate({
            where: { barId: bar.id, status: 'APPROVED' },
            _sum: { views: true },
          }),
          prisma.video.count({
            where: { barId: bar.id, status: 'PENDING' },
          }),
        ]);

      res.json({
        data: {
          bar,
          todayCheckins,
          vouchersRedeemed,
          videoViews: videoViewsAgg._sum.views ?? 0,
          pendingVideos,
          currentCrowd: bar.currentCrowd,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/manager/analytics?period=7d|30d
router.get(
  '/analytics',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const bar = await prisma.bar.findFirst({ where: { ownerId: req.user!.id } });
      if (!bar) {
        res.status(404).json({ error: 'No bar found' });
        return;
      }

      const period = (req.query.period as string) === '30d' ? 30 : 7;
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

      const [checkins, topUsers] = await Promise.all([
        prisma.checkIn.findMany({
          where: { barId: bar.id, createdAt: { gte: since } },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.checkIn.groupBy({
          by: ['userId'],
          where: { barId: bar.id, createdAt: { gte: since } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      res.json({ data: { checkins, topUsers, period } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
