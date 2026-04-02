import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, BadgeRarity } from '../../constants/theme';

export interface BarData {
  id: string;
  name: string;
  neighborhood: string;
  vibe: string;
  color: string;
  currentCrowd: number;
  checkInsTonight: number;
  activeSpecial?: string;
  emoji: string;
  badgeEmoji: string;
  badgeRarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  image?: ImageSourcePropType;
}

export interface BarCardProps {
  bar: BarData;
  onCheckIn?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isLive?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MEDIA_SIZE = Math.min(SCREEN_WIDTH, 375);

function darkenHex(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 60);
  const g = Math.max(0, ((num >> 8) & 0xff) - 60);
  const b = Math.max(0, (num & 0xff) - 60);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getCrowdColor(crowd: number): string {
  if (crowd < 50) return Colors.success;
  if (crowd < 75) return Colors.secondary;
  if (crowd < 90) return Colors.primary;
  return Colors.error;
}

function LivePulse(): React.ReactElement {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.liveBadge, animStyle]}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE DEAL</Text>
    </Animated.View>
  );
}

function FireFlyUp({ onDone }: { onDone: () => void }): React.ReactElement {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    translateY.value = withTiming(-180, { duration: 900, easing: Easing.out(Easing.cubic) });
    opacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, [opacity, translateY, onDone]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.fireEmoji, animStyle]} pointerEvents="none">
      <Text style={styles.fireEmojiText}>🔥</Text>
    </Animated.View>
  );
}

export function BarCard({
  bar,
  onCheckIn,
  onComment,
  onShare,
  onSave,
  isLive = false,
}: BarCardProps): React.ReactElement {
  const [showFire, setShowFire] = useState(false);
  const lastTap = useRef<number>(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowFire(true);
      onCheckIn?.();
    }
    lastTap.current = now;
  }, [onCheckIn]);

  const handleCheckIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCheckIn?.();
  }, [onCheckIn]);

  const handleComment = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComment?.();
  }, [onComment]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.();
  }, [onShare]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  }, [onSave]);

  const crowdColor = getCrowdColor(bar.currentCrowd);
  const darkerColor = darkenHex(bar.color);
  const rarityColor = BadgeRarity[bar.badgeRarity];

  return (
    <View style={styles.card}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={[styles.barEmojiCircle, { backgroundColor: bar.color + '33' }]}>
          <Text style={styles.barEmojiText}>{bar.emoji}</Text>
        </View>
        <View style={styles.topMeta}>
          <Text style={styles.barName} numberOfLines={1}>{bar.name}</Text>
          <View style={styles.neighborhoodPill}>
            <Text style={styles.neighborhoodText}>{bar.neighborhood}</Text>
          </View>
        </View>
        <Pressable
          style={styles.menuBtn}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          accessibilityLabel="More options"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* MEDIA */}
      <Pressable onPress={handleDoubleTap} style={styles.media}>
        {bar.image ? (
          <ImageBackground
            source={bar.image}
            style={styles.mediaGradient}
            imageStyle={styles.mediaImage}
            resizeMode="cover"
          >
            <View style={styles.mediaOverlay} />

            {/* Crowd overlay */}
            <View style={styles.crowdOverlay}>
              <View style={[styles.crowdDot, { backgroundColor: crowdColor }]} />
              <Text style={styles.crowdText}>{bar.currentCrowd}% packed</Text>
            </View>

            {/* Live badge */}
            {isLive && <LivePulse />}
          </ImageBackground>
        ) : (
          <View
            style={[
              styles.mediaGradient,
              { backgroundColor: bar.color },
            ]}
          >
            <View
              style={[
                styles.mediaOverlay,
                { backgroundColor: darkerColor + 'CC' },
              ]}
            />
            <View style={styles.mediaContent}>
              <Text style={styles.mediaEmoji}>{bar.emoji}</Text>
            </View>

            {/* Crowd overlay */}
            <View style={styles.crowdOverlay}>
              <View style={[styles.crowdDot, { backgroundColor: crowdColor }]} />
              <Text style={styles.crowdText}>{bar.currentCrowd}% packed</Text>
            </View>

            {/* Live badge */}
            {isLive && <LivePulse />}
          </View>
        )}

        {/* Fire animation */}
        {showFire && (
          <FireFlyUp onDone={() => setShowFire(false)} />
        )}
      </Pressable>

      {/* INTERACTION ROW */}
      <View style={styles.interactionRow}>
        <View style={styles.interactionLeft}>
          <Pressable
            style={styles.iconBtn}
            onPress={handleCheckIn}
            accessibilityLabel="Check in"
          >
            <Ionicons name="flame" size={26} color={Colors.primary} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={handleComment}
            accessibilityLabel="Comment"
          >
            <Ionicons name="chatbubble-outline" size={26} color={Colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={handleShare}
            accessibilityLabel="Share"
          >
            <Ionicons name="arrow-redo-outline" size={26} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={handleSave}
          accessibilityLabel="Save"
        >
          <Ionicons name="bookmark-outline" size={26} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* COUNTS & CAPTION */}
      <View style={styles.captionSection}>
        <Text style={styles.checkInCount}>
          🔥 {bar.checkInsTonight} check-ins tonight
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          <Text style={styles.captionBold}>{bar.name}</Text>
          {bar.activeSpecial ? ` ${bar.activeSpecial}` : ''}
        </Text>
        <View style={styles.badgeRow}>
          <Text style={[styles.rarityBadge, { color: rarityColor }]}>
            {bar.badgeEmoji} {bar.badgeRarity}
          </Text>
        </View>
        <Text style={styles.timestamp}>2 MINUTES AGO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  barEmojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barEmojiText: {
    fontSize: 20,
  },
  topMeta: {
    flex: 1,
    gap: 3,
  },
  barName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  neighborhoodPill: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  neighborhoodText: {
    fontFamily: Fonts.bodyLight,
    fontSize: 10,
    color: Colors.textPrimary,
  },
  menuBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaGradient: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    borderRadius: 0,
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  mediaContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaEmoji: {
    fontSize: 80,
  },
  crowdOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crowdDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  crowdText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  liveText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  fireEmoji: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 99,
  },
  fireEmojiText: {
    fontSize: 48,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  interactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 4,
  },
  checkInCount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  captionBold: {
    fontFamily: Fonts.bodySemiBold,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  rarityBadge: {
    fontFamily: Fonts.bodyLight,
    fontSize: 11,
  },
  timestamp: {
    fontFamily: Fonts.bodyLight,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
