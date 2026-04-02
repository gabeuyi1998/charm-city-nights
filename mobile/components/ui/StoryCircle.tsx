import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Layout, Radius } from '../../constants/theme';

export interface StoryCircleProps {
  uri?: string;
  username: string;
  isViewed?: boolean;
  isBar?: boolean;
  onPress?: () => void;
  isAddButton?: boolean;
}

const SIZE = Layout.storyCircle;           // 64px
const RING_W = 2;
const GAP = 2;
const OUTER = SIZE + (RING_W + GAP) * 2;  // 72px

// Gradient ring via spinning border approach
function ActiveRing(): React.ReactElement {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animStyle]}>
      <View style={styles.activeRing} />
    </Animated.View>
  );
}

export function StoryCircle({
  uri,
  username,
  isViewed = false,
  isBar = false,
  onPress,
  isAddButton = false,
}: StoryCircleProps): React.ReactElement {
  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress?.();
  }, [onPress]);

  const displayName = username.length > 8 ? username.slice(0, 8) : username;
  const innerRadius = isBar ? Radius.md : SIZE / 2;

  if (isAddButton) {
    return (
      <Pressable
        onPress={handlePress}
        style={styles.wrapper}
        accessibilityRole="button"
        accessibilityLabel="Add to your story"
      >
        <View style={styles.ringContainer}>
          <View style={[styles.viewedRing, { borderRadius: OUTER / 2 }]} />
          {uri ? (
            <Image
              source={{ uri }}
              style={[styles.image, { borderRadius: SIZE / 2 }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.placeholder, { borderRadius: SIZE / 2 }]} />
          )}
          <View style={styles.addBadge}>
            <Ionicons name="add" size={12} color={Colors.onSurface} />
          </View>
        </View>
        <Text style={styles.username}>Your Story</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={styles.wrapper}
      accessibilityRole="button"
      accessibilityLabel={username}
    >
      <View style={styles.ringContainer}>
        {/* Ring */}
        {!isViewed ? (
          <ActiveRing />
        ) : (
          <View style={[styles.viewedRing, { borderRadius: OUTER / 2 }]} />
        )}

        {/* Avatar */}
        {uri ? (
          <Image
            source={{ uri }}
            style={[styles.image, { borderRadius: innerRadius }]}
            contentFit="cover"
          />
        ) : isBar ? (
          <View style={[styles.barSquare, { backgroundColor: `${Colors.primaryContainer}33` }]}>
            <Text style={styles.barEmoji}>{username.charAt(0)}</Text>
          </View>
        ) : (
          <View style={[styles.placeholder, { borderRadius: innerRadius }]}>
            <Text style={styles.placeholderLetter}>{username.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>{displayName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
    minWidth: 44,
    minHeight: 44,
  },
  ringContainer: {
    width: OUTER,
    height: OUTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRing: {
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    borderWidth: RING_W,
    // Pseudo-gradient via split border colors
    borderTopColor: Colors.primaryContainer,
    borderRightColor: Colors.secondary,
    borderBottomColor: Colors.primary,
    borderLeftColor: Colors.primaryContainer,
  },
  viewedRing: {
    position: 'absolute',
    width: OUTER,
    height: OUTER,
    borderWidth: RING_W,
    borderColor: 'rgba(91,65,55,0.3)',
  },
  image: {
    width: SIZE,
    height: SIZE,
  },
  placeholder: {
    width: SIZE,
    height: SIZE,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLetter: {
    fontFamily: Fonts.manropeBold,
    fontSize: 22,
    color: Colors.onSurface,
  },
  barSquare: {
    width: SIZE,
    height: SIZE,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barEmoji: {
    fontSize: 24,
  },
  username: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 10,
    color: `${Colors.onSurface}66`,
    textAlign: 'center',
    maxWidth: 72,
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
});
