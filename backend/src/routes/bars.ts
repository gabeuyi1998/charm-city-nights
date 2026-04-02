import { Router, Request, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth';
import { haversineDistanceFeet } from '../services/geo';
import prisma from '../lib/prisma';
import { io } from '../index';

const router = Router();

// GET /api/bars
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lng, neighborhood, vibe } = req.query as {
      lat?: string;
      lng?: string;
      neighborhood?: string;
      vibe?: string;
    };

    const bars = await prisma.bar.findMany({
      where: {
        ...(neighborhood && { neighborhood }),
        ...(vibe && { vibe }),
      },
      include: {
        specials: {
          where: { expiresAt: { gt: new Date() } },
        },
        _count: {
          select: { vouchers: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const result = bars.map((bar) => ({
      ...bar,
      activeSpecials: bar.specials,
      currentCrowd: bar.currentCrowd,
      distance:
        userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)
          ? Math.round(haversineDistanceFeet(userLat, userLng, bar.latitude, bar.longitude))
          : null,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bars/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const bar = await prisma.bar.findUnique({
      where: { id },
      include: {
        specials: {
          where: { expiresAt: { gt: new Date() } },
        },
        videos: {
          where: { status: 'APPROVED' },
          orderBy: { views: 'desc' },
          take: 10,
        },
        _count: {
          select: { vouchers: { where: { status: 'ACTIVE' } } },
        },
      },
    });

    if (!bar) {
      res.status(404).json({ error: 'Bar not found' });
      return;
    }

    res.json({
      data: {
        ...bar,
        activeVoucherCount: bar._count.vouchers,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/bars/:id/crowd
router.patch(
  '/:id/crowd',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { currentCrowd } = req.body as { currentCrowd: number };

      if (typeof currentCrowd !== 'number' || currentCrowd < 0) {
        res.status(400).json({ error: 'currentCrowd must be a non-negative number' });
        return;
      }

      const bar = await prisma.bar.update({
        where: { id },
        data: { currentCrowd },
      });

      // Broadcast crowd update via socket.io
      io.to(`bar:${id}`).emit('crowd:update', { barId: id, currentCrowd });

      res.json({ data: bar });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/bars/:id/special
router.post(
  '/:id/special',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { text, expiresAt } = req.body as { text: string; expiresAt: string };

      if (!text || !expiresAt) {
        res.status(400).json({ error: 'text and expiresAt are required' });
        return;
      }

      const bar = await prisma.bar.findUnique({ where: { id } });
      if (!bar) {
        res.status(404).json({ error: 'Bar not found' });
        return;
      }

      const special = await prisma.special.create({
        data: {
          barId: id,
          text,
          expiresAt: new Date(expiresAt),
        },
      });

      // Placeholder: push notification to nearby users would go here
      // e.g. AWS Pinpoint integration

      res.status(201).json({ data: special });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
