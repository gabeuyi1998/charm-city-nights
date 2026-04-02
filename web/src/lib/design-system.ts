import type { Neighborhood } from '@/types';

export const colors = {
  primary: '#FF5C00',
  primaryLight: '#FFB59A',
  primaryDim: '#FFDBCE',
  gold: '#E9C349',
  goldContainer: '#AF8D11',
  teal: '#00C9A7',
  purple: '#7B2FBE',
  background: '#131313',
  backgroundDeep: '#0E0E0E',
  surfaceLow: '#1C1B1B',
  surfaceMid: '#201F1F',
  surfaceHigh: '#2A2A2A',
  surfaceHighest: '#353534',
  text: '#E5E2E1',
  textMuted: '#E4BEB1',
  outline: '#AB897D',
  outlineVariant: '#5B4137',
  error: '#FF3366',
  errorContainer: '#93000A',
} as const;

export const fonts = {
  display: "'Bebas Neue', sans-serif",
  body: "'Outfit', sans-serif",
} as const;

export const shadows = {
  orangeGlow: '0 0 15px rgba(255, 92, 0, 0.4)',
  orangeGlowLg: '0 0 30px rgba(255, 92, 0, 0.5)',
  goldGlow: '0 0 15px rgba(233, 195, 73, 0.4)',
  purpleGlow: '0 0 15px rgba(123, 47, 190, 0.4)',
} as const;

export interface BadgeData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  lore: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpValue: number;
  neighborhood?: string;
}

export const CCN_BADGES: BadgeData[] = [
  { id: 'crab-king', name: 'Crab King', emoji: '🦀', description: 'Visit 10 seafood spots', lore: 'True royalty of the Chesapeake', rarity: 'legendary', xpValue: 500, neighborhood: 'Inner Harbor' },
  { id: 'power-surge', name: 'Power Surge', emoji: '⚡', description: 'Visit Power Plant Live 3x', lore: 'Electric nights at the Point', rarity: 'legendary', xpValue: 450 },
  { id: 'legend', name: 'Legend', emoji: '🏆', description: 'Complete all bar crawls', lore: 'Baltimore bows to you', rarity: 'legendary', xpValue: 1000 },
  { id: 'harbor-hawk', name: 'Harbor Hawk', emoji: '🦅', description: 'Check in at Inner Harbor 5x', lore: 'Eyes on the whole harbor', rarity: 'epic', xpValue: 300, neighborhood: 'Inner Harbor' },
  { id: 'night-king', name: 'Night King', emoji: '👑', description: 'Stay out past 3am x5', lore: 'The night is yours', rarity: 'epic', xpValue: 250 },
  { id: 'anchor-drop', name: 'Anchor Drop', emoji: '⚓', description: 'Visit 5 waterfront bars', lore: 'Grounded in Baltimore', rarity: 'rare', xpValue: 150, neighborhood: 'Fells Point' },
  { id: 'night-owl', name: 'Night Owl', emoji: '🦉', description: 'Check in after midnight x10', lore: 'Creature of the night', rarity: 'rare', xpValue: 150 },
  { id: 'indie-spirit', name: 'Indie Spirit', emoji: '🎸', description: 'Visit 3 live music venues', lore: 'The sound of the city', rarity: 'rare', xpValue: 150 },
  { id: 'fed-regular', name: 'Fed Hill Regular', emoji: '🍺', description: 'Visit Federal Hill 5x', lore: 'South Baltimore staple', rarity: 'common', xpValue: 75, neighborhood: 'Federal Hill' },
  { id: 'canton-crawler', name: 'Canton Crawler', emoji: '🚶', description: 'Complete a Canton bar crawl', lore: "O'Donnell Square legend", rarity: 'common', xpValue: 75, neighborhood: 'Canton' },
  { id: 'fells-pilgrim', name: 'Fells Pilgrim', emoji: '🗺️', description: 'Visit 5 Fells Point spots', lore: 'Cobblestone wanderer', rarity: 'common', xpValue: 75, neighborhood: 'Fells Point' },
  { id: 'mystery-1', name: '???', emoji: '❓', description: 'Hidden badge', lore: 'Explore to unlock', rarity: 'epic', xpValue: 0 },
  { id: 'mystery-2', name: '???', emoji: '❓', description: 'Hidden badge', lore: 'Explore to unlock', rarity: 'rare', xpValue: 0 },
  { id: 'mystery-3', name: '???', emoji: '❓', description: 'Hidden badge', lore: 'Explore to unlock', rarity: 'legendary', xpValue: 0 },
];

export const CCN_NEIGHBORHOODS: Neighborhood[] = [
  { id: 'fells-point', name: 'Fells Point', barCount: 18, xpPerBar: 25 },
  { id: 'federal-hill', name: 'Federal Hill', barCount: 14, xpPerBar: 25 },
  { id: 'canton', name: 'Canton', barCount: 12, xpPerBar: 25 },
  { id: 'inner-harbor', name: 'Inner Harbor', barCount: 10, xpPerBar: 30 },
  { id: 'mount-vernon', name: 'Mount Vernon', barCount: 8, xpPerBar: 35 },
  { id: 'hampden', name: 'Hampden', barCount: 9, xpPerBar: 30 },
];
