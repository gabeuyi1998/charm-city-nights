import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

export const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

export const contentQueue = new Queue('content-generation', { connection });
export const postingQueue = new Queue('social-posting', { connection });
export const analyticsQueue = new Queue('analytics', { connection });

export const queues = { contentQueue, postingQueue, analyticsQueue };

export async function scheduleDaily() {
  const now = new Date();

  // Morning content brief at 8am
  await contentQueue.add('morning-brief', { type: 'daily-brief', date: now.toISOString() }, {
    delay: getDelayUntil(8, 0),
    repeat: { pattern: '0 8 * * *' },
  });

  // Evening peak-hour post at 9pm
  await postingQueue.add('evening-post', { type: 'peak-hour-roundup' }, {
    delay: getDelayUntil(21, 0),
    repeat: { pattern: '0 21 * * *' },
  });

  // Midnight analytics summary
  await analyticsQueue.add('daily-summary', { type: 'daily-analytics' }, {
    delay: getDelayUntil(23, 59),
    repeat: { pattern: '59 23 * * *' },
  });

  logger.info('Scheduled daily marketing jobs');
}

function getDelayUntil(hour: number, minute: number): number {
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= new Date()) target.setDate(target.getDate() + 1);
  return target.getTime() - Date.now();
}
