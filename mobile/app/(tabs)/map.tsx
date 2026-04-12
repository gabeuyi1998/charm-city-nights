import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Animated,
  Linking,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

import { Colors, Fonts } from '../../constants/theme';
import { getDiscoverFeed, getBars, DiscoverBar, BrandAmbassador, BarEventItem, Bar as ApiBar } from '../../lib/api';
import { subscribeCrowdUpdates } from '../../lib/socket';
import { BASE_URL } from '../../lib/api';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function crowdColor(crowd: number): string {
  if (crowd >= 70) return '#FF5C00';
  if (crowd >= 40) return '#E9C349';
  return '#555555';
}

function crowdLabel(crowd: number): string {
  if (crowd >= 90) return 'AT CAPACITY';
  if (crowd >= 70) return 'PACKED';
  if (crowd >= 40) return 'BUZZING';
  if (crowd >= 10) return 'CHILL';
  return 'QUIET';
}

function eventTypeIcon(type: string): string {
  switch (type) {
    case 'dj': return '🎧';
    case 'live_music': return '🎸';
    case 'open_mic': return '🎤';
    case 'special': return '⭐';
    default: return '🎉';
  }
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h > 12 ? h - 12 : h || 12}:${m} ${ampm}`;
}

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ bar, onClose }: { bar: DiscoverBar | ApiBar; onClose: () => void }) {
  const checkinUrl = `${BASE_URL.replace('/api', '')}/checkin/${bar.id}`;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.qrSheet} onPress={() => {}}>
          <View style={styles.qrHandle} />
          <Text style={styles.qrBarEmoji}>{bar.emoji}</Text>
          <Text style={styles.qrBarName}>{bar.name}</Text>
          <Text style={styles.qrSub}>Show this code to check in & earn XP</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={checkinUrl}
              size={200}
              color="#FF5C00"
              backgroundColor="#0A0A0F"
            />
          </View>
          <Text style={styles.qrNeighborhood}>{bar.neighborhood}</Text>
          <Pressable style={styles.qrClose} onPress={onClose}>
            <Text style={styles.qrCloseText}>CLOSE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Ambassador Avatar ────────────────────────────────────────────────────────

function AmbassadorChip({ a }: { a: BrandAmbassador }) {
  const openIG = () => {
    if (a.instagramHandle) {
      Linking.openURL(`https://instagram.com/${a.instagramHandle}`);
    }
  };
  return (
    <Pressable style={styles.ambassadorChip} onPress={a.instagramHandle ? openIG : undefined}>
      <View style={[styles.ambassadorAvatar, { backgroundColor: a.avatarColor + '22', borderColor: a.avatarColor }]}>
        <Text style={[styles.ambassadorInitials, { color: a.avatarColor }]}>{a.avatarInitials}</Text>
      </View>
      <View style={styles.ambassadorInfo}>
        <Text style={styles.ambassadorName} numberOfLines={1}>{a.name}</Text>
        <Text style={styles.ambassadorRole}>{a.role}</Text>
        {a.instagramHandle && (
          <Text style={styles.ambassadorIG}>@{a.instagramHandle}</Text>
        )}
      </View>
      {a.instagramHandle && (
        <Ionicons name="logo-instagram" size={14} color="#C13584" style={{ marginLeft: 'auto' }} />
      )}
    </Pressable>
  );
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: BarEventItem }) {
  return (
    <View style={styles.eventRow}>
      <Text style={styles.eventIcon}>{eventTypeIcon(event.eventType)}</Text>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {event.performer && <Text style={styles.eventPerformer}>{event.performer}</Text>}
      </View>
      <Text style={styles.eventTime}>{formatEventTime(event.startsAt)}</Text>
    </View>
  );
}

// ─── Featured Bar Card (top 3) ────────────────────────────────────────────────

