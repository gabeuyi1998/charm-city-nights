import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

export type SkeletonVariant = 'card' | 'story' | 'profile' | 'badge';

export interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  style?: ViewStyle;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHIMMER_COLOR = 'rgba(255,255,255,0.08)';
const BASE_COLOR = Colors.card;

function SkeletonBlock({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}): React.ReactElement {
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(SCREEN_WIDTH, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-SCREEN_WIDTH, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const blockWidth = typeof width === 'number' ? width : undefined;
  const blockWidthPercent = typeof width === 'string' ? width : undefined;

  return (
    <View
      style={[
        {
          width: blockWidth,
          height,
          borderRadius,
          backgroundColor: BASE_COLOR,
          overflow: 'hidden',
        },
        blockWidthPercent ? { width: blockWidthPercent } : {},
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          shimmerStyle,
          { backgroundColor: SHIMMER_COLOR },
        ]}
      />
    </View>
  );
}

function CardSkeleton(): React.ReactElement {
  return (
    <View style={skeletonStyles.card}>
      {/* Top row */}
      <View style={skeletonStyles.topRow}>
        <SkeletonBlock width={40} height={40} borderRadius={20} />
        <View style={skeletonStyles.topMeta}>
          <SkeletonBlock width={120} height={14} borderRadius={6} />
          <SkeletonBlock width={80} height={10} borderRadius={6} />
        </View>
      </View>
      {/* Media */}
      <SkeletonBlock width={'100%'} height={SCREEN_WIDTH} borderRadius={0} />
      {/* Footer */}
      <View style={skeletonStyles.footer}>
        <SkeletonBlock width={160} height={14} borderRadius={6} />
        <SkeletonBlock width={220} height={12} borderRadius={6} />
        <SkeletonBlock width={100} height={10} borderRadius={6} />
      </View>
    </View>
  );
}

function StorySkeleton(): React.ReactElement {
  return (
    <View style={skeletonStyles.storyWrapper}>
      <SkeletonBlock width={56} height={56} borderRadius={28} />
      <SkeletonBlock width={48} height={8} borderRadius={4} />
    </View>
  );
}

function ProfileSkeleton(): React.ReactElement {
  return (
    <View style={skeletonStyles.profileWrapper}>
      <SkeletonBlock width={80} height={80} borderRadius={40} />
      <SkeletonBlock width={140} height={16} borderRadius={6} />
      <SkeletonBlock width={100} height={12} borderRadius={6} />
      <SkeletonBlock width={200} height={12} borderRadius={6} />
      <View style={skeletonStyles.profileStats}>
        <SkeletonBlock width={60} height={40} borderRadius={8} />
        <SkeletonBlock width={60} height={40} borderRadius={8} />
        <SkeletonBlock width={60} height={40} borderRadius={8} />
      </View>
    </View>
  );
}

function BadgeSkeleton(): React.ReactElement {
  const tileSize = (SCREEN_WIDTH - 48) / 3;
  return (
    <SkeletonBlock width={tileSize} height={tileSize} borderRadius={12} />
  );
}

export function SkeletonLoader({ variant, style }: SkeletonLoaderProps): React.ReactElement {
  return (
    <View style={style}>
      {variant === 'card' && <CardSkeleton />}
      {variant === 'story' && <StorySkeleton />}
      {variant === 'profile' && <ProfileSkeleton />}
      {variant === 'badge' && <BadgeSkeleton />}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  topMeta: {
    flex: 1,
    gap: 6,
  },
  footer: {
    padding: 14,
    gap: 8,
  },
  storyWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  profileWrapper: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
});
