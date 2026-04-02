import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
  Pressable,
  ListRenderItemInfo,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Layout } from '../../constants/theme';
import { BarCard, BarData } from '../../components/ui/BarCard';
import { VenueCard } from '../../components/ui/VenueCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { getBars, Bar as ApiBar } from '../../lib/api';
import { subscribeCrowdUpdates } from '../../lib/socket';
import { MOCK_BARS } from '../../constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function toBarData(bar: ApiBar): BarData {
  return {
    id: bar.id,
    name: bar.name,
    neighborhood: bar.neighborhood,
    vibe: 'Nightlife',
    color: '#FF5C00',
    currentCrowd: bar.currentCrowd,
    checkInsTonight: 0,
    activeSpecial: bar.activeSpecials?.[0]?.title,
    emoji: bar.emoji,
    badgeEmoji: '🏅',
    badgeRarity: 'COMMON',
  };
}

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────
function LiveDot(): React.ReactElement {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.liveDot, style]} />;
}

// ─── Rank Card ────────────────────────────────────────────────────────────────
function RankCard(): React.ReactElement {
  return (
    <View style={styles.rankCard}>
      <View style={styles.rankAvatarWrap}>
        <Image
          source={{ uri: MOCK_USER_PHOTOS[0].uri }}
          style={styles.rankAvatarImg}
          accessibilityLabel="Profile photo"
        />
        <View style={styles.vipChip}>
          <Text style={styles.vipText}>VIP</Text>
        </View>
      </View>
      <View>
        <Text style={styles.rankLabel}>YOUR STANDING</Text>
        <Text style={styles.rankName}>A-List Ghost</Text>
        <Text style={styles.rankSub}>Inner Harbor • 847 XP</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.secondary} style={{ marginLeft: 'auto' }} />
    </View>
  );
}

