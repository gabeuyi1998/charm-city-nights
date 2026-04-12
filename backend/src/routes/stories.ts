import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
const BUCKET = process.env.S3_BUCKET ?? 'ccn-stories';
const CDN_URL = process.env.CDN_URL ?? `https://${BUCKET}.s3.amazonaws.com`;
const STORY_TTL_HOURS = 24;

// POST /api/stories/presign — get a presigned S3 upload URL
router.post('/presign', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filename, contentType } = req.body as { filename?: string; contentType?: string };
    if (!filename || !contentType) {
      res.status(400).json({ error: 'filename and contentType are required' });
      return;
    }

    const ext = filename.split('.').pop() ?? 'bin';
    const key = `stories/${req.user!.id}/${Date.now()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({ data: { uploadUrl, key } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate upload URL' });
  }
});

// POST /api/stories — record a story after upload
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, isVideo, barId } = req.body as { key?: string; isVideo?: boolean; barId?: string };
    if (!key) {
      res.status(400).json({ error: 'key is required' });
      return;
    }

    const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);

    // barId is required in the schema — fall back to first bar if not provided
    let resolvedBarId = barId;
    if (!resolvedBarId) {
      const bar = await prisma.bar.findFirst({ select: { id: true } });
      if (!bar) {
        res.status(400).json({ error: 'barId is required' });
        return;
      }
      resolvedBarId = bar.id;
    }

    const story = await prisma.story.create({
      data: {
        userId: req.user!.id,
        barId: resolvedBarId,
        mediaKey: key,
        expiresAt,
      },
    });

    res.status(201).json({
      data: {
        id: story.id,
        userId: story.userId,
        key: story.mediaKey,
        isVideo: isVideo ?? false,
        createdAt: story.createdAt,
        barId: story.barId,
        url: `${CDN_URL}/${story.mediaKey}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stories?barId= — list active stories
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { barId } = req.query as { barId?: string };
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        ...(barId ? { barId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      data: stories.map((s) => ({
        id: s.id,
        userId: s.userId,
        key: s.mediaKey,
        isVideo: s.mediaKey.match(/\.(mp4|mov|webm)$/i) != null,
        createdAt: s.createdAt,
        barId: s.barId,
        url: `${CDN_URL}/${s.mediaKey}`,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
