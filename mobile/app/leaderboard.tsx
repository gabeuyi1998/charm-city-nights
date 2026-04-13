import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../constants/theme';
import { getLeaderboard, type LeaderboardEntry } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(displayName: string | null, username: string): string {
  const name = displayName ?? username;
  return name.slice(0, 2).toUpperCase();
}

function useResetCountdown(): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    function compute() {
      const now = new Date();
      const nextMonday = new Date(now);
      const day = now.getDay(); // 0=Sun
      const daysUntilMonday = day === 0 ? 1 : 8 - day;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      const diff = nextMonday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setLabel(`Resets in ${days}d ${hours}h`);
    }
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, []);
  return label;
}

// ─── Podium card (ranks 1–3) ──────────────────────────────────────────────────

const MEDAL_COLORS: Record<number, { ring: string; bg: string; label: string }> = {
  1: { ring: '#E9C349', bg: 'rgba(233,195,73,0.12)', label: '🥇' },
  2: { ring: '#C0C0C0', bg: 'rgba(192,192,192,0.08)', label: '🥈' },
  3: { ring: '#CD7F32', bg: 'rgba(205,127,50,0.08)', label: '🥉' },
};

function PodiumCard({ entry }: { entry: LeaderboardEntry }): React.ReactElement {
  const medal = MEDAL_COLORS[entry.rank];
  return (
    <LinearGradient
      colors={[medal.bg, 'transparent']}
      style={[styles.podiumCard, entry.isMe && styles.podiumCardMe]}
    >
      <View style={[styles.podiumAvatar, { borderColor: medal.ring }]}>
        <Text style={styles.podiumAvatarText}>{getInitials(entry.displayName, entry.username)}</Text>
      </View>
      <Text style={styles.podiumMedal}>{medal.label}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.displayName ?? entry.username}
      </Text>
      <Text style={styles.podiumUsername} numberOfLines={1}>@{entry.username}</Text>
      <View style={styles.podiumXpRow}>
        <Text style={[styles.podiumXp, { color: medal.ring }]}>{entry.xp.toLocaleString()}</Text>
        <Text style={styles.podiumXpLabel}> XP</Text>
      </View>
      <View style={[styles.levelBadge, { borderColor: medal.ring }]}>
        <Text style={[styles.levelBadgeText, { color: medal.ring }]}>LVL {entry.level}</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Regular row (ranks 4+) ───────────────────────────────────────────────────

function RankRow({ entry }: { entry: LeaderboardEntry }): React.ReactElement {
  return (
    <View style={[styles.rankRow, entry.isMe && styles.rankRowMe]}>
      <Text style={styles.rankNum}>#{entry.rank}</Text>
      <View style={styles.rankAvatar}>
        <Text style={styles.rankAvatarText}>{getInitials(entry.displayName, entry.username)}</Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>{entry.displayName ?? entry.username}</Text>
        <Text style={styles.rankUsername} numberOfLines={1}>@{entry.username}</Text>
      </View>
      <View style={styles.rankRight}>
        <Text style={styles.rankXp}>{entry.xp.toLocaleString()} XP</Text>
        <View style={styles.levelBadgeSmall}>
          <Text style={styles.levelBadgeSmallText}>LVL {entry.level}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow(): React.ReactElement {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonNum} />
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Scope = 'city' | 'neighborhood';

export default function LeaderboardScreen(): React.ReactElement {
  const [scope, setScope] = useState<Scope>('city');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resetLabel = useResetCountdown();

  const load = useCallback((s: Scope) => {
    setLoading(true);
    setError(null);
    getLeaderboard(s)
      .then((r) => setEntries(r.data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(scope); }, [load, scope]);

  function switchScope(s: Scope) {
    if (s === scope) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScope(s);
  }

  const podium = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>LEADERBOARD</Text>
          <Text style={styles.headerSub}>Baltimore's Finest</Text>
        </View>
        <View style={styles.resetChip}>
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.resetText}>{resetLabel}</Text>
        </View>
      </View>

      {/* Scope tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, scope === 'city' && styles.tabActive]}
          onPress={() => switchScope('city')}
        >
          <Text style={[styles.tabText, scope === 'city' && styles.tabTextActive]}>CITY</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, scope === 'neighborhood' && styles.tabActive]}
          onPress={() => switchScope('neighborhood')}
        >
          <Text style={[styles.tabText, scope === 'neighborhood' && styles.tabTextActive]}>HOOD</Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </ScrollView>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load(scope)}>
            <Text style={styles.retryText}>RETRY</Text>
          </Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No rankings yet. Be the first!</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Podium */}
          {podium.length > 0 && (
            <View style={styles.podiumRow}>
              {podium.map((e) => <PodiumCard key={e.rank} entry={e} />)}
            </View>
          )}

          {/* Divider */}
          {rest.length > 0 && (
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>RANKS 4–{entries.length}</Text>
              <View style={styles.divider} />
            </View>
          )}

          {/* Rank rows */}
          {rest.map((e) => <RankRow key={e.rank} entry={e} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceContainerLowest },
  scrollContent: { paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: Fonts.display, fontSize: 20, color: Colors.textPrimary, letterSpacing: 2 },
  headerSub: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  resetText: { fontFamily: Fonts.bodyLight, fontSize: 10, color: Colors.textMuted },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginVertical: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primaryContainer },
  tabText: { fontFamily: Fonts.label, fontSize: 12, color: Colors.textMuted, letterSpacing: 2 },
  tabTextActive: { color: Colors.textPrimary },

  podiumRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  podiumCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  podiumCardMe: { borderColor: 'rgba(255,92,0,0.4)' },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  podiumAvatarText: { fontFamily: Fonts.label, fontSize: 16, color: Colors.textPrimary },
  podiumMedal: { fontSize: 18 },
  podiumName: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },
  podiumUsername: { fontFamily: Fonts.bodyLight, fontSize: 10, color: Colors.textMuted },
  podiumXpRow: { flexDirection: 'row', alignItems: 'baseline' },
  podiumXp: { fontFamily: Fonts.label, fontSize: 14 },
  podiumXpLabel: { fontFamily: Fonts.bodyLight, fontSize: 10, color: Colors.textMuted },
  levelBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  levelBadgeText: { fontFamily: Fonts.label, fontSize: 9, letterSpacing: 1 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginVertical: 12, gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 2 },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rankRowMe: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryContainer,
    backgroundColor: 'rgba(255,92,0,0.04)',
  },
  rankNum: { fontFamily: Fonts.label, fontSize: 13, color: Colors.textMuted, width: 28, textAlign: 'right' },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarText: { fontFamily: Fonts.label, fontSize: 13, color: Colors.textPrimary },
  rankInfo: { flex: 1 },
  rankName: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  rankUsername: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  rankRight: { alignItems: 'flex-end', gap: 4 },
  rankXp: { fontFamily: Fonts.label, fontSize: 12, color: Colors.secondary },
  levelBadgeSmall: {
    backgroundColor: 'rgba(255,92,0,0.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.2)',
  },
  levelBadgeSmallText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.primaryContainer, letterSpacing: 1 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  errorText: { fontFamily: Fonts.bodyLight, fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  emptyText: { fontFamily: Fonts.bodyLight, fontSize: 14, color: Colors.textMuted },
  retryBtn: {
    marginTop: 4,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: Fonts.label, fontSize: 12, color: Colors.textPrimary, letterSpacing: 2 },

  skeletonRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  skeletonNum: { width: 28, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)' },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  skeletonLines: { flex: 1, gap: 6 },
  skeletonLine1: { height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', width: '60%' },
  skeletonLine2: { height: 10, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)', width: '40%' },
});
