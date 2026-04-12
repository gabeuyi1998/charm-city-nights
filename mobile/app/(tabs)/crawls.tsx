import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { Button } from '../../components/ui';
import { ErrorRetry } from '../../components/ui/ErrorRetry';
import { getCrawls, joinCrawl, CrawlRoute as ApiCrawl } from '../../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Route {
  id: string;
  name: string;
  description: string;
  stops: string[];
  stopEmojis: string[];
  totalXp: number;
  badgeCount: number;
  difficulty: string;
  difficultyColor: string;
  estimatedHours: number;
  isJoined: boolean;
  completedStops: string[];
}

interface Voucher {
  id: string;
  barName: string;
  emoji: string;
  deal: string;
  expiresAt: string;
  qrCode: string;
  status: 'active' | 'used';
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ROUTES: Route[] = [
  {
    id: 'r1',
    name: 'THE FELLS POINT CRAWL',
    description: 'Historic waterfront bars',
    stops: ['The Horse You Came In On', "Cat's Eye Pub", 'Rec Pier Chophouse'],
    stopEmojis: ['🐴', '🐱', '⚓'],
    totalXp: 350,
    badgeCount: 3,
    difficulty: 'LEGENDARY',
    difficultyColor: '#F59E0B',
    estimatedHours: 3,
    isJoined: true,
    completedStops: ['The Horse You Came In On'],
  },
  {
    id: 'r2',
    name: 'FEDERAL HILL TOUR',
    description: 'South Baltimore classics',
    stops: ['Federal Hill Brewing', 'Banditos', 'No Way Jose'],
    stopEmojis: ['🍺', '🌮', '🌵'],
    totalXp: 250,
    badgeCount: 3,
    difficulty: 'RARE',
    difficultyColor: '#3B82F6',
    estimatedHours: 2,
    isJoined: false,
    completedStops: [],
  },
  {
    id: 'r3',
    name: 'INNER HARBOR ELITE',
    description: 'The premium harbor experience',
    stops: ['Power Plant Live', 'Lure', 'Sticky Rice'],
    stopEmojis: ['⚡', '🌆', '🍣'],
    totalXp: 450,
    badgeCount: 3,
    difficulty: 'EPIC',
    difficultyColor: '#8B5CF6',
    estimatedHours: 4,
    isJoined: false,
    completedStops: [],
  },
];

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 'v1',
    barName: 'The Horse You Came In On',
    emoji: '🐴',
    deal: 'Free shot with any beer',
    expiresAt: 'Tonight 2am',
    qrCode: 'CCN-V1-2026',
    status: 'active',
  },
  {
    id: 'v2',
    barName: 'Federal Hill Brewing',
    emoji: '🍺',
    deal: '$4 pint night',
    expiresAt: 'Tonight 11pm',
    qrCode: 'CCN-V2-2026',
    status: 'active',
  },
];

// ---------------------------------------------------------------------------
// QR Modal
// ---------------------------------------------------------------------------

interface QRModalProps {
  visible: boolean;
  voucher: Voucher | null;
  onClose: () => void;
}

function QRModal({ visible, voucher, onClose }: QRModalProps): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalCloseBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Ionicons name="qr-code" size={200} color={Colors.textPrimary} />

        {voucher && (
          <>
            <Text style={styles.modalCode}>{voucher.qrCode}</Text>
            <Text style={styles.modalBarName}>{voucher.barName}</Text>
            <Text style={styles.modalDeal}>{voucher.deal}</Text>
          </>
        )}
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Active Crawl Banner
// ---------------------------------------------------------------------------

interface ActiveCrawlBannerProps {
  route: Route;
}

