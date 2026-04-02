import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/theme';
import { getVaultItems, MOCK_UNLOCKED_IDS } from '../../constants/vaultData';
import type { VaultItem, VaultRarity } from '../../types/vault';
import { NightTracker } from './NightTracker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - 72) / 2;

function rarityColor(r: VaultRarity): string {
  switch (r) {
    case 'LEGENDARY': return '#E9C349';
    case 'EPIC':      return '#B47AFF';
    case 'RARE':      return '#4EC9FF';
    default:          return Colors.textMuted;
  }
}

function rarityGlow(r: VaultRarity): string {
  switch (r) {
    case 'LEGENDARY': return 'rgba(233,195,73,0.18)';
    case 'EPIC':      return 'rgba(180,122,255,0.18)';
    case 'RARE':      return 'rgba(78,201,255,0.18)';
    default:          return 'rgba(255,255,255,0.04)';
  }
}

// ─── Pulsing lock ring on unrevealed items ────────────────────────────────────
function LockPulse(): React.ReactElement {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[StyleSheet.absoluteFill, styles.lockPulseRing, style]} />;
}

// ─── Vault Item Card ──────────────────────────────────────────────────────────
function VaultCard({
  item,
  unlocked,
  onUnlock,
}: {
  item: VaultItem;
  unlocked: boolean;
  onUnlock: (id: string) => void;
}): React.ReactElement {
  const scale = useSharedValue(1);
  const glow  = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  const handlePress = useCallback(() => {
    if (unlocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withTiming(1.04, { duration: 120 }),
      withTiming(1.0,  { duration: 200 }),
    );
    glow.value = withSequence(
      withTiming(0.8, { duration: 200 }),
      withTiming(0,   { duration: 600 }, () => runOnJS(onUnlock)(item.id)),
    );
  }, [unlocked, item.id, onUnlock, scale, glow]);

  const rc = rarityColor(item.rarity);
  const bg = rarityGlow(item.rarity);

  return (
    <Animated.View style={[styles.vaultCard, { backgroundColor: bg }, cardStyle]}>
      {!unlocked && <LockPulse />}
      <View style={[styles.vaultCardBorder, { borderColor: unlocked ? rc : 'rgba(255,255,255,0.08)' }]}>
        {/* Rarity tag */}
        <View style={[styles.rarityTag, { backgroundColor: `${rc}22`, borderColor: `${rc}44` }]}>
          <Text style={[styles.rarityText, { color: rc }]}>{item.rarity}</Text>
        </View>

        {/* Emoji */}
        <Text style={styles.vaultEmoji}>{item.emoji}</Text>

        {/* Name */}
        <Text style={styles.vaultName} numberOfLines={2}>{item.name}</Text>

        {/* Hint or revealed content */}
        {unlocked ? (
          <View style={styles.revealedContent}>
            {item.secretCode ? (
              <View style={[styles.codeBox, { borderColor: rc }]}>
                <Text style={[styles.codeText, { color: rc }]}>{item.secretCode}</Text>
              </View>
            ) : (
              <Text style={styles.revealedDesc} numberOfLines={3}>{item.description}</Text>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.hintText} numberOfLines={2}>{item.hint}</Text>
            <Pressable style={styles.unlockBtn} onPress={handlePress}>
              <Ionicons name="lock-closed" size={10} color={Colors.textMuted} />
              <Text style={styles.unlockBtnText}>{item.triggerLabel}</Text>
            </Pressable>
          </>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Midnight Drop Card ───────────────────────────────────────────────────────
function MidnightDropCard({
  item,
  unlocked,
  onUnlock,
}: {
  item: VaultItem;
  unlocked: boolean;
  onUnlock: (id: string) => void;
}): React.ReactElement {
  return (
    <LinearGradient
      colors={['#1A0E00', '#251500', '#1A0E00']}
      style={styles.dropCard}
    >
      <LinearGradient
        colors={['rgba(233,195,73,0.08)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.dropHeader}>
        <View style={styles.dropBadge}>
          <Text style={styles.dropBadgeText}>🌑 MIDNIGHT DROP</Text>
        </View>
        {item.dropExpiresIn && (
          <View style={styles.dropTimer}>
            <Text style={styles.dropTimerText}>⏳ {item.dropExpiresIn}</Text>
          </View>
        )}
      </View>

      <Text style={styles.dropEmoji}>{item.emoji}</Text>
      <Text style={styles.dropName}>{item.name}</Text>
      <Text style={styles.dropRarity}>{item.rarity} · EXCLUSIVE</Text>

      {unlocked ? (
        <View style={styles.dropUnlocked}>
          {item.secretCode ? (
            <View style={styles.dropCodeBox}>
              <Text style={styles.dropCodeLabel}>SAY THIS AT THE BAR</Text>
              <Text style={styles.dropCode}>{item.secretCode}</Text>
            </View>
          ) : (
            <Text style={styles.dropRevealedDesc}>{item.description}</Text>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.dropHint}>{item.hint}</Text>
          <Pressable
            style={styles.dropUnlockBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onUnlock(item.id);
            }}
          >
            <LinearGradient
              colors={[Colors.primaryContainer, '#FF7439']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dropUnlockGradient}
            >
              <Ionicons name="lock-open-outline" size={14} color="#fff" />
              <Text style={styles.dropUnlockText}>{item.triggerLabel.toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
        </>
      )}
    </LinearGradient>
  );
}

// ─── Main VaultTab ────────────────────────────────────────────────────────────
interface VaultTabProps {
  venueId: string;
  venueName: string;
}

export function VaultTab({ venueId, venueName }: VaultTabProps): React.ReactElement {
  const items = getVaultItems(venueId);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(
    new Set(MOCK_UNLOCKED_IDS),
  );

  const handleUnlock = useCallback((id: string) => {
    setUnlockedIds((prev) => new Set([...prev, id]));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🔒</Text>
        <Text style={styles.emptyTitle}>Vault Coming Soon</Text>
        <Text style={styles.emptySubtitle}>This venue hasn't opened its vault yet.</Text>
      </View>
    );
  }

  const midnightDrop = items.find((i) => i.isMidnightDrop);
  const regularItems = items.filter((i) => !i.isMidnightDrop);
  const unlockedCount = items.filter((i) => unlockedIds.has(i.id)).length;

  return (
    <View style={styles.scroll}>
      {/* Vault header */}
      <View style={styles.vaultHeader}>
        <View>
          <Text style={styles.vaultTitle}>THE VAULT</Text>
          <Text style={styles.vaultSubtitle}>{venueName}</Text>
        </View>
        <View style={styles.vaultProgress}>
          <Text style={styles.vaultProgressText}>{unlockedCount}/{items.length} UNLOCKED</Text>
          <View style={styles.vaultProgressTrack}>
            <View style={[styles.vaultProgressFill, { width: `${(unlockedCount / items.length) * 100}%` as `${number}%` }]} />
          </View>
        </View>
      </View>

      {/* Midnight Drop */}
      {midnightDrop && (
        <View style={styles.section}>
          <MidnightDropCard
            item={midnightDrop}
            unlocked={unlockedIds.has(midnightDrop.id)}
            onUnlock={handleUnlock}
          />
        </View>
      )}

      {/* Vault items grid */}
      {regularItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>VAULT ITEMS</Text>
          <View style={styles.grid}>
            {regularItems.map((item) => (
              <VaultCard
                key={item.id}
                item={item}
                unlocked={unlockedIds.has(item.id)}
                onUnlock={handleUnlock}
              />
            ))}
          </View>
        </View>
      )}

      {/* Night Tracker */}
      <View style={styles.section}>
        <NightTracker venueId={venueId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },

  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vaultTitle: { fontFamily: Fonts.display, fontSize: 28, color: Colors.textPrimary, letterSpacing: -0.5 },
  vaultSubtitle: { fontFamily: Fonts.bodyLight, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  vaultProgress: { alignItems: 'flex-end', gap: 6 },
  vaultProgressText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  vaultProgressTrack: { width: 80, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  vaultProgressFill: { height: '100%', backgroundColor: Colors.primaryContainer, borderRadius: 2 },

  section: { marginBottom: 24 },
  sectionHeading: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted, letterSpacing: 2, marginBottom: 12 },

  // Midnight Drop
  dropCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.2)',
    overflow: 'hidden',
  },
  dropHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  dropBadge: { backgroundColor: 'rgba(233,195,73,0.12)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(233,195,73,0.3)' },
  dropBadgeText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 2 },
  dropTimer: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  dropTimerText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  dropEmoji: { fontSize: 40, marginBottom: 10 },
  dropName: { fontFamily: Fonts.display, fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  dropRarity: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 2, marginBottom: 12 },
  dropHint: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textSecondary, marginBottom: 16, fontStyle: 'italic' },
  dropUnlockBtn: { borderRadius: 10, overflow: 'hidden' },
  dropUnlockGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'center' },
  dropUnlockText: { fontFamily: Fonts.label, fontSize: 11, color: '#fff', letterSpacing: 1.5 },
  dropUnlocked: { marginTop: 4 },
  dropCodeBox: {
    backgroundColor: 'rgba(233,195,73,0.08)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.3)',
    alignItems: 'center',
  },
  dropCodeLabel: { fontFamily: Fonts.label, fontSize: 9, color: Colors.secondary, letterSpacing: 2, marginBottom: 8 },
  dropCode: { fontFamily: Fonts.display, fontSize: 22, color: Colors.secondary, letterSpacing: 2 },
  dropRevealedDesc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  // Vault grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vaultCard: { width: CARD_W, borderRadius: 14, overflow: 'hidden' },
  vaultCardBorder: { borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 160, justifyContent: 'space-between' },
  lockPulseRing: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,92,0,0.3)' },
  rarityTag: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    marginBottom: 8,
  },
  rarityText: { fontFamily: Fonts.label, fontSize: 7, letterSpacing: 1 },
  vaultEmoji: { fontSize: 28, marginBottom: 6 },
  vaultName: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 6, lineHeight: 17 },
  hintText: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 8, lineHeight: 15 },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  unlockBtnText: { fontFamily: Fonts.label, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  revealedContent: { marginTop: 4 },
  codeBox: { borderWidth: 1, borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  codeText: { fontFamily: Fonts.display, fontSize: 13, letterSpacing: 1 },
  revealedDesc: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.textPrimary },
  emptySubtitle: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
