import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { verifyToken, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/vouchers — user's vouchers
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: { userId: req.user!.id },
      include: {
        bar: { select: { name: true, emoji: true, neighborhood: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: vouchers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vouchers/:qrCode — validate a voucher
router.get('/:qrCode', async (req, res: Response): Promise<void> => {
  try {
    const voucher = await prisma.voucher.findUnique({
      where: { qrCode: req.params.qrCode },
      include: { bar: { select: { name: true, emoji: true } } },
    });
    if (!voucher) {
      res.status(404).json({ error: 'Voucher not found' });
      return;
    }
    const valid = voucher.status === 'ACTIVE' && voucher.expiresAt > new Date();
    res.json({ data: { valid, voucher } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/vouchers/redeem — manager scans QR
router.post(
  '/redeem',
  verifyToken,
  requireRole('MANAGER', 'ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { qrCode } = req.body as { qrCode: string };
      if (!qrCode) {
        res.status(400).json({ error: 'qrCode is required' });
        return;
      }

      const voucher = await prisma.voucher.findUnique({ where: { qrCode } });
      if (!voucher) {
        res.status(404).json({ error: 'Voucher not found' });
        return;
      }
      if (voucher.status !== 'ACTIVE') {
        res.status(409).json({ error: 'Voucher already used or expired' });
        return;
      }
      if (voucher.expiresAt < new Date()) {
        res.status(410).json({ error: 'Voucher has expired' });
        return;
      }

      const updated = await prisma.voucher.update({
        where: { qrCode },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
          redeemedByStaff: req.user!.id,
        },
      });

      res.json({ data: { voucher: updated, success: true } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
