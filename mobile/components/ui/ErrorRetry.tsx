import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../constants/theme';
import { Button } from './Button';

interface ErrorRetryProps {
  message: string;
  onRetry: () => void;
  style?: ViewStyle;
}

export function ErrorRetry({ message, onRetry, style }: ErrorRetryProps): React.ReactElement {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle-outline" size={40} color={Colors.primaryContainer} />
      <Text style={styles.message}>{message}</Text>
      <Button label="Try Again" variant="outline" size="sm" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
