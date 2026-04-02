// ─── Vault Types — "The Vault" per-venue hidden experience ────────────────────

export type VaultItemType =
  | 'secret_code'    // off-menu drink/item code
  | 'midnight_drop'  // weekly rotating exclusive
  | 'stamp'          // passport stamp for the venue
  | 'challenge'      // bartender social task
  | 'collectible'    // venue-specific token
  | 'mystery_box';   // blind reveal post-checkin

export type VaultRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type UnlockTrigger =
  | 'checkin'        // check in at the venue
  | 'streak_2'       // 2 consecutive visits
  | 'streak_5'       // 5 visits total
  | 'friend_unlock'  // unlock together with a friend
  | 'time_window'    // only available certain hours / nights
  | 'challenge';     // complete a listed task

export interface VaultItem {
  id: string;
  venueId: string;
  name: string;
  description: string;       // shown after unlock
  hint: string;              // cryptic teaser shown while locked
  emoji: string;
  rarity: VaultRarity;
  type: VaultItemType;
  trigger: UnlockTrigger;
  triggerLabel: string;      // "Check in to unlock"
  isMidnightDrop: boolean;   // featured weekly rotating item
  dropExpiresIn?: string;    // "3d 14h" — display only
  secretCode?: string;       // revealed for secret_code type
  challengeTask?: string;    // shown for challenge type
}

export interface VaultUnlock {
  itemId: string;
  venueId: string;
  unlockedAt: Date;
}

// ─── Night Session (Vibe Tracker) ─────────────────────────────────────────────

export type VibeStage =
  | 'just_arrived'
  | 'warming_up'
  | 'in_the_mix'
  | 'peak_night'
  | 'legendary_night';

export const VIBE_STAGES: { key: VibeStage; label: string; emoji: string; threshold: number }[] = [
  { key: 'just_arrived',    label: 'Just Arrived',    emoji: '🚪', threshold: 0  },
  { key: 'warming_up',      label: 'Warming Up',      emoji: '🔥', threshold: 25 },
  { key: 'in_the_mix',      label: 'In The Mix',      emoji: '💫', threshold: 50 },
  { key: 'peak_night',      label: 'Peak Night',      emoji: '⚡', threshold: 75 },
  { key: 'legendary_night', label: 'Legendary Night', emoji: '👑', threshold: 95 },
];

export const NIGHT_MOMENTS = [
  { id: 'm1', label: 'Grabbed a drink',  emoji: '🥃', xp: 5  },
  { id: 'm2', label: 'Met someone',       emoji: '🤝', xp: 10 },
  { id: 'm3', label: 'Hit the floor',     emoji: '💃', xp: 15 },
  { id: 'm4', label: 'Found the vibe',    emoji: '✨', xp: 20 },
  { id: 'm5', label: 'Discovered a bar',  emoji: '🗺️', xp: 25 },
  { id: 'm6', label: 'Made a memory',     emoji: '📸', xp: 15 },
] as const;

export interface NightMoment {
  momentId: string;
  venueId: string;
  timestamp: Date;
}

export interface NightSession {
  date: string;           // YYYY-MM-DD (resets each night)
  venueIds: string[];
  moments: NightMoment[];
  vibeProgress: number;   // 0–100
}
