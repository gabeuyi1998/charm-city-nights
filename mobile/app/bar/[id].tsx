import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Layout } from '../../constants/theme';
import { getBar, postCheckin, Bar as ApiBar } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { VaultTab } from '../../components/ui/VaultTab';
import { subscribeCrowdUpdates } from '../../lib/socket';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Story Reel Avatar ────────────────────────────────────────────────────────
function StoryAvatar({ label, isLive }: { label: string; isLive?: boolean }): React.ReactElement {
  return (
    <View style={styles.storyAvatarWrap}>
      <LinearGradient
        colors={isLive ? ['#FF5C00', '#E9C349'] : ['#2A2A2A', '#1A1A1A']}
        style={styles.storyAvatarRing}
      >
        <View style={styles.storyAvatarInner} />
      </LinearGradient>
      <Text style={[styles.storyLabel, isLive && styles.storyLabelLive]}>{label}</Text>
    </View>
  );
}

// ─── Stat Cell ────────────────────────────────────────────────────────────────
function StatCell({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BarDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bar, setBar] = React.useState<ApiBar | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'vault'>('overview');
  const [xpToast, setXpToast] = React.useState<number | null>(null);
  const [checkInLoading, setCheckInLoading] = React.useState(false);
  const [checkInError, setCheckInError] = React.useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = React.useState(false);
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const xpTranslate = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!id) return;
    getBar(id)
      .then((res) => setBar(res.data))
      .catch(() => setBar(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Subscribe to live crowd updates for this bar
  React.useEffect(() => {
    if (!id) return;
    return subscribeCrowdUpdates([id], ({ barId, currentCrowd }) => {
      if (barId === id) {
        setBar((prev) => prev ? { ...prev, currentCrowd } : prev);
      }
    });
  }, [id]);

  const handleBack = useCallback(() => { router.back(); }, [router]);

  const showXpToast = useCallback((xp: number) => {
    setXpToast(xp);
    xpOpacity.setValue(0);
    xpTranslate.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(xpOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(xpTranslate, { toValue: -40, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.timing(xpOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setXpToast(null));
  }, [xpOpacity, xpTranslate]);

  const handleCheckIn = useCallback(async () => {
    if (!bar || checkInLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckInError(null);
    setCheckInLoading(true);
    try {
      const expLoc = await import('expo-location');
      const { status } = await expLoc.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCheckInError('Location permission required to check in.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      const loc = await expLoc.getCurrentPositionAsync({});
      const res = await postCheckin({
        barId: bar.id,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setBar((prev) => prev ? { ...prev, currentCrowd: res.data.currentCrowd } : prev);
      setCheckInSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (res.data.xpAwarded > 0) showXpToast(res.data.xpAwarded);
      setTimeout(() => setCheckInSuccess(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message ?? 'Check-in failed';
      setCheckInError(msg.includes('Too far') ? "You're not close enough to this bar to check in." : msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCheckInLoading(false);
    }
  }, [bar, checkInLoading, showXpToast]);

  if (loading) return <View style={styles.container} />;

  if (!bar) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.notFoundText}>Bar not found</Text>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isPackedStatus = bar.currentCrowd >= 80;
  const activeSpecial = bar.activeSpecials?.[0]?.title;
  const statusText = bar.currentCrowd >= 90 ? 'AT CAPACITY' : bar.currentCrowd >= 70 ? 'PACKED' : bar.currentCrowd >= 40 ? 'BUZZING' : 'CHILL';

  return (
    <View style={styles.container}>
      {/* Fixed back button */}
      <Pressable style={styles.backButton} onPress={handleBack} hitSlop={12}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </Pressable>

      {/* XP toast */}
      {xpToast !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.xpToast,
            { opacity: xpOpacity, transform: [{ translateY: xpTranslate }] },
          ]}
        >
          <Text style={styles.xpToastText}>+{xpToast} XP 🔥</Text>
        </Animated.View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <LinearGradient
          colors={['#1A0800', '#0e0e0e']}
          style={styles.hero}
        >
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={StyleSheet.absoluteFill}
          />

          {/* Story reels */}
          <View style={styles.storyReels}>
            <StoryAvatar label="LIVE" isLive />
            <StoryAvatar label="BAR" />
            <StoryAvatar label="FLOOR" />
          </View>

          {/* Status + name */}
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              {isPackedStatus && (
                <View style={styles.packedChip}>
                  <Text style={styles.packedText}>{statusText}</Text>
                </View>
              )}
              <Text style={styles.vibeLabel}>NOIR AESTHETIC</Text>
            </View>
            <Text style={styles.barTitle}>{bar.name}</Text>
            <Text style={styles.barNeighborhood}>{bar.neighborhood} · Baltimore</Text>
          </View>
        </LinearGradient>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('overview'); }}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>OVERVIEW</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'vault' && styles.tabActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab('vault'); }}
          >
            <Text style={[styles.tabText, activeTab === 'vault' && styles.tabTextActive]}>🔒 AFTER DARK</Text>
          </Pressable>
        </View>

        {/* Vault tab content */}
        {activeTab === 'vault' && <VaultTab venueId={bar.id} venueName={bar.name} />}

        {/* Overview content */}
        {activeTab === 'overview' && <>

        {/* Stats bento */}
        <View style={styles.statsGrid}>
          <StatCell label="ATMOSPHERE" value="Electric" />
          <StatCell label="STATUS" value={statusText} />
          <StatCell label="CAPACITY" value={`${bar.currentCrowd}%`} />
          <StatCell label="VIBE" value="Members Only" />
        </View>

        {/* Tonight's Special */}
        {activeSpecial && (
          <View style={styles.specialCard}>
            <Text style={styles.specialHeading}>TONIGHT'S SPECIAL</Text>
            <Text style={styles.specialText}>{activeSpecial}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <View style={{ flex: 1 }}>
            <Button
              label={checkInSuccess ? 'CHECKED IN ✓' : checkInLoading ? 'CHECKING IN...' : 'CHECK IN 🔥'}
              variant="primary"
              size="lg"
              onPress={handleCheckIn}
              disabled={checkInLoading || checkInSuccess}
            />
          </View>
          <Pressable
            style={styles.shareBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>
        {checkInError ? (
          <View style={styles.checkInError}>
            <Ionicons name="alert-circle-outline" size={15} color="#FF5C00" />
            <Text style={styles.checkInErrorText}>{checkInError}</Text>
          </View>
        ) : null}

        {/* VIP Upgrade card */}
        <LinearGradient
          colors={['#1A1000', '#221800']}
          style={styles.vipCard}
        >
          <Text style={styles.vipCardLabel}>ELEVATE YOUR PRESENCE</Text>
          <Text style={styles.vipCardTitle}>Upgrade to VIP Table</Text>
          <Text style={styles.vipCardSub}>Reserved seating · Priority access · Gold status</Text>
          <Pressable style={styles.vipCardBtn}>
            <Text style={styles.vipCardBtnText}>INQUIRE →</Text>
          </Pressable>
        </LinearGradient>

        {/* Crowd bar */}
        <View style={styles.crowdSection}>
          <View style={styles.crowdLabelRow}>
            <Text style={styles.crowdLabel}>CROWD LEVEL</Text>
            <Text style={styles.crowdPct}>{bar.currentCrowd}%</Text>
          </View>
          <View style={styles.crowdTrack}>
            <LinearGradient
              colors={['#FF5C00', '#E9C349']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.crowdFill, { width: `${bar.currentCrowd}%` as any }]}
            />
          </View>
        </View>
        </>}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContent: { alignItems: 'center', justifyContent: 'center', gap: 16 },

  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: Colors.surfaceContainerHighest },
  tabText: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted, letterSpacing: 1 },
  tabTextActive: { color: Colors.primaryContainer },

  // Hero
  hero: {
    height: Layout.heroHeight,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  storyReels: { flexDirection: 'row', gap: 16 },
  storyAvatarWrap: { alignItems: 'center', gap: 6 },
  storyAvatarRing: { width: 64, height: 64, borderRadius: 32, padding: 2, justifyContent: 'center', alignItems: 'center' },
  storyAvatarInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surfaceContainerHighest },
  storyLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 2 },
  storyLabelLive: { color: Colors.secondary },

  heroContent: { gap: 4 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  packedChip: {
    backgroundColor: 'rgba(255,92,0,0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.4)',
  },
  packedText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.primaryContainer, letterSpacing: 1.5 },
  vibeLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 2 },
  barTitle: { fontFamily: Fonts.display, fontSize: 40, color: Colors.textPrimary, fontStyle: 'italic', lineHeight: 44, letterSpacing: -1 },
  barNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textSecondary },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 12,
  },
  statCell: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 2, marginBottom: 6 },
  statValue: { fontFamily: Fonts.display, fontSize: 16, color: Colors.textPrimary },

  // Special
  specialCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(233,195,73,0.06)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.2)',
    marginBottom: 16,
  },
  specialHeading: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 2, marginBottom: 6 },
  specialText: { fontFamily: Fonts.body, fontSize: 16, color: Colors.textPrimary },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 8 },
  checkInError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  checkInErrorText: { fontFamily: Fonts.bodyLight, fontSize: 13, color: '#FF5C00', flex: 1 },
  shareBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // VIP
  vipCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.2)',
  },
  vipCardLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 3, marginBottom: 6 },
  vipCardTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  vipCardSub: { fontFamily: Fonts.bodyLight, fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  vipCardBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.secondary, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8 },
  vipCardBtnText: { fontFamily: Fonts.label, fontSize: 11, color: Colors.secondary, letterSpacing: 2 },

  // Crowd bar
  crowdSection: { paddingHorizontal: 24, marginBottom: 16 },
  crowdLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  crowdLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted, letterSpacing: 2 },
  crowdPct: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: Colors.textPrimary },
  crowdTrack: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden' },
  crowdFill: { height: '100%', borderRadius: 3 },

  // Not found
  notFoundText: { fontFamily: Fonts.display, fontSize: 24, color: Colors.textPrimary },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryContainer, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  backBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.textPrimary },

  // XP toast
  xpToast: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,92,0,0.95)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 50,
  },
  xpToastText: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: '#fff',
    letterSpacing: 1,
  },
});
