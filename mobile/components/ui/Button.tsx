import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Radius } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'ghost' | 'gold' | 'outline' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'full';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const SIZE_STYLES: Record<ButtonSize, { height: number; width?: string; paddingH: number; fontSize: number }> = {
  sm: { height: 36, paddingH: 16, fontSize: 11 },
  md: { height: 48, paddingH: 24, fontSize: 12 },
  lg: { height: 52, paddingH: 28, fontSize: 12 },
  full: { height: 56, width: '100%', paddingH: 24, fontSize: 12 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
}: ButtonProps): React.ReactElement {
  const scale = useSharedValue(1);
  const sizeStyle = SIZE_STYLES[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 150 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1.0, { duration: 150 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, loading, onPress]);

  const baseContainerStyle = [
    styles.base,
    {
      height: Math.max(sizeStyle.height, 44),
      paddingHorizontal: sizeStyle.paddingH,
      minWidth: 44,
    },
    sizeStyle.width ? { width: sizeStyle.width as `${number}%` } : {},
    disabled || loading ? styles.disabled : {},
  ];

  const labelEl = loading ? (
    <ActivityIndicator color="#FFFFFF" size="small" />
  ) : (
    <View style={styles.inner}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.label, { fontSize: sizeStyle.fontSize }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );

  // ─── Primary: orange gradient pill ───────────────────────────────────────────
  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, baseContainerStyle, styles.pillBase]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={[Colors.primaryContainer, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: Radius.full }]}
        />
        {loading ? (
          <ActivityIndicator color={Colors.onPrimaryContainer} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.label, styles.labelPrimary, { fontSize: sizeStyle.fontSize }]}>
              {label.toUpperCase()}
            </Text>
          </View>
        )}
      </AnimatedPressable>
    );
  }

  // ─── Ghost: transparent + ghost border ───────────────────────────────────────
  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, baseContainerStyle, styles.pillBase, styles.ghost]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {labelEl}
      </AnimatedPressable>
    );
  }

  // ─── Gold: VIP action ─────────────────────────────────────────────────────────
  if (variant === 'gold') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animatedStyle, baseContainerStyle, styles.goldBase]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
          <ActivityIndicator color={Colors.secondary} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.label, styles.labelGold, { fontSize: sizeStyle.fontSize }]}>
              {label.toUpperCase()}
            </Text>
          </View>
        )}
      </AnimatedPressable>
    );
  }

  // ─── Outline / Secondary / Danger fallback ───────────────────────────────────
  const fallbackBg =
    variant === 'danger' ? Colors.errorContainer :
    variant === 'secondary' ? Colors.secondaryContainer :
    'transparent';
  const fallbackBorder =
    variant === 'outline' ? Colors.primaryContainer :
    variant === 'danger' ? Colors.error :
    'transparent';
  const fallbackText =
    variant === 'outline' ? Colors.primaryContainer :
    variant === 'danger' ? Colors.error :
    variant === 'secondary' ? Colors.onSecondaryContainer :
    Colors.onSurface;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        baseContainerStyle,
        styles.pillBase,
        {
          backgroundColor: fallbackBg,
          borderWidth: 1.5,
          borderColor: fallbackBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={fallbackText} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, { fontSize: sizeStyle.fontSize, color: fallbackText }]}>
            {label.toUpperCase()}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillBase: {
    borderRadius: Radius.full,
  },
  ghost: {
    backgroundColor: 'rgba(53,53,52,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(91,65,55,0.2)',
  },
  goldBase: {
    borderRadius: Radius.xl,
    paddingVertical: 16,
    backgroundColor: 'rgba(175,141,17,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(233,195,73,0.2)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.manropeExtraBold,
    textAlign: 'center',
    letterSpacing: 2,
    color: Colors.onSurface,
  },
  labelPrimary: {
    color: Colors.onPrimaryContainer,
  },
  labelGold: {
    color: Colors.secondary,
    letterSpacing: 3,
  },
  disabled: {
    opacity: 0.4,
  },
});