function FeaturedCard({ bar, rank, onQR, onView }: {
  bar: DiscoverBar;
  rank: number;
  onQR: () => void;
  onView: () => void;
}) {
  const color = crowdColor(bar.currentCrowd);
  const label = crowdLabel(bar.currentCrowd);
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseOpacity]);

  return (
    <View style={styles.featuredCard}>
      {/* Header row */}
      <View style={styles.featuredHeader}>
        <LinearGradient colors={['rgba(255,92,0,0.15)', 'transparent']} style={styles.featuredHeaderGradient} />
        <View style={styles.featuredRankBadge}>
          <Text style={styles.featuredRankText}>#{rank}</Text>
        </View>
        <Text style={styles.featuredEmoji}>{bar.emoji}</Text>
        <View style={styles.featuredTitles}>
          <Text style={styles.featuredName}>{bar.name}</Text>
          <Text style={styles.featuredNeighborhood}>{bar.neighborhood}</Text>
        </View>
        <Animated.View style={[styles.liveDot, { opacity: pulseOpacity }]} />
      </View>

      {/* Crowd bar */}
      <View style={styles.crowdRow}>
        <Text style={styles.crowdSectionLabel}>CROWD</Text>
        <Text style={[styles.crowdChip, { color }]}>{label}</Text>
        <Text style={styles.crowdPct}>{bar.currentCrowd}%</Text>
      </View>
      <View style={styles.crowdTrack}>
        <View style={[styles.crowdFill, { width: `${bar.currentCrowd}%` as any, backgroundColor: color }]} />
      </View>

      {/* Tonight's lineup */}
      {bar.events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TONIGHT'S LINEUP</Text>
          {bar.events.slice(0, 2).map((e) => <EventRow key={e.id} event={e} />)}
        </View>
      )}

      {/* Active specials */}
      {bar.activeSpecials?.length > 0 && (
        <View style={styles.specialBanner}>
          <Ionicons name="star" size={12} color="#E9C349" />
          <Text style={styles.specialText}>{bar.activeSpecials[0].title}</Text>
        </View>
      )}

      {/* Ambassadors */}
      {bar.ambassadors?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR HOSTS TONIGHT</Text>
          {bar.ambassadors.slice(0, 2).map((a) => <AmbassadorChip key={a.id} a={a} />)}
        </View>
      )}

      {/* Instagram link */}
      {bar.instagramHandle && (
        <Pressable
          style={styles.igRow}
          onPress={() => Linking.openURL(`https://instagram.com/${bar.instagramHandle}`)}
        >
          <Ionicons name="logo-instagram" size={16} color="#C13584" />
          <Text style={styles.igHandle}>@{bar.instagramHandle}</Text>
          <Text style={styles.igCta}>See what's happening →</Text>
        </Pressable>
      )}

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <Pressable
          style={styles.qrButton}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onQR(); }}
        >
          <Ionicons name="qr-code-outline" size={16} color={Colors.primaryContainer} />
          <Text style={styles.qrButtonText}>CHECK IN QR</Text>
        </Pressable>
        <Pressable
          style={styles.viewButton}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onView(); }}
        >
          <Text style={styles.viewButtonText}>VIEW BAR →</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Regular Bar Row ──────────────────────────────────────────────────────────

