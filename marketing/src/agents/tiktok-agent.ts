import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import type { ContentOutput } from './content-agent.js';

const TIKTOK_API = 'https://open.tiktokapis.com/v2';

export interface TikTokPostResult {
  publishId: string;
  status: string;
}

export async function initVideoUpload(videoUrl: string): Promise<string | null> {
  if (!config.tiktokAccessToken) {
    logger.warn('TikTok credentials not configured — skipping');
    return null;
  }

  try {
    const { data } = await axios.post(
      `${TIKTOK_API}/post/publish/inbox/video/init/`,
      {
        post_info: {
          title: 'Charm City Nights 🦀',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.tiktokAccessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      },
    );

    return data?.data?.publish_id ?? null;
  } catch (err) {
    logger.error('TikTok upload init failed', { err: (err as Error).message });
    return null;
  }
}

export async function checkPostStatus(publishId: string): Promise<string> {
  if (!config.tiktokAccessToken) return 'unknown';

  try {
    const { data } = await axios.post(
      `${TIKTOK_API}/post/publish/status/fetch/`,
      { publish_id: publishId },
      {
        headers: {
          Authorization: `Bearer ${config.tiktokAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return data?.data?.status ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function generateTikTokCaption(content: ContentOutput): Promise<string> {
  const tags = content.hashtags.slice(0, 5).map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  return `${content.story} 🦀\n\n${tags} #CharmCityNights #Baltimore`;
}
