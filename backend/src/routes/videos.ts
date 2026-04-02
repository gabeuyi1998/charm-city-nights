import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken, requireRole } from '../middleware/auth';
import { videoUpload } from '../middleware/upload';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/videos/upload
router.post(
  '/upload',
  verifyToken,
  videoUpload.single('video'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { barId, duration } = req.body as { barId: string; duration?: string };

      if (!req.file || !barId) {
        res.status(400).json({ error: 'video file and barId are required' });
        return;
      }

      const bar = await prisma.bar.findUnique({ where: { id: barId } });
      if (!bar) {
        res.status(404).json({ error: 'Bar not found' });
        return;
      }

      const video = await prisma.video.create({
        data: {
          userId: req.user!.id,
          barId,
          localPath: req.file.path,
          duration: parseInt(duration ?? '0', 10),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({ data: video });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/videos/bar/:barId — approved videos for a bar
router.get('/bar/:barId', async (req, res: Response): Promise<void> => {
  try {
    const videos = await prisma.video.findMany({
      where: { barId: req.params.barId, status: 'APPROVED' },
      include: {
        user: { select: { username: true, avatar: true } },
      },
      orderBy: { views: 'desc' },
      take: 20,
    });
    res.json({ data: videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/videos/:id/approve
router.patch(
  '/:id/approve',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req, res: Response): Promise<void> => {
    try {
      const video = await prisma.video.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED' },
      });
      res.json({ data: video });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// PATCH /api/videos/:id/flag
router.patch(
  '/:id/flag',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req, res: Response): Promise<void> => {
    try {
      const video = await prisma.video.update({
        where: { id: req.params.id },
        data: { status: 'FLAGGED' },
      });
      res.json({ data: video });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
