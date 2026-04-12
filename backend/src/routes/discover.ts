import { Router, Response, Request } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/discover — enriched bar feed with ambassadors, events, specials
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const bars = await prisma.bar.findMany({
      where: { isActive: true },
      include: {
        ambassadors: { where: { isActive: true }, take: 3 },
        events: {
          where: { startsAt: { gte: todayStart, lte: todayEnd } },
          orderBy: { startsAt: 'asc' },
          take: 5,
        },
        specials: {
          where: { expiresAt: { gt: now } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: { select: { checkIns: true } },
      },
      orderBy: { currentCrowd: 'desc' },
    });

    res.json({ data: bars });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/discover/:barId/ambassadors
router.get('/:barId/ambassadors', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ambassadors = await prisma.brandAmbassador.findMany({
      where: { barId: req.params.barId as string, isActive: true },
    });
    res.json({ data: ambassadors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/discover/:barId/events — today's lineup
router.get('/:barId/events', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const events = await prisma.barEvent.findMany({
      where: {
        barId: req.params.barId as string,
        startsAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { startsAt: 'asc' },
    });
    res.json({ data: events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/discover/seed — seed first 3 bars with ambassadors + events (manager only)
router.post('/seed', async (req: Request, res: Response): Promise<void> => {
  try {
    const bars = await prisma.bar.findMany({
      orderBy: { createdAt: 'asc' },
      take: 3,
    });

    if (bars.length === 0) {
      res.status(404).json({ error: 'No bars found to seed' });
      return;
    }

    const AMBASSADOR_SEEDS = [
      [
        { name: 'Jade Williams', role: 'Host', instagramHandle: 'jadecw_bmore', avatarInitials: 'JW', avatarColor: '#FF5C00', bio: 'Fells Point local. Making every night unforgettable.' },
        { name: 'Marcus Reid', role: 'Promoter', instagramHandle: 'marcusreid_out', avatarInitials: 'MR', avatarColor: '#7C3AED', bio: 'Baltimore nightlife curator. 4 years running.' },
      ],
      [
        { name: 'Alicia Chen', role: 'Host', instagramHandle: 'aliciac.nights', avatarInitials: 'AC', avatarColor: '#10B981', bio: 'Federal Hill\'s go-to party starter.' },
        { name: 'Devon Park', role: 'Brand Rep', instagramHandle: 'devonpark_bmore', avatarInitials: 'DP', avatarColor: '#F59E0B', bio: 'Creating moments worth remembering.' },
      ],
      [
        { name: 'Serena James', role: 'Host', instagramHandle: 'serenaj_bmore', avatarInitials: 'SJ', avatarColor: '#EC4899', bio: 'Canton\'s energy in human form.' },
        { name: 'Tyler Knox', role: 'Promoter', instagramHandle: 'tylerknox_live', avatarInitials: 'TK', avatarColor: '#3B82F6', bio: 'Bringing the best acts to Baltimore.' },
      ],
    ];

    const now = new Date();
    const EVENT_SEEDS = [
      [
        { title: 'DJ Set: Nightfall', performer: 'DJ Nightfall', eventType: 'dj', startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0), endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0) },
        { title: 'Ladies Night', performer: null, eventType: 'special', startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0), endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0) },
      ],
      [
        { title: 'Live R&B: Kira Soul', performer: 'Kira Soul', eventType: 'live_music', startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0), endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0) },
        { title: 'Happy Hour Extended', performer: null, eventType: 'special', startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0), endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0) },
      ],
      [
        { title: 'Open Mic Night', performer: 'Various Artists', eventType: 'open_mic', startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30), endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30) },
        { title: 'Midnight Brunch', performer: null, eventType: 'special', startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0) },
      ],
    ];

    const results = await Promise.all(
      bars.map(async (bar, i) => {
        // Clear existing seed data
        await prisma.brandAmbassador.deleteMany({ where: { barId: bar.id } });
        await prisma.barEvent.deleteMany({ where: { barId: bar.id } });

        const ambassadors = await Promise.all(
          AMBASSADOR_SEEDS[i].map((a) =>
            prisma.brandAmbassador.create({ data: { ...a, barId: bar.id } }),
          ),
        );

        const events = await Promise.all(
          EVENT_SEEDS[i].map((e) =>
            prisma.barEvent.create({ data: { ...e, barId: bar.id } }),
          ),
        );

        return { barId: bar.id, barName: bar.name, ambassadors: ambassadors.length, events: events.length };
      }),
    );

    res.json({ data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
