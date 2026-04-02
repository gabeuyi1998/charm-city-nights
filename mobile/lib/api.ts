import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const BASE_URL = 'http://localhost:3000/api';

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('jwt');
}

export function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync('jwt', token);
}

export function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync('jwt');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    await clearToken();
    router.replace('/(auth)');
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Bars ────────────────────────────────────────────────────────────────────

export interface Bar {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  emoji: string;
  currentCrowd: number;
  hasActiveDeal: boolean;
  activeSpecials: Special[];
  distance: number | null;
}

export interface Special {
  id: string;
  title: string;
  description: string;
  expiresAt: string;
}

export function getBars(params?: { lat?: number; lng?: number; neighborhood?: string }): Promise<{ data: Bar[] }> {
  const qs = new URLSearchParams();
  if (params?.lat != null) qs.set('lat', String(params.lat));
  if (params?.lng != null) qs.set('lng', String(params.lng));
  if (params?.neighborhood) qs.set('neighborhood', params.neighborhood);
  const query = qs.toString();
  return request(`/bars${query ? `?${query}` : ''}`);
}

export function getBar(id: string): Promise<{ data: Bar }> {
  return request(`/bars/${id}`);
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export interface CheckinPayload {
  barId: string;
  latitude: number;
  longitude: number;
}

export interface CheckinResult {
  xpAwarded: number;
  currentCrowd: number;
}

export function postCheckin(payload: CheckinPayload): Promise<{ data: CheckinResult }> {
  return request('/checkins', { method: 'POST', body: JSON.stringify(payload) });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  cognitoId: string;
  username: string;
  displayName: string | null;
  level: number;
  xp: number;
  barsVisited: number;
  badgesCollected: number;
  followers: number;
  following: number;
  bio: string | null;
}

export function getMe(): Promise<{ data: UserProfile }> {
  return request('/auth/me');
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  barName: string;
  isCollected: boolean;
}

export function getBadges(): Promise<{ data: Badge[] }> {
  return request('/badges');
}

// ─── Crawls ──────────────────────────────────────────────────────────────────

export interface CrawlStop {
  id: string;
  order: number;
  bar: { id: string; name: string; emoji: string; neighborhood: string };
}

export interface CrawlRoute {
  id: string;
  name: string;
  description: string;
  stops: CrawlStop[];
  totalXp: number;
  estimatedHours: number;
  difficulty: string;
  progress: { completedStops: number }[];
}

export function getCrawls(): Promise<{ data: CrawlRoute[] }> {
  return request('/crawls');
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function getNotifications(): Promise<{ data: Notification[] }> {
  return request('/users/notifications');
}

// ─── DMs ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  participant: { id: string; username: string; displayName: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function getDMs(): Promise<{ data: Conversation[] }> {
  return request('/users/dms');
}
