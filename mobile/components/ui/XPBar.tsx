import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, Radius } from '../../constants/theme';

export interface XPBarProps {
  current: number;
  max: number;
  rank?: string;
  level?: number;
  style?: ViewStyle;
  /** Animate fill on mount. Default true. */
  animate?: boolean;
}

export function XPBar({
  current,
  max,
  rank,
  level,
  style,
  animate = true,
}: XPBarProps): React.ReactElement {
  const progress = useSharedValue(0);
  const target = Math.min(Math.max(current / max, 0), 1);

  useEffect(() => {
    if (animate) {
      progress.value = withTiming(target, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = target;
    }
  }, [animate, progress, target]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Header row */}
      {(rank !== undefined || level !== undefined) && (
        <View style={styles.header}>
          <View>
            {rank && (
              <Text style={styles.rank}>{`Rank: ${rank}`.toUpperCase()}</Text>
            )}
            {level !== undefined && (
              <Text style={styles.level}>{`LEVEL ${level}`}</Text>
            )}
          </View>
          <Text style={styles.xpLabel}>
            {current.toLocaleString()} / {max.toLocaleString()} XP
          </Text>
        </View>
      )}

      {/* Track */}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rank: {
    fontFamily: Fonts.manropeBold,
    fontSize: 12,
    color: Colors.secondary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  level: {
    fontFamily: Fonts.manropeExtraBold,
    fontSize: 48,
    color: Colors.onSurface,
    letterSpacing: -2,
    lineHeight: 52,
    fontStyle: 'italic',
  },
  xpLabel: {
    fontFamily: Fonts.manropeBold,
    fontSize: 13,
    color: `${Colors.onSurface}66`,
    textAlign: 'right',
    paddingBottom: 4,
  },
  track: {
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryContainer,
    // Glow via shadow
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
});
