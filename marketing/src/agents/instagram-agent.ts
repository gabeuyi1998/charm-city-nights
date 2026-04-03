import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import type { ContentOutput } from './content-agent.js';

const BASE = 'https://graph.facebook.com/v21.0';

interface MediaContainer {
  id: string;
}

interface PublishResult {
  id: string;
  permalink?: string;
}

export async function postToInstagram(
  content: ContentOutput,
  imageUrl?: string,
): Promise<PublishResult | null> {
  if (!config.instagramAccessToken || !config.instagramAccountId) {
    logger.warn('Instagram credentials not configured — skipping post');
    return null;
  }

  try {
    const caption = [
      content.caption,
      '',
      content.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '),
    ].join('\n');

    // Step 1: Create media container
    const containerParams: Record<string, string> = {
      caption,
      access_token: config.instagramAccessToken,
    };

    if (imageUrl) {
      containerParams.image_url = imageUrl;
      containerParams.media_type = 'IMAGE';
    } else {
      // Text-only post via carousel workaround
      containerParams.media_type = 'REELS';
    }

    const { data: container } = await axios.post<MediaContainer>(
      `${BASE}/${config.instagramAccountId}/media`,
      containerParams,
    );

    logger.info('Created Instagram media container', { id: container.id });

    // Step 2: Publish
    const { data: result } = await axios.post<PublishResult>(
      `${BASE}/${config.instagramAccountId}/media_publish`,
      {
        creation_id: container.id,
        access_token: config.instagramAccessToken,
      },
    );

    logger.info('Published to Instagram', { id: result.id });
    return result;
  } catch (err) {
    logger.error('Instagram post failed', { err: (err as Error).message });
    return null;
  }
}

export async function postStory(content: ContentOutput, imageUrl: string): Promise<PublishResult | null> {
  if (!config.instagramAccessToken || !config.instagramAccountId) return null;

  try {
    const { data: container } = await axios.post<MediaContainer>(
      `${BASE}/${config.instagramAccountId}/media`,
      {
        image_url: imageUrl,
        media_type: 'STORIES',
        access_token: config.instagramAccessToken,
      },
    );

    const { data: result } = await axios.post<PublishResult>(
      `${BASE}/${config.instagramAccountId}/media_publish`,
      {
        creation_id: container.id,
        access_token: config.instagramAccessToken,
      },
    );

    logger.info('Posted Instagram story', { id: result.id });
    return result;
  } catch (err) {
    logger.error('Instagram story failed', { err: (err as Error).message });
    return null;
  }
}

export async function getInsightsSummary(): Promise<Record<string, number>> {
  if (!config.instagramAccessToken || !config.instagramAccountId) return {};

  try {
    const { data } = await axios.get(
      `${BASE}/${config.instagramAccountId}/insights`,
      {
        params: {
          metric: 'impressions,reach,profile_views,follower_count',
          period: 'day',
          access_token: config.instagramAccessToken,
        },
      },
    );

    const insights: Record<string, number> = {};
    for (const item of data.data ?? []) {
      insights[item.name] = item.values?.[0]?.value ?? 0;
    }
    return insights;
  } catch (err) {
    logger.error('Failed to fetch Instagram insights', { err });
    return {};
  }
}
