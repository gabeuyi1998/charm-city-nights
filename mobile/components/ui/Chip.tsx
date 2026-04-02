import React, { useCallback } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Radius } from '../../constants/theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Chip({
  label,
  selected = false,
  onPress,
  style,
}: ChipProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 80 }, () => {
      scale.value = withTiming(1, { duration: 120 });
    });
    Haptics.selectionAsync();
    onPress?.();
  }, [onPress, scale]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.base,
        selected ? styles.selected : styles.unselected,
        animStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? Colors.onPrimaryContainer : Colors.onSurface },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: Colors.primaryContainer,
  },
  unselected: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'rgba(91,65,55,0.2)',
  },
  label: {
    fontFamily: Fonts.manropeBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
