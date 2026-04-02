import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts } from '../constants/theme';
import { MOCK_STORIES, Story } from '../constants/mockData';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_DURATION_MS = 5000;
const STORY_EMOJIS = ['🦀', '🍺', '🎵', '⚡', '🌆', '🔥'];

// ─── Completed / Future progress fills (non-animated) ─────────────────────────
function ProgressTrack({
  state,
}: {
  state: 'past' | 'future';
}): React.ReactElement {
  return (
    <View style={styles.progressTrack}>
      {state === 'past' && <View style={[styles.progressFill, { width: '100%' }]} />}
    </View>
  );
}

// ─── Active animated progress bar ─────────────────────────────────────────────
function ActiveProgressBar({
  progress,
}: {
  progress: ReturnType<typeof useSharedValue<number>>;
}): React.ReactElement {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StoryViewerScreen(): React.ReactElement {
  const router = useRouter();
  const stories: Story[] = MOCK_STORIES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progress = useSharedValue(0);

  // Ref so callbacks always see latest currentIndex without stale closure
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const currentStory = stories[currentIndex];

  // ─── Navigate forward ────────────────────────────────────────────────────
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) return prev + 1;
      return prev;
    });
  }, [stories.length]);

  // ─── Navigate back ───────────────────────────────────────────────────────
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // ─── Close ───────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // ─── Called from worklet when timer completes ─────────────────────────────
  const handleStoryFinished = useCallback(() => {
    if (currentIndexRef.current < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  }, [stories.length, router]);

  // ─── Reset progress whenever story changes ────────────────────────────────
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
  }, [currentIndex, progress]);

  // ─── Run progress animation ───────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) {
      cancelAnimation(progress);
      return;
    }

    // Start from current progress value so resume works smoothly
    const remaining = STORY_DURATION_MS * (1 - progress.value);

    progress.value = withTiming(
      1,
      {
        duration: remaining > 0 ? remaining : STORY_DURATION_MS,
        easing: Easing.linear,
      },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(handleStoryFinished)();
        }
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, currentIndex]);

  // ─── Gestures ─────────────────────────────────────────────────────────────
  const tapGesture = Gesture.Tap()
    .maxDuration(200)
    .onEnd((event) => {
      'worklet';
      if (event.x < SCREEN_WIDTH / 2) {
        runOnJS(goToPrev)();
      } else {
        runOnJS(goToNext)();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart(() => {
      'worklet';
      runOnJS(setIsPaused)(true);
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(setIsPaused)(false);
    });

  const panGesture = Gesture.Pan().onEnd((event) => {
    'worklet';
    if (event.translationY > 50) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      runOnJS(router.back)();
    }
  });

  const combinedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(longPressGesture, tapGesture),
    panGesture,
  );

  const storyEmoji = STORY_EMOJIS[currentIndex % STORY_EMOJIS.length];

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar hidden />

      <View style={styles.container}>
        {/* PROGRESS BARS */}
        <View style={styles.progressBars}>
          {stories.map((_, i) => {
            if (i < currentIndex) {
              return <ProgressTrack key={i} state="past" />;
            }
            if (i === currentIndex) {
              return <ActiveProgressBar key={i} progress={progress} />;
            }
            return <ProgressTrack key={i} state="future" />;
          })}
        </View>

        {/* TOP INFO ROW */}
        <View style={styles.topInfo}>
          <Avatar size="sm" name={currentStory?.username} />
          <Text style={styles.username} numberOfLines={1}>
            {currentStory?.username}
          </Text>
          <Text style={styles.timestamp}>{currentStory?.timestamp ?? '2h ago'}</Text>
          <View style={styles.flex1} />
          <Pressable
            style={styles.closeBtn}
            onPress={handleClose}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {/* CONTENT AREA — gesture target */}
        <GestureDetector gesture={combinedGesture}>
          <View style={styles.contentArea}>
            <Text style={styles.contentEmoji}>{storyEmoji}</Text>
            {currentStory?.isBar && currentStory.barName ? (
              <Text style={styles.barName}>{currentStory.barName}</Text>
            ) : null}
            <Text style={styles.swipeHint}>Swipe to navigate</Text>
          </View>
        </GestureDetector>

        {/* BOTTOM BAR */}
        <View style={styles.bottomBar}>
          {currentStory?.isBar ? (
            <Button
              label="CHECK IN HERE 🔥"
              variant="primary"
              size="full"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            />
          ) : (
            <View style={styles.messageRow}>
              <TextInput
                style={styles.messageInput}
                placeholder="Send message..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex1: {
    flex: 1,
  },

  // Progress bars
  progressBars: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    gap: 3,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },

  // Top info row
  topInfo: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  username: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 8,
    maxWidth: 120,
  },
  timestamp: {
    fontFamily: Fonts.bodyLight,
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content area
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  barName: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  swipeHint: {
    fontFamily: Fonts.bodyLight,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 44,
  },
});
