import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Fonts } from '../../constants/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string;
  size?: AvatarSize;
  hasStory?: boolean;
  isViewed?: boolean;
  isBar?: boolean;
  name?: string;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 86,
};

const RING_COLORS = ['#FF6B35', '#FFD700', '#FF3366'];

const AVATAR_BG_COLORS = [
  '#FF6B35', '#FFD700', '#FF3366', '#7B2FBE', '#00C9A7', '#3B82F6',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}

export function Avatar({
  uri,
  size = 'md',
  hasStory = false,
  isViewed = false,
  isBar = false,
  name,
}: AvatarProps): React.ReactElement {
  const diameter = SIZE_MAP[size];
  const ringWidth = 2;
  const ringGap = 2;
  const outerSize = diameter + (ringWidth + ringGap) * 2;
  const borderRadius = isBar ? 12 : outerSize / 2;
  const innerRadius = isBar ? 10 : diameter / 2;

  const firstLetter = name ? name.charAt(0).toUpperCase() : '?';
  const bgColor = name ? getColorForName(name) : Colors.primary;
  const fontSize = diameter * 0.4;

  const ringBorderColor = hasStory
    ? isViewed
      ? 'rgba(255,255,255,0.2)'
      : RING_COLORS[0]
    : 'transparent';

  const ringStyle = hasStory
    ? {
        width: outerSize,
        height: outerSize,
        borderRadius,
        borderWidth: ringWidth,
        borderColor: ringBorderColor,
        padding: ringGap,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      }
    : {
        width: diameter,
        height: diameter,
        borderRadius: innerRadius,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      };

  const imageStyle = {
    width: diameter,
    height: diameter,
    borderRadius: innerRadius,
  };

  const placeholderStyle = {
    width: diameter,
    height: diameter,
    borderRadius: innerRadius,
    backgroundColor: bgColor,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  const content = uri ? (
    <Image
      source={{ uri }}
      style={imageStyle}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View style={placeholderStyle}>
      <Text style={[styles.letter, { fontSize }]}>{firstLetter}</Text>
    </View>
  );

  if (!hasStory) {
    return (
      <View style={ringStyle}>
        {content}
      </View>
    );
  }

  if (hasStory && !isViewed) {
    // Gradient ring approximated with nested views using primary color border
    return (
      <View
        style={{
          width: outerSize,
          height: outerSize,
          borderRadius,
          padding: ringWidth + ringGap,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: ringWidth,
          borderColor: Colors.primary,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius,
        padding: ringWidth + ringGap,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ringWidth,
        borderColor: 'rgba(255,255,255,0.2)',
      }}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodySemiBold,
    textAlign: 'center',
  },
});
