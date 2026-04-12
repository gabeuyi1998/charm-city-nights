import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheetLib from '@gorhom/bottom-sheet';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Button } from '../../components/ui/Button';
import { BadgeCard } from '../../components/ui/BadgeCard';
import { Colors, BadgeRarity as BadgeRarityColors, Fonts } from '../../constants/theme';
import type { RarityLevel } from '../../components/ui/BadgeCard';
import { router } from 'expo-router';
import { getMe, getBadges, clearToken, UserProfile, Badge } from '../../lib/api';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_USER = {
  username: 'JMILLZ_BMORE',
  displayName: 'Jordan Miller',
  level: 7,
  xp: 3420,
  barsVisited: 14,
  badgesCollected: 6,
  totalBadges: 20,
  following: 89,
  followers: 247,
  bio: 'Level 7 Night Crawler · Baltimore 🦀',
  hasStory: true,
};

interface BadgeData {
  id: string;
  emoji: string;
  name: string;
  rarity: RarityLevel;
  barName: string;
  isCollected: boolean;
}

const MOCK_BADGES: BadgeData[] = [
  { id: 'b1', emoji: '🐎', name: 'Old Mare', rarity: 'LEGENDARY', barName: 'The Horse You Came In On', isCollected: true },
  { id: 'b2', emoji: '⚡', name: 'Power Surge', rarity: 'LEGENDARY', barName: 'Power Plant Live', isCollected: true },
  { id: 'b3', emoji: '🌺', name: 'Maximón Spirit', rarity: 'EPIC', barName: 'Maximón', isCollected: true },
  { id: 'b4', emoji: '🎵', name: 'Night Cat', rarity: 'RARE', barName: "Cat's Eye Pub", isCollected: true },
  { id: 'b5', emoji: '🏭', name: 'Brew Master', rarity: 'RARE', barName: 'Federal Hill Brewing', isCollected: true },
  { id: 'b6', emoji: '🤠', name: 'Bandito', rarity: 'COMMON', barName: 'Banditos', isCollected: true },
  { id: 'b7', emoji: '🦅', name: 'Harbor Hawk', rarity: 'EPIC', barName: 'Lure', isCollected: false },
  { id: 'b8', emoji: '🎨', name: 'Art Collector', rarity: 'RARE', barName: "The Brewer's Art", isCollected: false },
  { id: 'b9', emoji: '🪝', name: 'Anchor Drop', rarity: 'RARE', barName: 'The Anchor', isCollected: false },
  { id: 'b10', emoji: '🤟', name: 'Indie Spirit', rarity: 'RARE', barName: 'Ottobar', isCollected: false },
  { id: 'b11', emoji: '🔌', name: 'Union Member', rarity: 'RARE', barName: 'Union Craft Brewing', isCollected: false },
  { id: 'b12', emoji: '🌊', name: 'Wet Badge', rarity: 'RARE', barName: 'Wet City', isCollected: false },
  { id: 'b13', emoji: '🕵️', name: 'Elk Hunter', rarity: 'LEGENDARY', barName: 'The Elk Room', isCollected: false },
  { id: 'b14', emoji: '🃏', name: 'Charles Regular', rarity: 'COMMON', barName: 'Club Charles', isCollected: false },
  { id: 'b15', emoji: '😵‍💫', name: 'The Dizzler', rarity: 'COMMON', barName: 'The Dizz', isCollected: false },
  { id: 'b16', emoji: '🌻', name: 'West Coast', rarity: 'COMMON', barName: 'Golden West Cafe', isCollected: false },
  { id: 'b17', emoji: '🥢', name: 'Rice Roller', rarity: 'COMMON', barName: 'Sticky Rice', isCollected: false },
  { id: 'b18', emoji: '💧', name: 'City Drop', rarity: 'RARE', barName: 'Wet City', isCollected: false },
  { id: 'b19', emoji: '🏈', name: "Moe's Regular", rarity: 'COMMON', barName: "Moe's Tavern", isCollected: false },
  { id: 'b20', emoji: '👑', name: 'Pier King', rarity: 'EPIC', barName: 'Rec Pier Chophouse', isCollected: false },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_WIDTH - 4) / 3;

