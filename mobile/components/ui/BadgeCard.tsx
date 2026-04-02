import React, { useCallback, useEffect, useRef } from 'react';
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
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, BadgeRarity as BadgeRarityColors, Fonts } from '../../constants/theme';

export type RarityLevel = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface BadgeCardProps {
  emoji: string;
  name: string;
  rarity: RarityLevel;
  barName: string;
  isCollected?: boolean;
  image?: ImageSourcePropType;
  onPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const TILE_SIZE = (SCREEN_WIDTH - 48) / 3;

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function ShimmerOverlay({ color }: { color: string }): React.ReactElement {
  const translateX = useSharedValue(-TILE_SIZE);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(TILE_SIZE * 2, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(-TILE_SIZE, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[styles.shimmer, animStyle]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.shimmerGlow,
          { backgroundColor: hexToRgba(color, 0.25) },
        ]}
      />
    </Animated.View>
  );
}

export function BadgeCard({
  emoji,
  name,
  rarity,
  barName,
  isCollected = false,
  image,
  onPress,
}: BadgeCardProps): React.ReactElement {
  const flipAnim = useSharedValue(0);
  const prevCollected = useRef(isCollected);

  const rarityColor = BadgeRarityColors[rarity];
  const bgColor = hexToRgba(rarityColor, 0.2);
  const showShimmer = rarity === 'EPIC' || rarity === 'LEGENDARY';

  useEffect(() => {
    if (!prevCollected.current && isCollected) {
      flipAnim.value = 0;
      flipAnim.value = withTiming(180, { duration: 600, easing: Easing.out(Easing.cubic) });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    prevCollected.current = isCollected;
  }, [isCollected, flipAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [0, 90], [0, 90]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: flipAnim.value < 90 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAnim.value, [90, 180], [-90, 0]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: flipAnim.value >= 90 ? 1 : 0,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const tileInner = (
    <>
      {showShimmer && <ShimmerOverlay color={rarityColor} />}
      {!image && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.badgeLabel, { color: rarityColor }]} numberOfLines={1}>
        {barName}
      </Text>
      <Text style={styles.badgeName} numberOfLines={1}>{name}</Text>
    </>
  );

  const collectedContent = image ? (
    <ImageBackground
      source={image}
      style={[styles.tile, { borderColor: rarityColor, borderWidth: 1 }]}
      imageStyle={styles.badgeImage}
      resizeMode="cover"
    >
      <View style={[styles.badgeImageOverlay, { backgroundColor: `${rarityColor}33` }]} />
      {showShimmer && <ShimmerOverlay color={rarityColor} />}
      <Text style={[styles.badgeLabel, { color: '#fff' }]} numberOfLines={1}>{barName}</Text>
      <Text style={[styles.badgeName, { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>{name}</Text>
    </ImageBackground>
  ) : (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: bgColor,
          borderColor: rarityColor,
          borderWidth: 1,
        },
      ]}
    >
      {tileInner}
    </View>
  );

  const lockedContent = (
    <View style={[styles.tile, styles.lockedTile]}>
      <Text style={styles.emoji}>❓</Text>
      <Text style={styles.lockedText}>Locked</Text>
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      style={styles.pressable}
      accessibilityRole="button"
      accessibilityLabel={isCollected ? `${name} badge` : 'Locked badge'}
    >
      <View style={{ position: 'relative', width: TILE_SIZE, height: TILE_SIZE }}>
        <Animated.View style={[{ width: TILE_SIZE, height: TILE_SIZE }, frontStyle]}>
          {isCollected ? collectedContent : lockedContent}
        </Animated.View>
        <Animated.View style={[backStyle]}>
          {collectedContent}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minWidth: 44,
    minHeight: 44,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
    gap: 4,
  },
  lockedTile: {
    backgroundColor: Colors.surface,
  },
  emoji: {
    fontSize: 32,
  },
  badgeImage: {
    borderRadius: 12,
  },
  badgeImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  badgeLabel: {
    fontFamily: Fonts.bodyLight,
    fontSize: 10,
    textAlign: 'center',
    maxWidth: '100%',
  },
  badgeName: {
    fontFamily: Fonts.bodyLight,
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: '100%',
  },
  lockedText: {
    fontFamily: Fonts.bodyLight,
    fontSize: 10,
    color: Colors.textMuted,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: TILE_SIZE / 2,
    zIndex: 1,
  },
  shimmerGlow: {
    width: '100%',
    height: '100%',
    transform: [{ skewX: '-15deg' }],
  },
});
