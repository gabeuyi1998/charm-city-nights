import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  anthropicApiKey: z.string().default(''),
  openaiApiKey: z.string().optional(),
  instagramAccessToken: z.string().optional(),
  instagramAccountId: z.string().optional(),
  tiktokAccessToken: z.string().optional(),
  redisUrl: z.string().default('redis://localhost:6379'),
  n8nBaseUrl: z.string().default('http://localhost:5678'),
  n8nApiKey: z.string().optional(),
  ccnApiUrl: z.string().default('http://44.198.64.160:3000'),
  ccnApiKey: z.string().optional(),
  resendApiKey: z.string().optional(),
});

export const config = schema.parse({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID,
  tiktokAccessToken: process.env.TIKTOK_ACCESS_TOKEN,
  redisUrl: process.env.REDIS_URL,
  n8nBaseUrl: process.env.N8N_BASE_URL,
  n8nApiKey: process.env.N8N_API_KEY,
  ccnApiUrl: process.env.CCN_API_URL,
  ccnApiKey: process.env.CCN_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
});