const HIGHLIGHTS = [
  { emoji: '🏆', label: 'Badges' },
  { emoji: '🗺️', label: 'Crawls' },
  { emoji: '🍺', label: 'Bars' },
  { emoji: '⭐', label: 'Faves' },
];

const VIDEO_PLACEHOLDERS = [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }];

type ActiveTab = 'badges' | 'videos' | 'tagged';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<ActiveTab>('badges');
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheetLib>(null);
  const snapPoints = useMemo(() => ['45%', '75%'], []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMe().then((r) => setUser(r.data)),
      getBadges().then((r) => {
        setBadges(r.data.map((b: Badge) => ({
          id: b.id,
          emoji: b.emoji,
          name: b.name,
          rarity: b.rarity as RarityLevel,
          barName: b.barName,
          isCollected: b.isCollected,
        })));
      }),
    ])
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBadgePress = useCallback((badge: BadgeData) => {
    setSelectedBadge(badge);
    bottomSheetRef.current?.expand();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    [],
  );

  const renderBadge = useCallback(
    ({ item }: { item: BadgeData }) => (
      <BadgeCard
        emoji={item.emoji}
        name={item.name}
        rarity={item.rarity}
        barName={item.barName}
        isCollected={item.isCollected}
        onPress={() => handleBadgePress(item)}
      />
    ),
    [handleBadgePress],
  );

  const renderVideoPlaceholder = useCallback(
    ({ item }: { item: { id: string } }) => (
      <View key={item.id} style={[styles.videoTile, { width: TILE_SIZE, height: TILE_SIZE }]}>
        <Ionicons name="play-circle-outline" size={32} color="#FF6B35" />
      </View>
    ),
    [],
  );

  const rarityColor = selectedBadge ? BadgeRarityColors[selectedBadge.rarity] : '#9CA3AF';

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Top Nav */}
        <View style={styles.topNav}>
          <View style={styles.topNavPlaceholder} />
          <Text style={styles.usernameText}>{user?.username ?? ''}</Text>
          <Pressable
            style={styles.menuBtn}
            onPress={async () => { await clearToken(); router.replace('/(auth)/'); }}
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {false ? (
            <LinearGradient
              colors={['#FF6B35', '#FFD700', '#FF3366']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.storyRing}
            >
              <View style={styles.storyRingInner}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>JM</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.avatarCircleNoStory}>
              <Text style={styles.avatarInitials}>JM</Text>
            </View>
          )}

          <Text style={styles.displayName}>{user?.displayName ?? ''}</Text>
          <Text style={styles.bioText}>{user?.bio ?? ''}</Text>
          <View style={styles.editButtonWrap}>
            <Button
              label="EDIT PROFILE"
              variant="outline"
              size="md"
              onPress={() => router.push('/edit-profile')}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { value: user?.barsVisited ?? 0, label: 'BARS' },
            { value: user?.badgesCollected ?? 0, label: 'BADGES' },
            { value: user?.following ?? 0, label: 'FOLLOWING', pressable: true },
            { value: user?.followers ?? 0, label: 'FOLLOWERS', pressable: true },
          ].map((stat, idx) => (
            <Pressable
              key={stat.label}
              style={[styles.statCell, idx < 3 && styles.statCellBorder]}
              onPress={
                stat.pressable
                  ? () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  : undefined
              }
            >
              <Text style={styles.statNumber}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Highlights */}
        <FlatList
          horizontal
          data={HIGHLIGHTS}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          style={styles.highlightsList}
          contentContainerStyle={styles.highlightsContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.highlightItem}
              onPress={() => Haptics.selectionAsync()}
            >
              <View style={styles.highlightCircle}>
                <Text style={styles.highlightEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.highlightLabel}>{item.label}</Text>
            </Pressable>
          )}
        />

        {/* Content Tabs */}
        <View style={styles.tabRow}>
          {(
            [
              { key: 'badges', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
              { key: 'videos', activeIcon: 'play-circle', inactiveIcon: 'play-circle-outline' },
              { key: 'tagged', activeIcon: 'pricetag', inactiveIcon: 'pricetag-outline' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabCell}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab.key);
                }}
                accessibilityLabel={tab.key}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={24}
                  color={isActive ? '#FF6B35' : 'rgba(255,255,255,0.4)'}
                />
                {isActive && <View style={styles.tabActiveLine} />}
              </Pressable>
            );
          })}
        </View>

        {/* Tab Content */}
        {activeTab === 'badges' && (
          <>
            <FlatList
              data={badges}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              renderItem={renderBadge}
              columnWrapperStyle={styles.badgeColumnWrapper}
              ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
            />
            {badges.length === 0 && (
              <Text style={styles.emptyText}>No badges yet. Start checking in!</Text>
            )}
          </>
        )}

        {activeTab === 'videos' && (
          <View>
            <FlatList
              data={VIDEO_PLACEHOLDERS}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              renderItem={renderVideoPlaceholder}
              columnWrapperStyle={styles.badgeColumnWrapper}
            />
            <Text style={styles.videosEmptyText}>Share your first video clip!</Text>
          </View>
        )}

        {activeTab === 'tagged' && (
          <View style={styles.taggedEmpty}>
            <Text style={styles.taggedEmoji}>🏷️</Text>
            <Text style={styles.taggedTitle}>No tags yet</Text>
            <Text style={styles.taggedSubtitle}>
              Bar owners can feature your clips here
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Badge Detail Bottom Sheet */}
      <BottomSheetLib
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetEmoji}>{selectedBadge?.emoji ?? ''}</Text>
          <Text style={styles.sheetBadgeName}>{selectedBadge?.name ?? ''}</Text>
          <View
            style={[
              styles.rarityPill,
              {
                backgroundColor: rarityColor + '22',
                borderColor: rarityColor,
              },
            ]}
          >
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {selectedBadge?.rarity ?? ''}
            </Text>
          </View>
          <Text style={styles.sheetBarName}>{selectedBadge?.barName ?? ''}</Text>
          <Text style={styles.sheetDate}>Collected March 2026</Text>
          <View style={styles.sheetButtons}>
            <Button
              label="SHARE BADGE 🏅"
              variant="primary"
              size="full"
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            />
            <Button
              label="VIEW BAR →"
              variant="outline"
              size="full"
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            />
          </View>
        </BottomSheetView>
      </BottomSheetLib>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Top nav
  topNav: {
    paddingTop: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavPlaceholder: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
  },
  usernameText: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  menuBtn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  storyRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingInner: {
    backgroundColor: Colors.background,
    borderRadius: 43,
    padding: 2,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleNoStory: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  displayName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginTop: 16,
  },
  bioText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  editButtonWrap: {
    marginTop: 12,
    paddingHorizontal: 40,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 16,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statCellBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  statNumber: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.bodyLight,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Highlights
  highlightsList: {
    marginVertical: 16,
  },
  highlightsContent: {
    paddingHorizontal: 12,
  },
  highlightItem: {
    width: 70,
    alignItems: 'center',
  },
  highlightCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightEmoji: {
    fontSize: 24,
  },
  highlightLabel: {
    fontFamily: Fonts.bodyLight,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabCell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActiveLine: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 1,
  },

  // Badge grid
  badgeColumnWrapper: {
    gap: 2,
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    textAlign: 'center',
    marginTop: 40,
  },

  // Videos
  videoTile: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videosEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },

  // Tagged
  taggedEmpty: {
    paddingVertical: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  taggedEmoji: {
    fontSize: 48,
  },
  taggedTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: Colors.textMuted,
    marginTop: 8,
  },
  taggedSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },

  // Bottom sheet
  sheetBackground: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  sheetEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  sheetBadgeName: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.textPrimary,
  },
  rarityPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  rarityText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  sheetBarName: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sheetDate: {
    fontFamily: Fonts.bodyLight,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sheetButtons: {
    marginTop: 24,
    gap: 8,
    width: '100%',
  },
});
