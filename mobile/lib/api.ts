import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('[api] EXPO_PUBLIC_API_URL is not set — API calls will fail');
}
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mtvgabe.com') + '/api';

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

export function updateMe(payload: { displayName?: string; bio?: string }): Promise<{ data: UserProfile }> {
  return request('/users/me', { method: 'PATCH', body: JSON.stringify(payload) });
}

export function onboardUser(payload: { displayName?: string; homeNeighborhood?: string; ageVerified?: boolean }): Promise<{ data: UserProfile }> {
  return request('/auth/users/onboard', { method: 'POST', body: JSON.stringify(payload) });
}

export interface LoginResult {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function login(email: string, password: string): Promise<{ data: LoginResult }> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function register(email: string, password: string, username: string): Promise<{ message: string }> {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, username }) });
}

export function confirmEmail(email: string, code: string): Promise<{ message: string }> {
  return request('/auth/confirm', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export function resendCode(email: string): Promise<{ message: string }> {
  return request('/auth/resend-code', { method: 'POST', body: JSON.stringify({ email }) });
}

export function syncUser(payload: { cognitoId: string; username: string; email?: string }): Promise<{ data: UserProfile }> {
  return request('/auth/sync', { method: 'POST', body: JSON.stringify(payload) });
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

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function getMessages(conversationId: string): Promise<{ data: Message[] }> {
  return request(`/users/dms/${conversationId}/messages`);
}

export function sendMessage(conversationId: string, content: string): Promise<{ data: Message }> {
  return request(`/users/dms/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// ─── Crawl actions ────────────────────────────────────────────────────────────

export function joinCrawl(crawlId: string): Promise<{ data: { joined: boolean } }> {
  return request(`/crawls/${crawlId}/join`, { method: 'POST' });
}

export function markNotificationRead(notificationId: string): Promise<void> {
  return request(`/users/notifications/${notificationId}/read`, { method: 'PATCH' });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  userId: string;
  key: string;
  isVideo: boolean;
  createdAt: string;
  barId?: string;
}

export function getStoryPresign(filename: string, contentType: string): Promise<{ data: { uploadUrl: string; key: string } }> {
  return request('/stories/presign', { method: 'POST', body: JSON.stringify({ filename, contentType }) });
}

export function createStory(key: string, isVideo: boolean, barId?: string): Promise<{ data: Story }> {
  return request('/stories', { method: 'POST', body: JSON.stringify({ key, isVideo, barId }) });
}

export function getStories(barId?: string): Promise<{ data: Story[] }> {
  const qs = barId ? `?barId=${barId}` : '';
  return request(`/stories${qs}`);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string | null;
  xp: number;
  level: number;
  isMe: boolean;
}

export function getLeaderboard(scope?: 'city' | 'neighborhood'): Promise<{ data: LeaderboardEntry[] }> {
  const qs = scope ? `?scope=${scope}` : '';
  return request(`/leaderboard${qs}`);
}

// ─── Discover ──────────────────────────────────────────────────────────────────

export interface BrandAmbassador {
  id: string;
  name: string;
  role: string;
  instagramHandle: string | null;
  avatarInitials: string;
  avatarColor: string;
  bio: string | null;
}

export interface BarEventItem {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startsAt: string;
  endsAt: string | null;
  performer: string | null;
}

export interface DiscoverBar extends Bar {
  ambassadors: BrandAmbassador[];
  events: BarEventItem[];
  instagramHandle?: string | null;
  _count?: { checkIns: number };
}

export function getDiscoverFeed(): Promise<{ data: DiscoverBar[] }> {
  return request('/discover');
}

export function seedDiscover(): Promise<{ data: { barId: string; barName: string; ambassadors: number; events: number }[] }> {
  return request('/discover/seed', { method: 'POST' });
}
