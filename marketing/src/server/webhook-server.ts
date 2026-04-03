/**
 * Lightweight HTTP server so n8n workflows can call our TypeScript agents via webhooks.
 * n8n → POST http://localhost:3001/generate-content → this server → content agent → response
 */
import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { generateBarContent, generateDailyBrief } from '../agents/content-agent.js';
import { postToInstagram } from '../agents/instagram-agent.js';
import { generateDMTemplate } from '../agents/dm-agent.js';
import { generateDailyReport } from '../agents/analytics-agent.js';
import { logger } from '../lib/logger.js';

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  try {
    if (method === 'GET' && url === '/health') {
      return send(res, 200, { status: 'ok' });
    }

    if (method === 'POST' && url === '/generate-content') {
      const body = await readBody(req) as { bar?: unknown };
      if (!body.bar) return send(res, 400, { error: 'Missing bar data' });
      const content = await generateBarContent(body.bar as Parameters<typeof generateBarContent>[0]);
      return send(res, 200, content);
    }

    if (method === 'POST' && url === '/post-instagram') {
      const body = await readBody(req) as { content?: unknown; imageUrl?: string };
      if (!body.content) return send(res, 400, { error: 'Missing content' });
      const result = await postToInstagram(body.content as Parameters<typeof postToInstagram>[0], body.imageUrl);
      return send(res, 200, { result });
    }

    if (method === 'POST' && url === '/generate-dm') {
      const body = await readBody(req) as { leadType?: string; name?: string };
      const dm = await generateDMTemplate(
        (body.leadType ?? 'new_user') as Parameters<typeof generateDMTemplate>[0],
        body.name ?? 'there',
      );
      return send(res, 200, dm);
    }

    if (method === 'GET' && url === '/daily-brief') {
      const brief = await generateDailyBrief();
      return send(res, 200, { brief });
    }

    if (method === 'GET' && url === '/analytics-report') {
      const report = await generateDailyReport();
      return send(res, 200, report);
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    logger.error('Webhook server error', { url, err: (err as Error).message });
    send(res, 500, { error: 'Internal server error' });
  }
});

const PORT = 3001;
server.listen(PORT, () => logger.info(`Webhook server running on http://localhost:${PORT}`));
