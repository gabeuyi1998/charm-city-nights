import 'dotenv/config';
import { logger } from './lib/logger.js';
import { scheduleDaily } from './queues/index.js';

async function main() {
  logger.info('🦀 Charm City Nights Marketing System starting...');
  await scheduleDaily();
  logger.info('✅ All daily jobs scheduled. System running.');
}

main().catch((err) => {
  logger.error('Fatal startup error', { err });
  process.exit(1);
});
