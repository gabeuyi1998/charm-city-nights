import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export interface DMTemplate {
  subject: string;
  body: string;
}

const LEAD_TYPES = ['bar_owner', 'influencer', 'event_promoter', 'new_user'] as const;
type LeadType = (typeof LEAD_TYPES)[number];

export async function generateDMTemplate(leadType: LeadType, name: string): Promise<DMTemplate> {
  const prompts: Record<LeadType, string> = {
    bar_owner: `Write a short, friendly DM to ${name}, a Baltimore bar owner. Pitch Charm City Nights app — free listing, crowd tracking, badge creation for their bar, real-time check-in data. Keep it under 100 words. No spam vibes.`,
    influencer: `Write a casual DM to ${name}, a Baltimore nightlife influencer. Invite them to try Charm City Nights free and offer a promo code. Mention the bar crawl feature and XP system. Under 80 words.`,
    event_promoter: `Write a DM to ${name}, a Baltimore event promoter. Offer to list their next event on Charm City Nights for free exposure to nightlife users. Under 80 words.`,
    new_user: `Write a welcome DM to ${name}, a new Charm City Nights user. Tell them the top 3 things to do first: check in at a bar, earn their first badge, join a crawl. Warm and encouraging. Under 70 words.`,
  };

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompts[leadType] }],
  });

  const body = message.content[0].type === 'text' ? message.content[0].text : '';
  const subjects: Record<LeadType, string> = {
    bar_owner: '🦀 Get your bar on Charm City Nights',
    influencer: '🍺 Baltimore nightlife collab?',
    event_promoter: '📍 Free event listing on CCN',
    new_user: '🎉 Welcome to Charm City Nights!',
  };

  return { subject: subjects[leadType], body };
}

export async function generateFollowUpSequence(leadType: LeadType, name: string): Promise<DMTemplate[]> {
  const templates: DMTemplate[] = [];
  const delays = [0, 3, 7]; // days after initial contact

  for (const day of delays) {
    if (day === 0) {
      templates.push(await generateDMTemplate(leadType, name));
    } else {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a day-${day} follow-up DM to ${name} (${leadType}) who hasn't responded to our Charm City Nights outreach. Friendly, not pushy. Reference something new in the app. Under 60 words.`,
        }],
      });
      const body = message.content[0].type === 'text' ? message.content[0].text : '';
      templates.push({ subject: `Re: Charm City Nights — day ${day}`, body });
    }
  }

  return templates;
}
