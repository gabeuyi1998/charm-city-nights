import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, GlassStyle } from '../../constants/theme';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** 'sm' = 12px radius, 'lg' = 24px radius. Default 'sm'. */
  size?: 'sm' | 'lg';
  /** Use gold border instead of ghost border */
  gold?: boolean;
  padding?: number;
}

export function GlassCard({
  children,
  style,
  size = 'sm',
  gold = false,
  padding = 20,
}: GlassCardProps): React.ReactElement {
  return (
    <View
      style={[
        styles.base,
        {
          borderRadius: size === 'lg' ? Radius.xl : Radius.lg,
          padding,
          borderColor: gold
            ? 'rgba(233,195,73,0.2)'
            : GlassStyle.borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: GlassStyle.backgroundColor,
    borderWidth: GlassStyle.borderWidth,
  },
});
