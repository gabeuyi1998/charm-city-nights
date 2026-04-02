export interface WaitlistEntry {
  email: string;
  position: number;
  bonusXP: number;
  crabsFound: number;
  alreadyJoined?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  lore: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpValue: number;
  neighborhood?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  barCount: number;
  xpPerBar: number;
}

export type CrabPosition = 'hero' | 'features' | 'badges' | 'footer';
