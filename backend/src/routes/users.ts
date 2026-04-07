import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// PATCH /api/users/me
router.patch('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, bio } = req.body as { displayName?: string; bio?: string };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
      },
    });
    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/onboard
router.patch('/onboard', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, homeNeighborhood, ageVerified, pushToken } = req.body as {
      displayName?: string;
      homeNeighborhood?: string;
      ageVerified?: boolean;
      pushToken?: string;
    };

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(homeNeighborhood !== undefined && { homeNeighborhood }),
        ...(ageVerified !== undefined && { ageVerified }),
        ...(pushToken !== undefined && { pushToken }),
      },
    });

    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/leaderboard — top 10 by XP
router.get('/leaderboard', async (_req, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        xp: true,
        level: true,
        _count: { select: { userBadges: true, checkIns: true } },
      },
      orderBy: { xp: 'desc' },
      take: 10,
    });
    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/profile — public profile
router.get('/:id/profile', async (req, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        xp: true,
        level: true,
        homeNeighborhood: true,
        createdAt: true,
        _count: { select: { userBadges: true, checkIns: true } },
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.id;

    if (followerId === followingId) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const follow = await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

    res.status(201).json({ data: follow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.follow.deleteMany({
      where: { followerId: req.user!.id, followingId: req.params.id },
    });
    res.json({ data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/followers
router.get('/:id/followers', async (req, res: Response): Promise<void> => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: req.params.id },
      include: {
        follower: { select: { id: true, username: true, avatar: true, xp: true } },
      },
    });
    res.json({ data: follows.map((f: { follower: unknown }) => f.follower) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/following
router.get('/:id/following', async (req, res: Response): Promise<void> => {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: req.params.id },
      include: {
        following: { select: { id: true, username: true, avatar: true, xp: true } },
      },
    });
    res.json({ data: follows.map((f: { following: unknown }) => f.following) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
