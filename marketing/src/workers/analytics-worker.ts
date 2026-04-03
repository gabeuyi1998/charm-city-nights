import 'dotenv/config';
import { Worker } from 'bullmq';
import { connection } from '../queues/index.js';
import { generateDailyReport, logReport } from '../agents/analytics-agent.js';
import { logger } from '../lib/logger.js';

const analyticsWorker = new Worker(
  'analytics',
  async (job) => {
    logger.info('Processing analytics job', { name: job.name });

    if (job.name === 'daily-summary') {
      const report = await generateDailyReport();
      await logReport(report);
      return report;
    }

    return { skipped: true };
  },
  { connection },
);

analyticsWorker.on('completed', (job) => logger.info('Analytics job done', { id: job.id }));
analyticsWorker.on('failed', (job, err) => logger.error('Analytics job failed', { id: job?.id, err: err.message }));

logger.info('Analytics worker started');
