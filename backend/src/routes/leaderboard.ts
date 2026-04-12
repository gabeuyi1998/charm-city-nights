import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/leaderboard?scope=city|neighborhood
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scope = (req.query.scope as string | undefined) ?? 'city';
    const meId = req.user!.id;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        xp: true,
        level: true,
        homeNeighborhood: true,
      },
      orderBy: { xp: 'desc' },
      take: 20,
    });

    // Neighborhood scope: filter by current user's homeNeighborhood
    let filtered = users;
    if (scope === 'neighborhood') {
      const me = await prisma.user.findUnique({
        where: { id: meId },
        select: { homeNeighborhood: true },
      });
      if (me?.homeNeighborhood) {
        filtered = users.filter(
          (u) => u.homeNeighborhood === me.homeNeighborhood,
        );
      }
    }

    const entries = filtered.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      displayName: u.displayName,
      xp: u.xp,
      level: u.level,
      isMe: u.id === meId,
    }));

    res.json({ data: entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
