import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Layout, Shadows } from '../../constants/theme';

export interface BadgeProps {
  /** Material Symbol / emoji icon text */
  icon: string;
  name: string;
  collected?: boolean;
  /** 'orange' (bars/events) or 'gold' (landmarks) */
  tint?: 'orange' | 'gold';
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Badge({
  icon,
  name,
  collected = false,
  tint = 'orange',
  onPress,
  style,
}: BadgeProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: collected ? 1 : 0.4,
  }));

  const handlePress = useCallback(() => {
    if (!collected) return;
    scale.value = withSequence(
      withTiming(1.1, { duration: 120 }),
      withTiming(1.0, { duration: 150 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [collected, onPress, scale]);

  const isGold = tint === 'gold';
  const borderColor = collected
    ? isGold ? 'rgba(233,195,73,0.3)' : 'rgba(255,92,0,0.3)'
    : 'rgba(255,255,255,0.05)';
  const glowShadow = collected
    ? isGold ? Shadows.goldGlow : Shadows.orangeGlow
    : {};

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.wrapper, style, animStyle]}
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled: !collected }}
    >
      <View
        style={[
          styles.circle,
          { borderColor },
          collected ? glowShadow : styles.grayscale,
        ]}
      >
        <Text
          style={[
            styles.icon,
            {
              color: collected
                ? isGold ? Colors.secondary : Colors.primaryContainer
                : Colors.onSurface,
              opacity: collected ? 1 : 0.4,
            },
          ]}
        >
          {icon}
        </Text>
      </View>
      <Text
        style={[styles.name, !collected && styles.nameMuted]}
        numberOfLines={2}
      >
        {name.toUpperCase()}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: Layout.badgeCircle,
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: Layout.badgeCircle,
    height: Layout.badgeCircle,
    borderRadius: Layout.badgeCircle / 2,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayscale: {
    // React Native doesn't have CSS filter: grayscale
    // We handle via opacity on the wrapper instead
  },
  icon: {
    fontSize: 28,
  },
  name: {
    fontFamily: Fonts.manropeExtraBold,
    fontSize: 9,
    color: Colors.onSurface,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 12,
  },
  nameMuted: {
    color: Colors.onSurface,
    opacity: 0.4,
  },
});
