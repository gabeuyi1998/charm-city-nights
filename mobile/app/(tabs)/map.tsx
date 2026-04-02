import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/theme';
import { getBars, Bar as ApiBar, postCheckin } from '../../lib/api';
import { subscribeCrowdUpdates } from '../../lib/socket';
import Mapbox, { MapView, Camera, MarkerView } from '@rnmapbox/maps';
import { MOCK_BARS } from '../../constants/mockData';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NEIGHBORHOODS = ['All', 'Fells Point', 'Federal Hill', 'Canton', 'Inner Harbor', 'Mount Vernon', 'Hampden', 'Downtown'];

// Real Baltimore neighborhood coordinates [longitude, latitude]
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  'Fells Point':   [-76.5930, 39.2839],
  'Federal Hill':  [-76.6117, 39.2780],
  'Canton':        [-76.5734, 39.2827],
  'Inner Harbor':  [-76.6122, 39.2859],
  'Mount Vernon':  [-76.6161, 39.2989],
  'Hampden':       [-76.6416, 39.3401],
  'Downtown':      [-76.6158, 39.2904],
  'Charles Village':[-76.6226, 39.3254],
  'Medfield':      [-76.6559, 39.3147],
  'Inner Harbor East':[-76.5978, 39.2863],
};

const DEFAULT_COORD: [number, number] = [-76.6122, 39.2904];

interface BarItem {
  id: string;
  name: string;
  neighborhood: string;
  emoji: string;
  crowd: number;
}

function crowdColor(pct: number): string {
  if (pct >= 75) return '#FF3366';
  if (pct >= 40) return '#E9C349';
  return '#00C9A7';
}

function crowdLabel(pct: number): string {
  if (pct >= 90) return 'AT CAPACITY';
  if (pct >= 75) return 'PACKED';
  if (pct >= 40) return 'BUZZING';
  return 'CHILL';
}

