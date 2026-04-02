import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/theme';
import { NIGHT_MOMENTS, VIBE_STAGES, type VibeStage } from '../../types/vault';

function getCurrentVibe(progress: number): typeof VIBE_STAGES[number] {
  const stages = [...VIBE_STAGES].reverse();
  return stages.find((s) => progress >= s.threshold) ?? VIBE_STAGES[0];
}

interface NightTrackerProps {
  venueId: string;
}

export function NightTracker({ venueId }: NightTrackerProps): React.ReactElement {
  const [progress, setProgress] = useState(15);
  const [addedMoments, setAddedMoments] = useState<Set<string>>(new Set());
  const [flashId, setFlashId] = useState<string | null>(null);

  const momentScale = useSharedValue(1);

  const currentVibe = getCurrentVibe(progress);
  const progressWidth = `${progress}%` as `${number}%`;

  const handleMoment = useCallback((momentId: string, xp: number) => {
    if (addedMoments.has(momentId)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAddedMoments((prev) => new Set([...prev, momentId]));
    setFlashId(momentId);
    setTimeout(() => setFlashId(null), 600);
    setProgress((prev) => Math.min(100, prev + xp));
    momentScale.value = withSequence(
      withTiming(1.1, { duration: 120, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 200 }),
    );
  }, [addedMoments, momentScale]);

  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: momentScale.value }] }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NIGHT MODE</Text>
        <View style={styles.vibeChip}>
          <Text style={styles.vibeEmoji}>{currentVibe.emoji}</Text>
          <Text style={styles.vibeLabel}>{currentVibe.label.toUpperCase()}</Text>
        </View>
      </View>

      {/* Glow progress bar */}
      <Animated.View style={[styles.barWrap, glowStyle]}>
        <View style={styles.barTrack}>
          <LinearGradient
            colors={['#FF5C00', '#E9C349', '#FF5C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: progressWidth }]}
          />
        </View>
        {/* Stage markers */}
        <View style={styles.stageMarkers}>
          {VIBE_STAGES.slice(1).map((s) => (
            <View
              key={s.key}
              style={[
                styles.stageTick,
                { left: `${s.threshold}%` as `${number}%` },
                progress >= s.threshold && styles.stageTickActive,
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Stage labels */}
      <View style={styles.stageRow}>
        {VIBE_STAGES.map((s) => (
          <Text
            key={s.key}
            style={[styles.stageName, progress >= s.threshold && styles.stageNameActive]}
            numberOfLines={1}
          >
            {s.emoji}
          </Text>
        ))}
      </View>

      {/* Moment buttons */}
      <Text style={styles.momentHeading}>LOG A MOMENT</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.momentsScroll}
      >
        {NIGHT_MOMENTS.map((m) => {
          const added = addedMoments.has(m.id);
          const isFlashing = flashId === m.id;
          return (
            <Pressable
              key={m.id}
              style={[styles.momentPill, added && styles.momentPillDone]}
              onPress={() => handleMoment(m.id, m.xp)}
              disabled={added}
            >
              {isFlashing && (
                <LinearGradient
                  colors={['rgba(255,92,0,0.4)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text style={styles.momentEmoji}>{m.emoji}</Text>
              <Text style={[styles.momentLabel, added && styles.momentLabelDone]}>
                {m.label}
              </Text>
              {added && <Text style={styles.momentCheck}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.disclaimer}>
        Night mode resets each evening · Track your vibe, not your count
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 0,
    backgroundColor: 'rgba(255,92,0,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.12)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontFamily: Fonts.label,
    fontSize: 10,
    color: Colors.primaryContainer,
    letterSpacing: 3,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,92,0,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
  },
  vibeEmoji: { fontSize: 11 },
  vibeLabel: {
    fontFamily: Fonts.label,
    fontSize: 9,
    color: Colors.primaryContainer,
    letterSpacing: 1,
  },

  barWrap: { marginBottom: 4 },
  barTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  stageMarkers: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  stageTick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stageTickActive: { backgroundColor: 'rgba(255,92,0,0.6)' },

  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  stageName: { fontFamily: Fonts.bodyLight, fontSize: 11, color: 'rgba(255,255,255,0.2)' },
  stageNameActive: { color: Colors.textPrimary },

  momentHeading: {
    fontFamily: Fonts.label,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  momentsScroll: { gap: 8, paddingBottom: 4 },
  momentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  momentPillDone: {
    backgroundColor: 'rgba(255,92,0,0.1)',
    borderColor: 'rgba(255,92,0,0.3)',
  },
  momentEmoji: { fontSize: 14 },
  momentLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary },
  momentLabelDone: { color: Colors.textMuted },
  momentCheck: { fontSize: 10, color: Colors.primaryContainer, marginLeft: 2 },

  disclaimer: {
    fontFamily: Fonts.bodyLight,
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
});
