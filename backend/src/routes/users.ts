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

// POST /api/users/push-token
router.post('/push-token', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, platform } = req.body as { token?: string; platform?: string };
    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pushToken: token },
    });
    res.json({ data: { success: true, platform } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/notifications
router.get('/notifications', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.body,
        isRead: n.read,
        createdAt: n.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/notifications/:id/read
router.patch('/notifications/:id/read', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: { read: true },
    });
    res.json({ data: { success: true } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/dms — list conversations (grouped by other participant)
router.get('/dms', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meId = req.user!.id;

    // Get latest message per conversation partner
    const sent = await prisma.directMessage.findMany({
      where: { senderId: meId },
      include: { receiver: { select: { id: true, username: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const received = await prisma.directMessage.findMany({
      where: { receiverId: meId },
      include: { sender: { select: { id: true, username: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Build conversations map keyed by other-user id
    const map = new Map<string, {
      id: string;
      participant: { id: string; username: string; displayName: string | null };
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>();

    for (const m of [...sent, ...received]) {
      const other = m.senderId === meId
        ? (m as typeof sent[0]).receiver
        : (m as typeof received[0]).sender;
      if (!map.has(other.id)) {
        const unread = received.filter((r) => r.senderId === other.id && !r.read).length;
        map.set(other.id, {
          id: other.id,
          participant: other,
          lastMessage: m.content,
          lastMessageAt: m.createdAt,
          unreadCount: unread,
        });
      }
    }

    const conversations = Array.from(map.values()).sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );

    res.json({ data: conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/dms/:userId/messages
router.get('/dms/:userId/messages', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meId = req.user!.id;
    const otherId = req.params.userId as string;

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: meId, receiverId: otherId },
          { senderId: otherId, receiverId: meId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark incoming messages as read
    await prisma.directMessage.updateMany({
      where: { senderId: otherId, receiverId: meId, read: false },
      data: { read: true },
    });

    res.json({
      data: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/dms/:userId/messages
router.post('/dms/:userId/messages', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meId = req.user!.id;
    const receiverId = req.params.userId as string;
    const { content } = req.body as { content?: string };

    if (!content?.trim()) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const message = await prisma.directMessage.create({
      data: { senderId: meId, receiverId, content: content.trim() },
    });

    res.status(201).json({
      data: {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