// ─── Bar Row ──────────────────────────────────────────────────────────────────
function BarRow({ item, onCheckIn }: { item: BarItem; onCheckIn: (id: string) => void }): React.ReactElement {
  const color = crowdColor(item.crowd);
  const label = crowdLabel(item.crowd);

  return (
    <View style={styles.card}>
      <View style={styles.cardEmojiWrap}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardNeighborhood}>{item.neighborhood}</Text>
        <View style={styles.crowdRow}>
          <View style={styles.crowdTrack}>
            <View style={[styles.crowdFill, { width: `${item.crowd}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[styles.crowdChip, { color }]}>{label}</Text>
        </View>
      </View>
      <Pressable
        style={styles.checkInBtn}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCheckIn(item.id); }}
      >
        <Text style={styles.checkInText}>CHECK IN</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MapScreen(): React.ReactElement {
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [bars, setBars] = useState<BarItem[]>([]);

  useEffect(() => {
    getBars().then((r) => {
      setBars(r.data.map((b: ApiBar) => ({
        id: b.id,
        name: b.name,
        neighborhood: b.neighborhood,
        emoji: b.emoji,
        crowd: b.currentCrowd,
      })));
    }).catch(() => {
      // Fallback to mock data so the list always populates
      setBars(MOCK_BARS.map((b) => ({
        id: b.id,
        name: b.name,
        neighborhood: b.neighborhood,
        emoji: b.emoji,
        crowd: b.currentCrowd,
      })));
    });
  }, []);

  useEffect(() => {
    if (bars.length === 0) return;
    return subscribeCrowdUpdates(bars.map((b) => b.id), ({ barId, currentCrowd }) => {
      setBars((prev) => prev.map((b) => b.id === barId ? { ...b, crowd: currentCrowd } : b));
    });
  }, [bars.length]);

  const handleCheckIn = useCallback(async (barId: string) => {
    try {
      const loc = await import('expo-location').then((m) => m.getCurrentPositionAsync({}));
      const res = await postCheckin({ barId, latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setBars((prev) => prev.map((b) => b.id === barId ? { ...b, crowd: res.data.currentCrowd } : b));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const filtered = bars.filter((b) => {
    const matchN = activeFilter === 'All' || b.neighborhood === activeFilter;
    const matchS = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.neighborhood.toLowerCase().includes(search.toLowerCase());
    return matchN && matchS;
  });

  const renderItem = useCallback(
    ({ item }: { item: BarItem }) => <BarRow item={item} onCheckIn={handleCheckIn} />,
    [handleCheckIn],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>DISCOVER</Text>
          <Text style={styles.headerTitle}>Baltimore</Text>
        </View>
        <View style={styles.headerMeta}>
          <View style={styles.liveDot} />
          <Text style={styles.headerMetaText}>{bars.length} bars live</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bars, neighborhoods..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={styles.searchClear}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Neighborhood filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
        style={styles.filterScroll}
      >
        {NEIGHBORHOODS.map((n) => (
          <Pressable
            key={n}
            style={[styles.chip, activeFilter === n && styles.chipActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveFilter(n); }}
          >
            {activeFilter === n ? (
              <LinearGradient
                colors={['rgba(255,92,0,0.2)', 'rgba(255,92,0,0.1)']}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <Text style={[styles.chipText, activeFilter === n && styles.chipTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Map or fallback */}
      {process.env.EXPO_PUBLIC_MAPBOX_TOKEN ? (
        <View style={styles.mapContainer}>
          <MapView style={StyleSheet.absoluteFill} styleURL={Mapbox.StyleURL.Dark}>
            <Camera
              centerCoordinate={[-76.6122, 39.2904]}
              zoomLevel={12}
              animationMode="none"
            />
            {filtered.map((bar) => (
              <MarkerView
                key={bar.id}
                id={bar.id}
                coordinate={NEIGHBORHOOD_COORDS[bar.neighborhood] ?? DEFAULT_COORD}
              >
                <View style={styles.mapPin}>
                  <Text style={styles.mapPinEmoji}>{bar.emoji}</Text>
                </View>
              </MarkerView>
            ))}
          </MapView>
        </View>
      ) : (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>🗺️  Set EXPO_PUBLIC_MAPBOX_TOKEN to enable interactive map</Text>
        </View>
      )}

      {/* Bar list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🦀</Text>
            <Text style={styles.emptyText}>No bars found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.primaryContainer, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { fontFamily: Fonts.display, fontSize: 32, color: Colors.textPrimary, letterSpacing: -1 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primaryContainer },
  headerMetaText: { fontFamily: Fonts.bodyLight, fontSize: 12, color: Colors.textMuted },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    marginHorizontal: 24,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, fontFamily: Fonts.body, paddingVertical: 12 },
  searchClear: { color: Colors.textMuted, fontSize: 14, paddingLeft: 8 },

  filterScroll: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  chipActive: { borderColor: Colors.primaryContainer },
  chipText: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  chipTextActive: { color: Colors.primaryContainer },

  mapContainer: {
    marginHorizontal: 24,
    marginBottom: 8,
    height: SCREEN_HEIGHT * 0.28,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinEmoji: { fontSize: 14 },

  noticeBanner: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  noticeText: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  list: { paddingHorizontal: 24, paddingBottom: 100, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardName: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 2 },
  cardNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginBottom: 8 },
  crowdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  crowdTrack: { flex: 1, height: 3, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 2, overflow: 'hidden' },
  crowdFill: { height: '100%', borderRadius: 2 },
  crowdChip: { fontFamily: Fonts.label, fontSize: 9, letterSpacing: 1, width: 78 },

  checkInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,92,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
  },
  checkInText: { fontFamily: Fonts.label, fontSize: 10, color: Colors.primaryContainer, letterSpacing: 1 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontFamily: Fonts.display, fontSize: 20, color: Colors.textMuted },
});
