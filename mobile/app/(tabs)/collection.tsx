import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts } from '../../constants/theme';
import { XPBar } from '../../components/ui/XPBar';
import { VAULT_ITEMS, MOCK_UNLOCKED_IDS } from '../../constants/vaultData';
import type { VaultRarity } from '../../types/vault';
import { router } from 'expo-router';
import { getMe } from '../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Rarity helpers ───────────────────────────────────────────────────────────
function rarityColor(r: VaultRarity): string {
  switch (r) {
    case 'LEGENDARY': return '#E9C349';
    case 'EPIC':      return '#B47AFF';
    case 'RARE':      return '#4EC9FF';
    default:          return Colors.textMuted;
  }
}

// ─── Passport Stamp ───────────────────────────────────────────────────────────
function PassportStamp({
  emoji,
  name,
  rarity,
  unlocked,
}: {
  emoji: string;
  name: string;
  rarity: VaultRarity;
  unlocked: boolean;
}): React.ReactElement {
  const rc = rarityColor(rarity);
  return (
    <View style={[styles.stamp, !unlocked && styles.stampLocked]}>
      <View style={[styles.stampRing, { borderColor: unlocked ? rc : 'rgba(255,255,255,0.1)' }]}>
        <Text style={[styles.stampEmoji, !unlocked && styles.stampEmojiLocked]}>{unlocked ? emoji : '🔒'}</Text>
      </View>
      <Text style={[styles.stampName, !unlocked && styles.stampNameLocked]} numberOfLines={2}>{name}</Text>
      {unlocked && (
        <View style={[styles.stampRarityDot, { backgroundColor: rc }]} />
      )}
    </View>
  );
}

// ─── Venue Passport Card ──────────────────────────────────────────────────────
interface VenuePassportEntry {
  venueId: string;
  venueName: string;
  neighborhood: string;
  emoji: string;
  totalItems: number;
  unlockedItems: number;
}

function VenuePassportCard({ entry, unlockedIds }: { entry: VenuePassportEntry; unlockedIds: Set<string> }): React.ReactElement {
  const items = VAULT_ITEMS.filter((i) => i.venueId === entry.venueId);
  const unlocked = items.filter((i) => unlockedIds.has(i.id));
  const progress = items.length > 0 ? unlocked.length / items.length : 0;
  const isComplete = progress === 1 && items.length > 0;

  return (
    <Pressable
      style={[styles.passportCard, isComplete && styles.passportCardComplete]}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      {isComplete && (
        <LinearGradient
          colors={['rgba(233,195,73,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Venue header */}
      <View style={styles.passportCardHeader}>
        <View style={styles.passportVenueEmoji}>
          <Text style={styles.passportVenueEmojiText}>{entry.emoji}</Text>
        </View>
        <View style={styles.passportVenueInfo}>
          <Text style={styles.passportVenueName}>{entry.venueName}</Text>
          <Text style={styles.passportVenueNeighborhood}>{entry.neighborhood}</Text>
        </View>
        {isComplete ? (
          <View style={styles.completeChip}>
            <Text style={styles.completeChipText}>✓ COMPLETE</Text>
          </View>
        ) : (
          <Text style={styles.passportCount}>{unlocked.length}/{items.length}</Text>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.passportProgressTrack}>
        <LinearGradient
          colors={isComplete ? ['#E9C349', '#FF5C00'] : [Colors.primaryContainer, '#FF7439']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.passportProgressFill, { width: `${progress * 100}%` as `${number}%` }]}
        />
      </View>

      {/* Stamps row */}
      {items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stampsRow}>
          {items.map((item) => (
            <PassportStamp
              key={item.id}
              emoji={item.emoji}
              name={item.name}
              rarity={item.rarity}
              unlocked={unlockedIds.has(item.id)}
            />
          ))}
        </ScrollView>
      )}
    </Pressable>
  );
}

// ─── Animated glow for legendary find ────────────────────────────────────────
function LegendaryGlow(): React.ReactElement {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, styles.legendaryGlow, style]} />;
}

