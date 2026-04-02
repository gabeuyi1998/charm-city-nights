import cron from 'node-cron';
import prisma from '../lib/prisma';

// Every hour — expire outdated vouchers
cron.schedule('0 * * * *', async () => {
  try {
    const result = await prisma.voucher.updateMany({
      where: { expiresAt: { lt: new Date() }, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      console.log(`⏰ Expired ${result.count} voucher(s)`);
    }
  } catch (err) {
    console.error('VoucherExpiry error:', err);
  }
});

console.log('⏰ VoucherExpiry worker started — runs every hour');
