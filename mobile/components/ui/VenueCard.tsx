import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated as RNAnimated } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Layout, Radius } from '../../constants/theme';

export interface VenueCardProps {
  imageUri?: string;
  neighborhood: string;
  title: string;
  isLive?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VenueCard({
  imageUri,
  neighborhood,
  title,
  isLive = false,
  onPress,
}: VenueCardProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 200 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress, scale]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.card, animStyle]}
      accessibilityRole="button"
      accessibilityLabel={`${neighborhood} — ${title}`}
    >
      {/* Background image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.imagePlaceholder]} />
      )}

      {/* Bottom fade gradient overlay */}
      <View style={styles.fadeOverlay} />

      {/* LIVE badge */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Bottom content */}
      <View style={styles.bottom}>
        <Text style={styles.neighborhood} numberOfLines={1}>
          {neighborhood.toUpperCase()}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: Layout.storyCardWidth,
    height: Layout.storyCardHeight,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91,65,55,0.1)',
  },
  imagePlaceholder: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    // Linear gradient from surfaceContainerLowest to transparent
    // Using a layered View approach since LinearGradient needs import
    backgroundColor: Colors.surfaceContainerLowest,
    opacity: 0.85,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,92,0,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryContainer,
  },
  liveText: {
    fontFamily: Fonts.manropeExtraBold,
    fontSize: 8,
    color: Colors.primaryContainer,
    letterSpacing: 1.5,
  },
  bottom: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  neighborhood: {
    fontFamily: Fonts.manropeBold,
    fontSize: 10,
    color: Colors.secondary,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.manropeBold,
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 16,
  },
});