function BarRow({ bar, onPress, onQR }: { bar: DiscoverBar | ApiBar; onPress: () => void; onQR: () => void }) {
  const color = crowdColor(bar.currentCrowd);
  const ambassadors = (bar as DiscoverBar).ambassadors ?? [];

  return (
    <Pressable style={styles.barRow} onPress={onPress}>
      <View style={styles.barRowEmoji}>
        <Text style={styles.barRowEmojiText}>{bar.emoji}</Text>
      </View>
      <View style={styles.barRowBody}>
        <Text style={styles.barRowName} numberOfLines={1}>{bar.name}</Text>
        <Text style={styles.barRowNeighborhood}>{bar.neighborhood}</Text>
        {ambassadors.length > 0 && (
          <Text style={styles.barRowAmbassadors} numberOfLines={1}>
            {ambassadors.map(a => a.name).join(' · ')}
          </Text>
        )}
      </View>
      <View style={styles.barRowRight}>
        <Text style={[styles.barRowCrowd, { color }]}>{crowdLabel(bar.currentCrowd)}</Text>
        <View style={styles.barRowTrack}>
          <View style={[styles.barRowFill, { width: `${bar.currentCrowd}%` as any, backgroundColor: color }]} />
        </View>
        <Pressable onPress={onQR} hitSlop={8}>
          <Ionicons name="qr-code-outline" size={18} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen(): React.ReactElement {
  const router = useRouter();
  const [bars, setBars] = useState<(DiscoverBar | ApiBar)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrBar, setQrBar] = useState<DiscoverBar | ApiBar | null>(null);
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      // Try enriched discover endpoint first, fall back to basic bars
      const res = await getDiscoverFeed().catch(() => null);
      if (res?.data) {
        setBars(res.data);
      } else {
        // Get location for distance
        let params: { lat?: number; lng?: number } = {};
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          params = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
        const basic = await getBars(params);
        setBars(basic.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bars');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live crowd updates
  useEffect(() => {
    if (bars.length === 0) return;
    return subscribeCrowdUpdates(bars.map((b) => b.id), ({ barId, currentCrowd }) => {
      setBars((prev) => prev.map((b) => b.id === barId ? { ...b, currentCrowd } : b));
    });
  }, [bars.length]);

  const featured = bars.slice(0, 3) as DiscoverBar[];
  const rest = bars.slice(3);

  const totalCheckIns = bars.reduce((sum, b) => sum + ((b as DiscoverBar)._count?.checkIns ?? 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* QR Modal */}
      {qrBar && <QRModal bar={qrBar} onClose={() => setQrBar(null)} />}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>DISCOVER</Text>
          <Text style={styles.headerTitle}>Baltimore</Text>
        </View>
        <View style={styles.headerStats}>
          <View style={styles.statChip}>
            <View style={styles.statDot} />
            <Text style={styles.statText}>{bars.length} bars live</Text>
          </View>
          {totalCheckIns > 0 && (
            <View style={styles.statChip}>
              <Text style={styles.statText}>{totalCheckIns} tonight</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'featured' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('featured'); }}
        >
          <Text style={[styles.tabText, activeTab === 'featured' && styles.tabTextActive]}>FEATURED</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('all'); }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>ALL BARS</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryContainer} />
          <Text style={styles.loadingText}>Loading live bars…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>RETRY</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={Colors.primaryContainer}
            />
          }
        >
          {activeTab === 'featured' ? (
            <>
              {featured.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>No featured bars tonight.</Text>
                </View>
              ) : (
                featured.map((bar, i) => (
                  <FeaturedCard
                    key={bar.id}
                    bar={bar}
                    rank={i + 1}
                    onQR={() => setQrBar(bar)}
                    onView={() => router.push(`/bar/${bar.id}`)}
                  />
                ))
              )}

              {/* Remaining bars as compact rows */}
              {rest.length > 0 && (
                <View style={styles.restSection}>
                  <Text style={styles.restLabel}>MORE SPOTS TONIGHT</Text>
                  {rest.map((bar) => (
                    <BarRow
                      key={bar.id}
                      bar={bar}
                      onPress={() => router.push(`/bar/${bar.id}`)}
                      onQR={() => setQrBar(bar)}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.allBarsSection}>
              {bars.map((bar) => (
                <BarRow
                  key={bar.id}
                  bar={bar}
                  onPress={() => router.push(`/bar/${bar.id}`)}
                  onQR={() => setQrBar(bar)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.primaryContainer, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { fontFamily: Fonts.display, fontSize: 32, color: Colors.textPrimary, letterSpacing: -1 },
  headerStats: { gap: 6, alignItems: 'flex-end', paddingBottom: 4 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primaryContainer },
  statText: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primaryContainer },
  tabText: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  tabTextActive: { color: '#fff' },

  scroll: { paddingBottom: 48 },

  // Featured card
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#13131A',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: 12,
  },
  featuredHeaderGradient: { ...StyleSheet.absoluteFillObject },
  featuredRankBadge: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredRankText: { fontFamily: Fonts.label, fontSize: 11, color: '#fff', letterSpacing: 1 },
  featuredEmoji: { fontSize: 28 },
  featuredTitles: { flex: 1 },
  featuredName: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.textPrimary },
  featuredNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryContainer },

  // Crowd
  crowdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 6 },
  crowdSectionLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 2, flex: 1 },
  crowdChip: { fontFamily: Fonts.label, fontSize: 9, letterSpacing: 1 },
  crowdPct: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textMuted },
  crowdTrack: { marginHorizontal: 16, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  crowdFill: { height: '100%', borderRadius: 2 },

  // Sections
  section: { paddingHorizontal: 16, marginBottom: 14 },
  sectionLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 2, marginBottom: 10 },

  // Events
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 },
  eventIcon: { fontSize: 18 },
  eventInfo: { flex: 1 },
  eventTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  eventPerformer: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  eventTime: { fontFamily: Fonts.label, fontSize: 11, color: Colors.primaryContainer, letterSpacing: 0.5 },

  // Special banner
  specialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(233,195,73,0.08)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.2)',
  },
  specialText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#E9C349', flex: 1 },

  // Ambassador
  ambassadorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  ambassadorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambassadorInitials: { fontFamily: Fonts.label, fontSize: 13 },
  ambassadorInfo: { flex: 1 },
  ambassadorName: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  ambassadorRole: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted },
  ambassadorIG: { fontFamily: Fonts.bodyLight, fontSize: 10, color: '#C13584', marginTop: 1 },

  // Instagram row
  igRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(193,53,132,0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(193,53,132,0.2)',
  },
  igHandle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#C13584' },
  igCta: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' as any },

  // Card actions
  cardActions: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 4 },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  qrButtonText: { fontFamily: Fonts.label, fontSize: 11, color: Colors.primaryContainer, letterSpacing: 1 },
  viewButton: {
    flex: 1,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: { fontFamily: Fonts.label, fontSize: 11, color: '#fff', letterSpacing: 1 },

  // Bar row (compact)
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  barRowEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barRowEmojiText: { fontSize: 22 },
  barRowBody: { flex: 1 },
  barRowName: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.textPrimary },
  barRowNeighborhood: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  barRowAmbassadors: { fontFamily: Fonts.bodyLight, fontSize: 10, color: '#C13584', marginTop: 2 },
  barRowRight: { alignItems: 'flex-end', gap: 5, minWidth: 80 },
  barRowCrowd: { fontFamily: Fonts.label, fontSize: 9, letterSpacing: 1 },
  barRowTrack: { width: 64, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barRowFill: { height: '100%', borderRadius: 2 },

  restSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  restLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 2, paddingHorizontal: 20, paddingVertical: 12 },

  allBarsSection: {},

  // QR Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  qrSheet: {
    backgroundColor: '#13131A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  qrHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 8 },
  qrBarEmoji: { fontSize: 42 },
  qrBarName: { fontFamily: Fonts.display, fontSize: 24, color: Colors.textPrimary, letterSpacing: 1 },
  qrSub: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  qrBox: {
    backgroundColor: '#0A0A0F',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.2)',
  },
  qrNeighborhood: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  qrClose: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  qrCloseText: { fontFamily: Fonts.label, fontSize: 12, color: Colors.textPrimary, letterSpacing: 2 },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingText: { fontFamily: Fonts.bodyLight, fontSize: 14, color: Colors.textMuted },
  errorText: { fontFamily: Fonts.bodyLight, fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  emptyText: { fontFamily: Fonts.bodyLight, fontSize: 14, color: Colors.textMuted },
  retryBtn: { backgroundColor: Colors.primaryContainer, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginTop: 4 },
  retryText: { fontFamily: Fonts.label, fontSize: 12, color: '#fff', letterSpacing: 2 },
});