function ActiveCrawlBanner({ route }: ActiveCrawlBannerProps): React.ReactElement {
  const completedCount = route.completedStops.length;
  const totalCount = route.stops.length;
  const nextStop = route.stops.find((s) => !route.completedStops.includes(s));

  return (
    <LinearGradient
      colors={['#1A0A2E', '#0A1A2E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.activeBanner}
    >
      <Text style={styles.activeBannerLabel}>ACTIVE CRAWL 🗺️</Text>
      <Text style={styles.activeBannerName}>{route.name}</Text>

      {/* Stop progress row */}
      <View style={styles.stopsRow}>
        {route.stops.map((stop, index) => {
          const isCompleted = route.completedStops.includes(stop);
          return (
            <React.Fragment key={stop}>
              <View
                style={[
                  styles.stopCircle,
                  {
                    backgroundColor: isCompleted
                      ? route.difficultyColor + '55'
                      : Colors.card,
                  },
                  isCompleted
                    ? { borderColor: route.difficultyColor, borderWidth: 1.5 }
                    : null,
                ]}
              >
                <Text style={styles.stopEmoji}>{route.stopEmojis[index]}</Text>
              </View>
              {index < route.stops.length - 1 && (
                <View style={styles.dashedConnector}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.dashSegment,
                        {
                          backgroundColor: isCompleted
                            ? route.difficultyColor + '88'
                            : 'rgba(255,255,255,0.2)',
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.activeBannerBottom}>
        <Text style={styles.nextStopText}>
          {nextStop ? `Next stop: ${nextStop}` : 'Crawl complete!'}
        </Text>
        <Text style={styles.progressFraction}>
          {completedCount}/{totalCount} stops
        </Text>
      </View>

      <Button
        label="CONTINUE →"
        variant="primary"
        size="sm"
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      />
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Route Card
// ---------------------------------------------------------------------------

interface RouteCardProps {
  route: Route;
  onJoin: (id: string) => void;
}

function RouteCard({ route, onJoin }: RouteCardProps): React.ReactElement {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (route.isJoined) {
      const nextStop = route.stops.find((s) => !route.completedStops.includes(s));
      if (nextStop) {
        // Navigate to the first incomplete bar if we have bar IDs
        router.push('/(tabs)/crawls' as never);
      }
    } else {
      onJoin(route.id);
    }
  }, [route, onJoin]);

  return (
    <View
      style={[styles.routeCard, { borderColor: route.difficultyColor + '33' }]}
    >
      {/* Top row: name + difficulty pill */}
      <View style={styles.routeCardTop}>
        <Text style={styles.routeName} numberOfLines={1}>
          {route.name}
        </Text>
        <View
          style={[
            styles.difficultyPill,
            {
              backgroundColor: route.difficultyColor + '22',
              borderColor: route.difficultyColor + '44',
            },
          ]}
        >
          <Text style={[styles.difficultyText, { color: route.difficultyColor }]}>
            {route.difficulty}
          </Text>
        </View>
      </View>

      <Text style={styles.routeDescription}>{route.description}</Text>

      {/* Stops row */}
      <View style={styles.routeStopsRow}>
        {route.stops.map((stop, index) => (
          <View key={stop} style={styles.routeStopItem}>
            <View
              style={[
                styles.routeStopCircle,
                { backgroundColor: route.difficultyColor + '22' },
              ]}
            >
              <Text style={styles.routeStopEmoji}>{route.stopEmojis[index]}</Text>
            </View>
            <Text style={styles.routeStopName} numberOfLines={1}>
              {stop.substring(0, 8)}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>⚡ {route.totalXp} XP</Text>
        <Text style={styles.statText}>🏅 {route.badgeCount} badges</Text>
        <Text style={styles.statText}>⏱ {route.estimatedHours}h</Text>
      </View>

      {route.isJoined ? (
        <Button
          label="CONTINUE CRAWL →"
          variant="primary"
          size="sm"
          onPress={handlePress}
        />
      ) : (
        <Button
          label="START CRAWL"
          variant="outline"
          size="sm"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onJoin(route.id); }}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Voucher Card
// ---------------------------------------------------------------------------

interface VoucherCardProps {
  voucher: Voucher;
  onQRPress: (voucher: Voucher) => void;
}

function VoucherCard({ voucher, onQRPress }: VoucherCardProps): React.ReactElement {
  return (
    <View style={styles.voucherCard}>
      <View style={styles.voucherEmojiBg}>
        <Text style={styles.voucherEmoji}>{voucher.emoji}</Text>
      </View>

      <View style={styles.voucherInfo}>
        <Text style={styles.voucherBarName}>{voucher.barName}</Text>
        <Text style={styles.voucherDeal}>{voucher.deal}</Text>
        <Text style={styles.voucherExpiry}>Expires: {voucher.expiresAt}</Text>
      </View>

      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onQRPress(voucher);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="qr-code-outline" size={28} color={Colors.secondary} />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CrawlsScreen(): React.ReactElement {
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  const fetchCrawls = useCallback(() => {
    setCrawlError(null);
    getCrawls().then((r) => {
      const mapped: Route[] = r.data.map((c: ApiCrawl) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        stops: c.stops.map((s) => s.bar.name),
        stopEmojis: c.stops.map((s) => s.bar.emoji),
        totalXp: c.totalXp,
        badgeCount: c.stops.length,
        difficulty: c.difficulty,
        difficultyColor: '#FF5C00',
        estimatedHours: c.estimatedHours,
        isJoined: (c.progress?.[0]?.completedStops ?? 0) > 0,
        completedStops: c.stops.slice(0, c.progress?.[0]?.completedStops ?? 0).map((s) => s.bar.name),
      }));
      setRoutes(mapped);
    }).catch((e: Error) => setCrawlError(e.message));
  }, []);

  useEffect(() => { fetchCrawls(); }, [fetchCrawls]);

  const activeRoute = routes.find((r) => r.isJoined) ?? null;

  const handleJoin = useCallback((crawlId: string) => {
    joinCrawl(crawlId)
      .then(() => {
        setRoutes((prev) =>
          prev.map((r) => (r.id === crawlId ? { ...r, isJoined: true } : r)),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      })
      .catch(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }, []);

  const handleQRPress = useCallback((voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setQrModalVisible(true);
  }, []);

  const handleQRClose = useCallback(() => {
    setQrModalVisible(false);
    setSelectedVoucher(null);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>BAR CRAWLS</Text>
          <Text style={styles.headerSubtitle}>
            Earn XP. Collect badges. Win Baltimore.
          </Text>
        </View>

        {/* Active crawl banner */}
        {activeRoute && <ActiveCrawlBanner route={activeRoute} />}

        {/* Routes section */}
        <Text style={styles.sectionTitle}>AVAILABLE ROUTES</Text>
        {crawlError ? (
          <Text style={{ color: '#FF5C00', paddingHorizontal: 16, marginBottom: 8, fontFamily: Fonts.body, fontSize: 13 }}>
            Could not load crawls: {crawlError}
          </Text>
        ) : null}
        {routes.length === 0 && !crawlError && (
          <Text style={{ color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 14, textAlign: 'center', marginTop: 24 }}>
            No crawls available yet.
          </Text>
        )}
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} onJoin={handleJoin} />
        ))}

        {/* Vouchers section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>YOUR VOUCHERS</Text>

        {MOCK_VOUCHERS.length === 0 ? (  // vouchers not yet in API — keeping mock
          <View style={styles.emptyVouchers}>
            <Text style={styles.emptyVouchersEmoji}>🎁</Text>
            <Text style={styles.emptyVouchersText}>
              Complete a crawl to earn vouchers
            </Text>
          </View>
        ) : (
          MOCK_VOUCHERS.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              onQRPress={handleQRPress}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <QRModal
        visible={qrModalVisible}
        voucher={selectedVoucher}
        onClose={handleQRClose}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: Fonts.bodyLight,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Active crawl banner
  activeBanner: {
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  activeBannerLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  activeBannerName: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  stopsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopEmoji: {
    fontSize: 18,
  },
  dashedConnector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginHorizontal: 4,
  },
  dashSegment: {
    width: 6,
    height: 2,
    borderRadius: 1,
  },
  activeBannerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  nextStopText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressFraction: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.primary,
  },

  // Section title
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },

  // Route card
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
  },
  routeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeName: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.textPrimary,
    flex: 1,
  },
  difficultyPill: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  difficultyText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  routeDescription: {
    fontFamily: Fonts.bodyLight,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  routeStopsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  routeStopItem: {
    alignItems: 'center',
    gap: 4,
  },
  routeStopCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeStopEmoji: {
    fontSize: 14,
  },
  routeStopName: {
    fontFamily: Fonts.bodyLight,
    fontSize: 9,
    color: Colors.textMuted,
    maxWidth: 48,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  statText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Voucher card
  voucherCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherEmojiBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherEmoji: {
    fontSize: 24,
  },
  voucherInfo: {
    flex: 1,
    marginLeft: 12,
  },
  voucherBarName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  voucherDeal: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  voucherExpiry: {
    fontFamily: Fonts.bodyLight,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  qrButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty vouchers
  emptyVouchers: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyVouchersEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyVouchersText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textMuted,
  },

  // QR Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 56,
    right: 32,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCode: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.primary,
    marginTop: 24,
    letterSpacing: 2,
  },
  modalBarName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalDeal: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
