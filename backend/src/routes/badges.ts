import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/badges — all badges with isCollected flag for current user
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [allBadges, userBadges] = await Promise.all([
      prisma.badge.findMany({
        include: {
          bar: { select: { name: true, neighborhood: true } },
        },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true, collectedAt: true },
      }),
    ]);

    const collectedMap = new Map<string, Date>(
      userBadges.map((ub: { badgeId: string; collectedAt: Date }) => [ub.badgeId, ub.collectedAt]),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (allBadges as any[]).map((b: { id: string }) => ({
      ...b,
      isCollected: collectedMap.has(b.id),
      collectedAt: collectedMap.get(b.id) ?? null,
    }));

    res.json({ data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/badges/my — only collected badges
router.get('/my', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const badges = await prisma.userBadge.findMany({
      where: { userId: req.user!.id },
      include: {
        badge: {
          include: { bar: { select: { name: true, neighborhood: true } } },
        },
      },
      orderBy: { collectedAt: 'desc' },
    });
    res.json({ data: badges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
