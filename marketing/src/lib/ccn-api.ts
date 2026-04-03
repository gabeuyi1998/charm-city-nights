import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const api = axios.create({
  baseURL: config.ccnApiUrl + '/api',
  headers: {
    'Content-Type': 'application/json',
    ...(config.ccnApiKey ? { Authorization: `Bearer ${config.ccnApiKey}` } : {}),
  },
  timeout: 10000,
});

export interface Bar {
  id: string;
  name: string;
  neighborhood: string;
  currentCrowd: number;
  vibe: string;
  activeSpecials: unknown[];
}

export async function getActiveBars(): Promise<Bar[]> {
  try {
    const { data } = await api.get<Bar[]>('/bars');
    return data;
  } catch (err) {
    logger.error('Failed to fetch bars from CCN API', { err });
    return [];
  }
}

export async function getHotBars(): Promise<Bar[]> {
  const bars = await getActiveBars();
  return bars
    .filter((b) => b.currentCrowd > 60)
    .sort((a, b) => b.currentCrowd - a.currentCrowd)
    .slice(0, 5);
}