// ─── Who's Out Tonight ───────────────────────────────────────────────────────
// Reusable mock user photos — diverse, fun, nightlife-appropriate
export const MOCK_USER_PHOTOS = [
  { id: 'u1', name: 'Jake M.',    location: 'Fells Point',   uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face' },
  { id: 'u2', name: 'Kate R.',    location: 'Federal Hill',  uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face' },
  { id: 'u3', name: 'Alex N.',    location: 'Canton',        uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face' },
  { id: 'u4', name: 'Priya S.',   location: 'Mt. Vernon',    uri: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face' },
  { id: 'u5', name: 'Marcus T.',  location: 'Inner Harbor',  uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face' },
  { id: 'u6', name: 'Zoe L.',     location: 'Hampden',       uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face' },
];

const FRIENDS_OUT = MOCK_USER_PHOTOS.slice(0, 3);

function FriendsOutStrip(): React.ReactElement {
  return (
    <View style={styles.friendsCard}>
      <View style={styles.friendsTopRow}>
        <Text style={styles.friendsLabel}>WHO'S OUT TONIGHT?</Text>
        <Text style={styles.friendsLink}>See all →</Text>
      </View>
      <View style={styles.friendsRow}>
        {FRIENDS_OUT.map((f) => (
          <View key={f.id} style={styles.friendAvatar}>
            <View style={styles.friendAvatarRing}>
              <Image source={{ uri: f.uri }} style={styles.friendAvatarImg} accessibilityLabel={f.name} />
            </View>
            <Text style={styles.friendName}>{f.name.split(' ')[0]}</Text>
            <Text style={styles.friendLocation}>{f.location}</Text>
          </View>
        ))}
        <View style={styles.friendsMore}>
          <View style={styles.friendsMoreCircle}>
            <Text style={styles.friendsMoreText}>+5</Text>
          </View>
          <Text style={styles.friendName}>others</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Trending Neighborhoods ───────────────────────────────────────────────────
const TRENDING_HOODS = [
  { tag: '#FellsPoint', emoji: '🔥', hot: true,  count: '247' },
  { tag: '#FederalHill', emoji: '⚡', hot: false, count: '134' },
  { tag: '#Canton', emoji: '🎵', hot: false,      count: '89' },
  { tag: '#MtVernon', emoji: '🌆', hot: false,    count: '56' },
  { tag: '#Hampden', emoji: '🎨', hot: false,     count: '42' },
];

function HotPillGlow(): React.ReactElement {
  const glowOpacity = useSharedValue(0.15);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [glowOpacity]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, styles.hotPillGlow, glowStyle]} />;
}

function TrendingStrip(): React.ReactElement {
  const [active, setActive] = React.useState(0);
  return (
    <View style={styles.trendingSection}>
      <Text style={styles.sectionLabel}>TRENDING NOW</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContent}>
        {TRENDING_HOODS.map((h, i) => (
          <Pressable
            key={h.tag}
            style={[styles.trendingPill, active === i && styles.trendingPillActive, h.hot && styles.trendingPillHot]}
            onPress={() => { Haptics.selectionAsync(); setActive(i); }}
          >
            {h.hot && <HotPillGlow />}
            <Text style={styles.trendingEmoji}>{h.emoji}</Text>
            <View>
              <Text style={[styles.trendingTag, active === i && styles.trendingTagActive]}>{h.tag}</Text>
              <Text style={styles.trendingCount}>{h.count} here</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Stories Row ─────────────────────────────────────────────────────────────
const STORY_VENUES = [
  {
    id: '1', neighborhood: 'Fells Point', title: 'Bloom Rooftop', isLive: true,
    viewerCount: 142,
    imageUri: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&h=600&fit=crop',
  },
  {
    id: '2', neighborhood: 'Federal Hill', title: 'The Owl Room', isLive: false,
    viewerCount: 89,
    imageUri: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=600&fit=crop',
  },
  {
    id: '3', neighborhood: 'Canton', title: 'Underground 24', isLive: false,
    viewerCount: 67,
    imageUri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=600&fit=crop',
  },
  {
    id: '4', neighborhood: 'Mt. Vernon', title: 'Electric Ave', isLive: false,
    viewerCount: 45,
    imageUri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=600&fit=crop',
  },
];

function AnimatedStoryRing({ isLive, children }: { isLive: boolean; children: React.ReactNode }): React.ReactElement {
  const ringOpacity = useSharedValue(1);
  useEffect(() => {
    if (!isLive) return;
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [isLive, ringOpacity]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value }));
  return (
    <View style={styles.storyRingWrap}>
      {isLive && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.storyLiveRing, ringStyle]} />
      )}
      {children}
    </View>
  );
}

function StoriesRow({ onPress }: { onPress: () => void }): React.ReactElement {
  return (
    <FlatList
      data={STORY_VENUES}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.storiesContent}
      ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
      renderItem={({ item }: ListRenderItemInfo<typeof STORY_VENUES[0]>) => (
        <View>
          <AnimatedStoryRing isLive={item.isLive}>
            <VenueCard
              neighborhood={item.neighborhood}
              title={item.title}
              isLive={item.isLive}
              imageUri={item.imageUri}
              onPress={onPress}
            />
          </AnimatedStoryRing>
          <View style={styles.storyViewerRow}>
            {item.isLive && <View style={styles.storyLiveDot} />}
            <Text style={styles.storyViewerCount}>{item.viewerCount} watching</Text>
          </View>
        </View>
      )}
    />
  );
}

// ─── Hottest Spots Bento ──────────────────────────────────────────────────────
function HottestSpots({ bars }: { bars: BarData[] }): React.ReactElement {
  const top3 = bars.slice(0, 3);
  if (top3.length === 0) return <View />;

  const [first, second, third] = top3;

  return (
    <View style={styles.bentoSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>HOTTEST SPOTS</Text>
        <View style={styles.liveRow}>
          <LiveDot />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.bentoGrid}>
        {/* Rank 1 — wide card */}
        {first && (
          <LinearGradient
            colors={['#1A0800', '#2A1000']}
            style={styles.bentoCardLarge}
          >
            <View style={styles.bentoBadge}>
              <Text style={styles.bentoBadgeText}>#1</Text>
            </View>
            <View style={styles.bentoCapacityChip}>
              <Text style={styles.bentoCapacityText}>AT CAPACITY</Text>
            </View>
            <Text style={styles.bentoBarName}>{first.name}</Text>
            <Text style={styles.bentoNeighborhood}>{first.neighborhood}</Text>
            <View style={styles.bentoCrowdBar}>
              <View style={[styles.bentoCrowdFill, { width: `${first.currentCrowd}%` }]} />
            </View>
          </LinearGradient>
        )}

        {/* Rank 2 & 3 — side by side */}
        <View style={styles.bentoSmallRow}>
          {[second, third].filter(Boolean).map((bar, i) => (
            <LinearGradient
              key={bar!.id}
              colors={['#111111', '#1A1A1A']}
              style={styles.bentoCardSmall}
            >
              <Text style={styles.bentoBadgeSmall}>#{i + 2}</Text>
              <Text style={styles.bentoBarNameSmall}>{bar!.name}</Text>
              <Text style={styles.bentoNeighborhoodSmall}>{bar!.neighborhood}</Text>
            </LinearGradient>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bars, setBars] = useState<BarData[]>([]);
  const [error] = useState<string | null>(null);

  const fetchBars = useCallback(async () => {
    try {
      const res = await getBars();
      setBars(res.data.map(toBarData));
      setError(null);
    } catch {
      // Fall back to mock data so UI always shows content
      setBars(MOCK_BARS.map((b) => ({
        id: b.id,
        name: b.name,
        neighborhood: b.neighborhood,
        vibe: b.vibe,
        color: b.color,
        currentCrowd: b.currentCrowd,
        checkInsTonight: 0,
        activeSpecial: b.activeSpecial,
        emoji: b.emoji,
        badgeEmoji: b.badgeEmoji,
        badgeRarity: b.badgeRarity as BarData['badgeRarity'],
      })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBars(); }, [fetchBars]);

  useEffect(() => {
    if (bars.length === 0) return;
    const ids = bars.map((b) => b.id);
    return subscribeCrowdUpdates(ids, ({ barId, currentCrowd }) => {
      setBars((prev) => prev.map((b) => (b.id === barId ? { ...b, currentCrowd } : b)));
    });
  }, [bars.length]);

  const sortedBars = [...bars].sort((a, b) => b.currentCrowd - a.currentCrowd);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchBars(); }, [fetchBars]);

  const handleStoryPress = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/story-viewer');
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="menu-outline" size={24} color={Colors.primaryContainer} />
        </Pressable>
        <Text style={styles.headerBrand}>CHARM CITY</Text>
        <Pressable
          hitSlop={12}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/notifications'); }}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.primaryContainer} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryContainer} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section — city map bg */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?w=800&auto=format&fit=crop' }}
          style={styles.heroBg}
          imageStyle={styles.heroBgImage}
        >
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <Text style={styles.currentStatusLabel}>CURRENT STATUS</Text>
            <Text style={styles.heroTitle}>Baltimore{'\n'}After Dark</Text>
            <RankCard />
          </View>
        </ImageBackground>

        {/* Live Stories */}
        <View style={styles.storiesSection}>
          <Text style={styles.sectionLabel}>LIVE STORIES</Text>
          <StoriesRow onPress={handleStoryPress} />
        </View>

        {/* Loading skeleton */}
        {loading && (
          <View style={styles.skeletonWrap}>
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" style={{ marginTop: 8 }} />
          </View>
        )}

        {/* Error state */}
        {error && !loading && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Who's Out Tonight */}
        <FriendsOutStrip />

        {/* Trending Neighborhoods */}
        <TrendingStrip />

        {/* Hottest Spots bento */}
        {!loading && !error && <HottestSpots bars={sortedBars} />}

        {/* Full bar feed */}
        {!loading && !error && (
          <View style={styles.feedSection}>
            <Text style={styles.sectionLabel}>ALL BARS TONIGHT</Text>
            {sortedBars.map((bar) => (
              <BarCard
                key={bar.id}
                bar={bar}
                onCheckIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                onShare={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                isLive={bar.currentCrowd >= 80}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(14,14,14,0.9)',
    zIndex: 10,
  },
  headerBrand: {
    fontFamily: Fonts.display,
    fontSize: 20,
    fontStyle: 'italic',
    color: Colors.primaryContainer,
    letterSpacing: 3,
  },

  scrollContent: { paddingBottom: 100 },

  // Hero
  heroBg: {
    width: SCREEN_WIDTH,
    height: 400,
    justifyContent: 'flex-end',
  },
  heroBgImage: {
    opacity: 0.35,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  currentStatusLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: Colors.secondary,
    letterSpacing: 4,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 48,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 52,
    marginBottom: 20,
  },

  // Rank card
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.1)',
    gap: 12,
  },
  rankAvatarWrap: { position: 'relative' },
  rankAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  rankAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(233,195,73,0.4)',
  },
  vipChip: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: Colors.secondary,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  vipText: { fontFamily: Fonts.label, fontSize: 8, color: '#3C2F00' },
  rankLabel: {
    fontFamily: Fonts.label,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  rankName: { fontFamily: Fonts.display, fontSize: 16, color: Colors.textPrimary },
  rankSub: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textSecondary },

  // Stories
  storiesSection: { paddingTop: 20 },
  storiesContent: { paddingHorizontal: 24, paddingVertical: 12 },

  // Section labels
  sectionLabel: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 3,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryContainer,
  },
  liveText: { fontFamily: Fonts.label, fontSize: 10, color: Colors.primaryContainer, letterSpacing: 2 },

  // Bento grid
  bentoSection: { marginTop: 24 },
  bentoGrid: { paddingHorizontal: 24, gap: 8 },
  bentoCardLarge: {
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.15)',
  },
  bentoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bentoBadgeText: { fontFamily: Fonts.label, fontSize: 11, color: '#fff' },
  bentoCapacityChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,92,0,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
  },
  bentoCapacityText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.primaryContainer, letterSpacing: 1 },
  bentoBarName: { fontFamily: Fonts.display, fontSize: 22, color: Colors.textPrimary },
  bentoNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
  bentoCrowdBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bentoCrowdFill: {
    height: '100%',
    backgroundColor: Colors.primaryContainer,
    borderRadius: 2,
  },
  bentoSmallRow: { flexDirection: 'row', gap: 8 },
  bentoCardSmall: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  bentoBadgeSmall: { fontFamily: Fonts.label, fontSize: 10, color: Colors.secondary, marginBottom: 4 },
  bentoBarNameSmall: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  bentoNeighborhoodSmall: { fontFamily: Fonts.bodyLight, fontSize: 10, color: Colors.textMuted },

  // Feed
  feedSection: { marginTop: 24 },

  // States
  skeletonWrap: { padding: 24, gap: 8 },
  errorWrap: { alignItems: 'center', padding: 40, gap: 8 },
  errorEmoji: { fontSize: 40 },
  errorText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  // Friends Out strip
  friendsCard: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.1)',
  },
  friendsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  friendsLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.secondary, letterSpacing: 2 },
  friendsLink: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.primaryContainer },
  friendsRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  friendAvatar: { alignItems: 'center', gap: 4, width: 60 },
  friendAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    overflow: 'hidden',
  },
  friendAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  friendName: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textPrimary, textAlign: 'center' },
  friendLocation: { fontFamily: Fonts.bodyLight, fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  friendsMore: { alignItems: 'center', gap: 4, width: 52 },
  friendsMoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsMoreText: { fontFamily: Fonts.display, fontSize: 14, color: Colors.textMuted },

  // Trending
  trendingSection: { marginTop: 20 },
  trendingContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  trendingPillActive: {
    backgroundColor: 'rgba(255,92,0,0.12)',
    borderColor: Colors.primaryContainer,
  },
  trendingPillHot: {
    borderColor: 'rgba(255,92,0,0.4)',
  },
  hotPillGlow: {
    borderRadius: 20,
    backgroundColor: Colors.primaryContainer,
  },
  trendingEmoji: { fontSize: 16 },
  trendingTag: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
  trendingTagActive: { color: Colors.primaryContainer },
  trendingCount: { fontFamily: Fonts.bodyLight, fontSize: 9, color: Colors.textMuted, marginTop: 1 },

  // Story ring + viewer
  storyRingWrap: { borderRadius: 14, overflow: 'hidden' },
  storyLiveRing: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
  },
  storyViewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  storyLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primaryContainer,
  },
  storyViewerCount: { fontFamily: Fonts.bodyLight, fontSize: 10, color: Colors.textMuted },
});
