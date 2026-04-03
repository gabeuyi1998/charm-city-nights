import 'dotenv/config';
import { Worker } from 'bullmq';
import { connection } from '../queues/index.js';
import { generateBarContent, generateDailyBrief } from '../agents/content-agent.js';
import { postToInstagram } from '../agents/instagram-agent.js';
import { logger } from '../lib/logger.js';
import { getHotBars } from '../lib/ccn-api.js';

const contentWorker = new Worker(
  'content-generation',
  async (job) => {
    logger.info('Processing content job', { name: job.name, id: job.id });

    if (job.name === 'morning-brief') {
      const brief = await generateDailyBrief();
      logger.info('Morning brief generated', { brief });
      return { brief };
    }

    if (job.name === 'bar-content' && job.data.barId) {
      const bars = await getHotBars();
      const bar = bars.find((b) => b.id === job.data.barId);
      if (!bar) return { error: 'Bar not found' };
      const content = await generateBarContent(bar);
      return content;
    }

    return { skipped: true };
  },
  { connection },
);

const postingWorker = new Worker(
  'social-posting',
  async (job) => {
    logger.info('Processing posting job', { name: job.name, id: job.id });

    if (job.name === 'evening-post') {
      const bars = await getHotBars();
      for (const bar of bars.slice(0, 2)) {
        const content = await generateBarContent(bar);
        await postToInstagram(content);
      }
      return { posted: bars.slice(0, 2).map((b) => b.name) };
    }

    return { skipped: true };
  },
  { connection },
);

contentWorker.on('completed', (job) => logger.info('Content job done', { id: job.id }));
contentWorker.on('failed', (job, err) => logger.error('Content job failed', { id: job?.id, err: err.message }));
postingWorker.on('completed', (job) => logger.info('Posting job done', { id: job.id }));
postingWorker.on('failed', (job, err) => logger.error('Posting job failed', { id: job?.id, err: err.message }));

logger.info('Queue workers started');
