import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../../constants/theme';

const OUTER = 112;          // outer ring SVG canvas
const RADIUS = 50;          // SVG circle radius
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const BTN = 80;             // white-border button
const INNER = 64;           // orange fill circle

export interface CameraButtonProps {
  onTap?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  /** 0–1, controls the SVG stroke progress ring */
  progress?: number;
  isRecording?: boolean;
  style?: ViewStyle;
}

export function CameraButton({
  onTap,
  onHoldStart,
  onHoldEnd,
  progress = 0,
  isRecording = false,
  style,
}: CameraButtonProps): React.ReactElement {
  const pressStart = useRef<number>(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    pressStart.current = Date.now();
    holdTimer.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      onHoldStart?.();
    }, 200);
  }, [onHoldStart, scale]);

  const handlePressOut = useCallback(() => {
    const elapsed = Date.now() - pressStart.current;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    cancelAnimation(scale);
    scale.value = withTiming(1, { duration: 150 });

    if (elapsed < 200) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onTap?.();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onHoldEnd?.();
    }
  }, [onTap, onHoldEnd, scale]);

  // SVG progress ring — strokeDashoffset drives fill amount
  const strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(progress, 1));

  return (
    <View style={[styles.wrapper, style]}>
      {/* SVG progress ring */}
      <Svg
        width={OUTER}
        height={OUTER}
        style={StyleSheet.absoluteFillObject}
        viewBox={`0 0 ${OUTER} ${OUTER}`}
      >
        {/* Track */}
        <Circle
          cx={OUTER / 2}
          cy={OUTER / 2}
          r={RADIUS}
          stroke="rgba(255,92,0,0.2)"
          strokeWidth={4}
          fill="none"
        />
        {/* Fill */}
        <Circle
          cx={OUTER / 2}
          cy={OUTER / 2}
          r={RADIUS}
          stroke={Colors.primaryContainer}
          strokeWidth={4}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${OUTER / 2} ${OUTER / 2})`}
        />
      </Svg>

      {/* Capture button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.button}
        accessibilityLabel="Capture photo or hold to record"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.inner,
            {
              backgroundColor: isRecording
                ? Colors.primaryContainer
                : Colors.primaryContainer,
            },
            animStyle,
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: OUTER,
    height: OUTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  inner: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    borderWidth: 2,
    borderColor: 'rgba(82,24,0,0.2)',
  },
});
