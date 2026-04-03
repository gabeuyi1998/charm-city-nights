import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { getActiveBars } from '../lib/ccn-api.js';
import { getInsightsSummary } from './instagram-agent.js';
import Anthropic from '@anthropic-ai/sdk';
import { format } from 'date-fns';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export interface DailyReport {
  date: string;
  bars: { total: number; active: number; avgCrowd: number };
  instagram: Record<string, number>;
  insights: string;
  recommendations: string[];
}

export async function generateDailyReport(): Promise<DailyReport> {
  const [bars, instagramStats] = await Promise.all([
    getActiveBars(),
    getInsightsSummary(),
  ]);

  const activeBars = bars.filter((b) => b.isActive ?? true);
  const avgCrowd = activeBars.length > 0
    ? Math.round(activeBars.reduce((s, b) => s + b.currentCrowd, 0) / activeBars.length)
    : 0;

  const reportData = {
    bars: { total: bars.length, active: activeBars.length, avgCrowd },
    instagram: instagramStats,
  };

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `You are an analytics AI for Charm City Nights nightlife app.

Data: ${JSON.stringify(reportData)}

Provide:
1. One-sentence insight about today's nightlife activity
2. 3 specific, actionable marketing recommendations for tomorrow

Respond as JSON: { "insights": "", "recommendations": [] }`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: '', recommendations: [] };

  return {
    date: format(new Date(), 'yyyy-MM-dd'),
    ...reportData,
    insights: parsed.insights ?? '',
    recommendations: parsed.recommendations ?? [],
  };
}

export async function logReport(report: DailyReport): Promise<void> {
  logger.info('Daily Marketing Report', {
    date: report.date,
    activeBars: report.bars.active,
    avgCrowd: report.bars.avgCrowd,
    instagramReach: report.instagram.reach ?? 0,
    insights: report.insights,
    recommendations: report.recommendations,
  });
}
