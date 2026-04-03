import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { getHotBars, type Bar } from '../lib/ccn-api.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export interface ContentOutput {
  caption: string;
  hashtags: string[];
  story: string;
  tiktokScript: string;
}

const BRAND_VOICE = `
You are the social media voice for Charm City Nights — Baltimore's nightlife gamification app.
Brand personality: Bold, local, fun, insider. You know every bar in Bmore.
Tone: Hype but authentic. Never corporate. Use Baltimore slang naturally (not forced).
Always reference real Baltimore neighborhoods: Fells Point, Federal Hill, Canton, Harbor East, Mt. Vernon.
Emojis: Use sparingly but effectively. Crab 🦀 is the brand mascot.
CTA always drives to: download the app, check in, earn XP, or join a crawl.
`;

export async function generateBarContent(bar: Bar): Promise<ContentOutput> {
  logger.info('Generating content for bar', { name: bar.name, crowd: bar.currentCrowd });

  const crowdLevel = bar.currentCrowd > 80 ? 'PACKED' : bar.currentCrowd > 50 ? 'heating up' : 'chill vibes';

  const prompt = `${BRAND_VOICE}

Bar: ${bar.name} (${bar.neighborhood})
Current crowd: ${bar.currentCrowd}% — ${crowdLevel}
Vibe: ${bar.vibe}
${(bar.activeSpecials as string[]).length > 0 ? `Active specials: ${JSON.stringify(bar.activeSpecials)}` : ''}

Generate:
1. Instagram caption (2-3 sentences, punchy, include crowd level naturally)
2. 10 relevant hashtags (mix of local Baltimore tags + nightlife + app-specific)
3. Instagram story text (1 bold line, under 60 chars)
4. TikTok voiceover script (15-30 seconds when spoken, energetic)

Respond as JSON: { "caption": "", "hashtags": [], "story": "", "tiktokScript": "" }`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in content response');

  return JSON.parse(jsonMatch[0]) as ContentOutput;
}

export async function generateDailyBrief(): Promise<string> {
  const bars = await getHotBars();
  if (bars.length === 0) return 'No hot bars tonight — quiet night in Baltimore.';

  const barList = bars.map((b) => `${b.name} (${b.neighborhood}): ${b.currentCrowd}% capacity`).join('\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `${BRAND_VOICE}\n\nTonight's hottest bars:\n${barList}\n\nWrite a punchy 2-sentence "Tonight in Baltimore" social post that hypes the scene. Include the top 2 bars by name.`,
    }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

export async function generateWeeklyRecap(checkInCount: number, topBar: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `${BRAND_VOICE}\n\nThis week: ${checkInCount} check-ins across Baltimore. Top bar: ${topBar}.\n\nWrite a weekly recap Instagram caption celebrating the Baltimore nightlife community. Encourage people to download the app to join next week.`,
    }],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
