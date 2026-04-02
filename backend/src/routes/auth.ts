import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/auth/sync — upsert Cognito user on first login
router.post('/sync', authLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cognitoId, username, displayName, authProvider, email } = req.body as {
      cognitoId: string;
      username: string;
      displayName?: string;
      authProvider?: string;
      email?: string;
    };

    if (!cognitoId || !username) {
      res.status(400).json({ error: 'cognitoId and username are required' });
      return;
    }

    const user = await prisma.user.upsert({
      where: { cognitoId },
      update: {
        username,
        ...(displayName && { displayName }),
        ...(email && { email }),
        ...(authProvider && { authProvider }),
      },
      create: {
        cognitoId,
        username,
        displayName: displayName ?? null,
        email: email ?? null,
        authProvider: authProvider ?? 'cognito',
      },
    });

    res.status(200).json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — return full user profile
router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { userBadges: true },
        },
        crawlProgresses: {
          where: { isComplete: false },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      data: {
        ...user,
        badgeCount: user._count.userBadges,
        activeCrawlsCount: user.crawlProgresses.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/users/onboard — update profile on first use
router.post('/users/onboard', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { displayName, homeNeighborhood, ageVerified } = req.body as {
      displayName?: string;
      homeNeighborhood?: string;
      ageVerified?: boolean;
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(homeNeighborhood !== undefined && { homeNeighborhood }),
        ...(ageVerified !== undefined && { ageVerified }),
      },
    });

    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