// ─── Passport venues ──────────────────────────────────────────────────────────
const PASSPORT_VENUES: VenuePassportEntry[] = [
  { venueId: '6',  venueName: 'The Horse You Came In On', neighborhood: 'Fells Point',   emoji: '🐴', totalItems: 3, unlockedItems: 0 },
  { venueId: '10', venueName: "Max's Taphouse",           neighborhood: 'Fells Point',   emoji: '🏺', totalItems: 3, unlockedItems: 0 },
  { venueId: '2',  venueName: 'Loco Hombre',              neighborhood: 'Federal Hill',  emoji: '🌮', totalItems: 2, unlockedItems: 0 },
  { venueId: '9',  venueName: "Brewer's Art",             neighborhood: 'Mount Vernon',  emoji: '🍺', totalItems: 3, unlockedItems: 0 },
  { venueId: '20', venueName: 'Power Plant Live!',        neighborhood: 'Inner Harbor',  emoji: '⚡', totalItems: 2, unlockedItems: 0 },
  { venueId: '8',  venueName: 'Bookmakers Cocktail Club', neighborhood: 'Mount Vernon',  emoji: '📚', totalItems: 2, unlockedItems: 0 },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PassportScreen(): React.ReactElement {
  const [unlockedIds] = useState<Set<string>>(new Set(MOCK_UNLOCKED_IDS));
  const [xpCurrent, setXpCurrent] = useState(7400);
  const [level, setLevel] = useState(42);
  const xpMax = 10000;

  useEffect(() => {
    getMe().then((r) => {
      setXpCurrent(r.data.xp);
      setLevel(r.data.level);
    }).catch(() => {});
  }, []);
  const totalVaultItems = VAULT_ITEMS.length;
  const totalUnlocked = VAULT_ITEMS.filter((i) => unlockedIds.has(i.id)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>YOUR NIGHTLIFE</Text>
            <Text style={styles.headerTitle}>Passport</Text>
          </View>
          <View style={styles.levelPill}>
            <Ionicons name="trophy" size={14} color={Colors.secondary} />
            <Text style={styles.levelPillText}>LVL {level}</Text>
          </View>
        </View>

        {/* ── XP Bar ── */}
        <View style={styles.xpSection}>
          <XPBar current={xpCurrent} max={xpMax} rank="Nightcrawler" level={level} animate style={styles.xpBar} />
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>{xpCurrent.toLocaleString()} / {xpMax.toLocaleString()} XP</Text>
            <Text style={styles.xpLabel}>{totalUnlocked}/{totalVaultItems} vault items</Text>
          </View>
          <Pressable
            style={styles.leaderboardButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/leaderboard');
            }}
          >
            <Ionicons name="trophy-outline" size={14} color={Colors.secondary} />
            <Text style={styles.leaderboardButtonText}>LEADERBOARD</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* ── Legendary Find ── */}
        <View style={styles.legendarySection}>
          <Text style={styles.sectionTitle}>LEGENDARY FIND</Text>
          <LinearGradient colors={['#1A1200', '#2A1E00']} style={styles.legendaryCard}>
            <LegendaryGlow />
            <View style={styles.legendaryRingWrap}>
              <LinearGradient
                colors={['#E9C349', '#FF5C00', '#E9C349']}
                style={styles.legendaryRingGradient}
              >
                <View style={styles.legendaryInner}>
                  <Text style={styles.legendaryEmoji}>🏆</Text>
                </View>
              </LinearGradient>
            </View>
            <View style={styles.legendaryInfo}>
              <Text style={styles.legendaryName}>Preakness Champion</Text>
              <Text style={styles.legendaryRarity}>LEGENDARY · 1 of 450</Text>
              <View style={styles.legendaryChip}>
                <Text style={styles.legendaryChipText}>EXCLUSIVE</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Passport Entries ── */}
        <View style={styles.passportSection}>
          <View style={styles.passportSectionHeader}>
            <Text style={styles.sectionTitle}>VAULT PASSPORT</Text>
            <Text style={styles.passportSectionSub}>Discover hidden items inside each venue</Text>
          </View>
          <View style={styles.passportList}>
            {PASSPORT_VENUES.map((entry) => (
              <VenuePassportCard key={entry.venueId} entry={entry} unlockedIds={unlockedIds} />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.secondary, letterSpacing: 3, marginBottom: 4 },
  headerTitle: { fontFamily: Fonts.display, fontSize: 48, color: Colors.textPrimary, letterSpacing: -1, lineHeight: 52 },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.15)',
    marginTop: 8,
  },
  levelPillText: { fontFamily: Fonts.label, fontSize: 14, color: Colors.textPrimary },

  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(233,195,73,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.15)',
  },
  leaderboardButtonText: {
    flex: 1,
    fontFamily: Fonts.label,
    fontSize: 11,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  xpSection: { paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  xpBar: { marginBottom: 8 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  xpLabel: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted },

  sectionTitle: { fontFamily: Fonts.label, fontSize: 10, color: Colors.primary, letterSpacing: 3, marginBottom: 12 },

  legendarySection: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  legendaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.2)',
    overflow: 'hidden',
  },
  legendaryGlow: { borderRadius: 16, backgroundColor: 'rgba(233,195,73,0.08)' },
  legendaryRingWrap: { width: 80, height: 80 },
  legendaryRingGradient: { width: 80, height: 80, borderRadius: 40, padding: 3, justifyContent: 'center', alignItems: 'center' },
  legendaryInner: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#1A1200', alignItems: 'center', justifyContent: 'center' },
  legendaryEmoji: { fontSize: 32 },
  legendaryInfo: { flex: 1, gap: 4 },
  legendaryName: { fontFamily: Fonts.display, fontSize: 18, color: Colors.textPrimary },
  legendaryRarity: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.secondary },
  legendaryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(233,195,73,0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.3)',
    marginTop: 2,
  },
  legendaryChipText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 2 },

  passportSection: { paddingTop: 24 },
  passportSectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  passportSectionSub: { fontFamily: Fonts.bodyLight, fontSize: 12, color: Colors.textMuted, marginTop: -8 },
  passportList: { gap: 12, paddingHorizontal: 24 },

  passportCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  passportCardComplete: { borderColor: 'rgba(233,195,73,0.25)' },

  passportCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  passportVenueEmoji: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passportVenueEmojiText: { fontSize: 22 },
  passportVenueInfo: { flex: 1 },
  passportVenueName: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.textPrimary },
  passportVenueNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  passportCount: { fontFamily: Fonts.label, fontSize: 12, color: Colors.textMuted },
  completeChip: {
    backgroundColor: 'rgba(233,195,73,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.3)',
  },
  completeChipText: { fontFamily: Fonts.label, fontSize: 8, color: Colors.secondary, letterSpacing: 1 },

  passportProgressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 },
  passportProgressFill: { height: '100%', borderRadius: 2 },

  stampsRow: { gap: 10, paddingRight: 4 },
  stamp: { alignItems: 'center', width: 56, gap: 4 },
  stampLocked: { opacity: 0.4 },
  stampRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampEmoji: { fontSize: 20 },
  stampEmojiLocked: { fontSize: 16 },
  stampName: { fontFamily: Fonts.bodyLight, fontSize: 9, color: Colors.textSecondary, textAlign: 'center', lineHeight: 12 },
  stampNameLocked: { color: Colors.textMuted },
  stampRarityDot: { width: 5, height: 5, borderRadius: 3 },
});
