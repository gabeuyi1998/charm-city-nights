import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts } from '../../constants/theme';

export interface CrowdMeterProps {
  crowd: number;
  size?: number;
  showLabel?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getCrowdColor(crowd: number): string {
  if (crowd < 50) return Colors.success;
  if (crowd < 75) return Colors.secondary;
  if (crowd < 90) return Colors.primary;
  return Colors.error;
}

export function CrowdMeter({
  crowd,
  size = 48,
  showLabel = false,
}: CrowdMeterProps): React.ReactElement {
  const strokeWidth = size / 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(Math.max(crowd, 0), 100) / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [crowd, progress]);

  const color = getCrowdColor(crowd);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const fontSize = size / 4;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {showLabel && (
        <Text
          style={[
            styles.label,
            { fontSize, color, lineHeight: fontSize * 1.2 },
          ]}
        >
          {crowd}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.bodyBold,
    textAlign: 'center',
  },
});
