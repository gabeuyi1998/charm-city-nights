import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Layout } from '../../constants/theme';

export interface AppBarProps {
  title?: string;
  /** Left slot: icon name or custom element */
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  leftElement?: React.ReactNode;
  onLeftPress?: () => void;
  /** Right slot: icon name or custom element */
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  rightElement?: React.ReactNode;
  onRightPress?: () => void;
  /** Whether to inset for safe area. Default true. */
  safeArea?: boolean;
}

export function AppBar({
  title = 'KINETIC LOUNGE',
  leftIcon = 'search',
  leftElement,
  onLeftPress,
  rightIcon = 'notifications',
  rightElement,
  onRightPress,
  safeArea = true,
}: AppBarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const topPad = safeArea ? Math.max(insets.top, 16) : 0;

  const handleLeft = () => {
    Haptics.selectionAsync();
    onLeftPress?.();
  };

  const handleRight = () => {
    Haptics.selectionAsync();
    onRightPress?.();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPad, height: Layout.appBarHeight + topPad },
      ]}
    >
      {/* Left */}
      <Pressable
        onPress={handleLeft}
        style={styles.iconBtn}
        hitSlop={8}
        accessibilityLabel={leftIcon ?? 'left action'}
      >
        {leftElement ?? (
          leftIcon && (
            <Ionicons name={leftIcon} size={24} color={Colors.primaryContainer} />
          )
        )}
      </Pressable>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Right */}
      <Pressable
        onPress={handleRight}
        style={styles.iconBtn}
        hitSlop={8}
        accessibilityLabel={rightIcon ?? 'right action'}
      >
        {rightElement ?? (
          rightIcon && (
            <Ionicons name={rightIcon} size={24} color={Colors.primaryContainer} />
          )
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(19,19,19,0.60)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    // Blur effect via opacity — expo-blur not in deps
  },
  title: {
    fontFamily: Fonts.manropeExtraBold,
    fontSize: 18,
    letterSpacing: 3,
    color: Colors.primaryContainer,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
