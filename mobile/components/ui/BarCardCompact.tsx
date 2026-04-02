import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/theme';
import { BarData } from './BarCard';
import { CrowdMeter } from './CrowdMeter';

export interface BarCardCompactProps {
  bar: BarData;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BarCardCompact({ bar, onPress }: BarCardCompactProps): React.ReactElement {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animStyle]}
      accessibilityRole="button"
      accessibilityLabel={bar.name}
    >
      {/* Left emoji square */}
      <View style={[styles.emojiSquare, { backgroundColor: bar.color + '33' }]}>
        <Text style={styles.emoji}>{bar.emoji}</Text>
      </View>

      {/* Middle meta */}
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{bar.name}</Text>
        <Text style={styles.neighborhood} numberOfLines={1}>
          {bar.neighborhood} · {bar.vibe}
        </Text>
      </View>

      {/* Right crowd */}
      <View style={styles.right}>
        <CrowdMeter crowd={bar.currentCrowd} size={40} showLabel />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 12,
  },
  emojiSquare: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: {
    fontSize: 26,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  neighborhood: {
    fontFamily: Fonts.bodyLight,
    fontSize: 12,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
