import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimiter';
import authRouter from './routes/auth';
import barsRouter from './routes/bars';
import checkinsRouter from './routes/checkins';
import crawlsRouter from './routes/crawls';
import vouchersRouter from './routes/vouchers';
import videosRouter from './routes/videos';
import usersRouter from './routes/users';
import badgesRouter from './routes/badges';
import managerRouter from './routes/manager';
import prisma from './lib/prisma';
import './workers/voucherExpiry';

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');

export const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/bars', barsRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/crawls', crawlsRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/videos', videosRouter);
app.use('/api/users', usersRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/manager', managerRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

const PORT = process.env.PORT ?? 3000;

httpServer.listen(PORT, () => {
  console.log(`🦀 Charm City Nights API running on port ${PORT}`);
  // Start crowd updater after server is ready (needs io)
  import('./workers/crowdUpdater').catch(console.error);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
