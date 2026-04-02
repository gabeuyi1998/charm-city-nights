import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import { checkInLimiter } from '../middleware/rateLimiter';
import { haversineDistanceFeet } from '../services/geo';
import { io } from '../index';
import prisma from '../lib/prisma';

const CHECK_IN_RADIUS_FEET = 300;
const XP_AWARD = 75;

const router = Router();

// POST /api/checkins
router.post(
  '/',
  verifyToken,
  checkInLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { barId, latitude, longitude } = req.body as {
        barId: string;
        latitude: number;
        longitude: number;
      };

      if (
        !barId ||
        typeof latitude !== 'number' ||
        typeof longitude !== 'number'
      ) {
        res.status(400).json({ error: 'barId, latitude, and longitude are required' });
        return;
      }

      const bar = await prisma.bar.findUnique({ where: { id: barId } });
      if (!bar) {
        res.status(404).json({ error: 'Bar not found' });
        return;
      }

      const distanceFeet = haversineDistanceFeet(
        latitude,
        longitude,
        bar.latitude,
        bar.longitude,
      );

      if (distanceFeet > CHECK_IN_RADIUS_FEET) {
        res.status(403).json({
          error: 'Too far away to check in',
          distanceFeet: Math.round(distanceFeet),
          maxFeet: CHECK_IN_RADIUS_FEET,
        });
        return;
      }

      // Prevent duplicate check-ins within 2 hours
      const recentCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recent = await prisma.checkIn.findFirst({
        where: { userId, barId, createdAt: { gt: recentCutoff } },
      });
      if (recent) {
        res.status(409).json({ error: 'Already checked in here recently' });
        return;
      }

      const checkIn = await prisma.checkIn.create({
        data: {
          userId,
          barId,
          latitude,
          longitude,
          verified: true,
          xpAwarded: XP_AWARD,
        },
      });

      // Award XP and recalculate level
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
      const newXp = (currentUser?.xp ?? 0) + XP_AWARD;
      const newLevel = Math.floor(newXp / 500) + 1;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: XP_AWARD }, level: newLevel },
        select: { xp: true, level: true },
      });

      // Badge check
      let newBadge = null;
      const barBadge = await prisma.badge.findFirst({ where: { barId } });
      if (barBadge) {
        const alreadyHas = await prisma.userBadge.findFirst({
          where: { userId, badgeId: barBadge.id },
        });
        if (!alreadyHas) {
          newBadge = await prisma.userBadge.create({
            data: { userId, badgeId: barBadge.id },
            include: { badge: true },
          });
          await prisma.checkIn.update({
            where: { id: checkIn.id },
            data: { badgeAwarded: true },
          });
        }
      }

      io.to(`bar:${barId}`).emit('checkin', { barId, userId });

      res.status(201).json({
        data: {
          checkIn,
          xpAwarded: XP_AWARD,
          newBadge,
          newXp: updatedUser.xp,
          newLevel: updatedUser.level,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// GET /api/checkins/bar/:barId — checkin count in last 24h
router.get('/bar/:barId', async (req, res: Response): Promise<void> => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.checkIn.count({
      where: { barId: req.params.barId, createdAt: { gt: cutoff } },
    });
    res.json({ data: { count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
