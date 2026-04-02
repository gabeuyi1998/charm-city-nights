import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Switch,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { CCN_BARS } from '../constants/mockData';
import { Colors, Fonts } from '../constants/theme';
import type { BarData } from '../components/ui/BarCard';

type CaptureStage = 'camera' | 'preview' | 'post';
type FlashCycle = FlashMode;

const FLASH_CYCLE: FlashCycle[] = ['off', 'on', 'auto'];
const FLASH_ICONS: Record<string, keyof typeof Ionicons['glyphMap']> = {
  off: 'flash-off',
  on: 'flash',
  auto: 'flash-outline',
};

const FILTERS = ['NOIR', 'NATTY BOH', 'INNER HARBOR', 'NEON GRIT'];
const FILTER_TINTS = [
  'transparent',
  'rgba(255,92,0,0.18)',
  'rgba(0,140,200,0.18)',
  'rgba(160,0,255,0.2)',
];

const REACTION_EMOJIS = ['🔥', '😍', '🙌', '💀'];
const AUDIENCE_OPTIONS = ['Everyone', 'Friends', 'Bar Members'] as const;
type AudienceOption = typeof AUDIENCE_OPTIONS[number];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POST_BARS = CCN_BARS.slice(0, 8);

interface Sticker {
  emoji: string;
  x: number;
  y: number;
}

export default function CameraScreen(): React.ReactElement {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission !== null && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [cameraReady, setCameraReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [captureStage, setCaptureStage] = useState<CaptureStage>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [selectedBar, setSelectedBar] = useState<BarData | null>(null);
  const [activeFilter, setActiveFilter] = useState(0);
  const [addToStory, setAddToStory] = useState(true);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<AudienceOption>('Everyone');
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const recordingProgress = useSharedValue(0);
  const pressStartTime = useRef<number>(0);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useSharedValue(0);
  const router = useRouter();

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  const startPulse = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 600 }), withTiming(1.0, { duration: 600 })),
      -1,
      false,
    );
  }, [pulseScale, pulseOpacity]);

  const stopPulse = useCallback(() => {
    cancelAnimation(pulseScale);
    cancelAnimation(pulseOpacity);
    pulseScale.value = withTiming(1.0, { duration: 150 });
    pulseOpacity.value = withTiming(1.0, { duration: 150 });
  }, [pulseScale, pulseOpacity]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${recordingProgress.value * 100}%` as `${number}%`,
  }));

  const recordingInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
  }));

  const cycleFlash = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((prev) => {
      const idx = FLASH_CYCLE.indexOf(prev);
      return FLASH_CYCLE[(idx + 1) % FLASH_CYCLE.length];
    });
  }, []);

  const toggleFacing = useCallback(() => {
    Haptics.selectionAsync();
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handlePressIn = useCallback(() => {
    pressStartTime.current = Date.now();
    pressTimerRef.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      startPulse();
      recordingProgress.value = 0;
      recordingProgress.value = withTiming(1, { duration: 30000, easing: Easing.linear });
    }, 200);
  }, [startPulse, recordingProgress]);

  const handlePressOut = useCallback(async () => {
    const elapsed = Date.now() - pressStartTime.current;
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
    if (elapsed < 200) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
        setCapturedUri(photo?.uri ?? null);
      } catch {
        setCapturedUri(null);
      }
      setCaptureStage('preview');
    } else if (isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(false);
      stopPulse();
      cancelAnimation(recordingProgress);
      recordingProgress.value = withTiming(0, { duration: 300 });
      setCaptureStage('preview');
    }
  }, [isRecording, stopPulse, recordingProgress]);

  const handleDiscard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCaptureStage('camera');
    setCapturedUri(null);
    setStickers([]);
    setIsRecording(false);
    stopPulse();
    cancelAnimation(recordingProgress);
    recordingProgress.value = 0;
  }, [stopPulse, recordingProgress]);

  const handleAddSticker = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const x = 40 + Math.random() * (SCREEN_WIDTH - 120);
    const y = 80 + Math.random() * (SCREEN_HEIGHT * 0.5);
    setStickers((prev) => [...prev, { emoji, x, y }]);
  }, []);

  const navigateHome = useCallback(() => {
    router.push('/(tabs)/');
  }, [router]);

  const handlePost = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toastOpacity.value = 1;
    toastOpacity.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(navigateHome)();
    });
  }, [toastOpacity, navigateHome]);

  // ── Permission screen ──
  if (!permission?.granted) {
    const isLoading = permission === null || permission.status === 'undetermined';
    return (
      <View style={styles.permissionContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primaryContainer} size="large" />
        ) : permission?.canAskAgain ? (
          <View style={styles.permissionDenied}>
            <Text style={styles.permissionEmoji}>📸</Text>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Button label="Enable Camera" variant="primary" size="md" onPress={() => requestPermission()} />
          </View>
        ) : (
          <View style={styles.permissionDenied}>
            <Text style={styles.permissionEmoji}>🚫</Text>
            <Text style={styles.permissionTitle}>Camera access denied</Text>
            <Text style={styles.permissionSub}>Enable camera in Settings → Charm City Nights</Text>
          </View>
        )}
      </View>
    );
  }

  // ── Post stage ──
  if (captureStage === 'post') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.postContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.postHeader}>
            <Text style={styles.postTitle}>NEW POST</Text>
            <Pressable
              style={styles.postCloseBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCaptureStage('camera'); }}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.postCaptionRow}>
            <View style={styles.postPreviewThumb}>
              {capturedUri
                ? <Image source={{ uri: capturedUri }} style={styles.postPreviewImage} resizeMode="cover" />
                : <Ionicons name="image-outline" size={32} color={Colors.textMuted} />}
            </View>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={caption}
              onChangeText={setCaption}
            />
          </View>

          <View style={styles.divider} />

          {/* Audience selector */}
          <Text style={styles.sectionLabel}>WHO CAN SEE</Text>
          <View style={styles.audienceRow}>
            {AUDIENCE_OPTIONS.map((opt) => {
              const active = audience === opt;
              return (
                <Pressable
                  key={opt}
                  style={[styles.audiencePill, active && styles.audiencePillActive]}
                  onPress={() => { Haptics.selectionAsync(); setAudience(opt); }}
                >
                  {active && (
                    <LinearGradient
                      colors={['rgba(255,92,0,0.2)', 'rgba(255,92,0,0.08)']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.audiencePillText, active && styles.audiencePillTextActive]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>TAG A BAR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barChipsContent}>
            {POST_BARS.map((bar) => {
              const isSelected = selectedBar?.id === bar.id;
              return (
                <Pressable
                  key={bar.id}
                  style={[styles.barChip, isSelected && styles.barChipSelected]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedBar(isSelected ? null : bar); }}
                >
                  <Text style={[styles.barChipText, isSelected && styles.barChipTextSelected]}>
                    {bar.emoji} {bar.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Add to Your Story</Text>
            <Switch value={addToStory} onValueChange={setAddToStory} thumbColor={Colors.primaryContainer} trackColor={{ true: 'rgba(255,92,0,0.4)', false: Colors.surfaceContainerHighest }} />
          </View>
          <View style={[styles.toggleRow, styles.toggleRowLast]}>
            <Text style={styles.toggleLabel}>Share to Feed</Text>
            <Switch value={shareToFeed} onValueChange={setShareToFeed} thumbColor={Colors.primaryContainer} trackColor={{ true: 'rgba(255,92,0,0.4)', false: Colors.surfaceContainerHighest }} />
          </View>

          <View style={styles.postButtonContainer}>
            <Button label="POST 🦀" variant="primary" size="full" onPress={handlePost} />
          </View>
        </ScrollView>

        {/* Success toast overlay */}
        <Animated.View style={[styles.toastOverlay, toastStyle]} pointerEvents="none">
          <Text style={styles.toastText}>Story Posted 🔥</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  }

  // ── Preview stage ──
  if (captureStage === 'preview') {
    return (
      <View style={styles.previewContainer}>
        {/* Photo fill */}
        {capturedUri
          ? <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />}

        {/* Filter tint on preview */}
        {activeFilter > 0 && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: FILTER_TINTS[activeFilter] }]} pointerEvents="none" />
        )}

        {/* Placed stickers */}
        {stickers.map((s, i) => (
          <Text key={i} style={[styles.stickerOnImage, { left: s.x, top: s.y }]}>{s.emoji}</Text>
        ))}

        {/* Reaction strip */}
        <View style={styles.reactionStrip}>
          {REACTION_EMOJIS.map((e) => (
            <Pressable key={e} style={styles.reactionBtn} onPress={() => handleAddSticker(e)}>
              <Text style={styles.reactionEmoji}>{e}</Text>
            </Pressable>
          ))}
        </View>

        {/* Edit tools column */}
        <View style={styles.previewToolColumn}>
          {(['text-outline', 'pencil-outline', 'happy-outline', 'location-outline'] as const).map((icon) => (
            <Pressable key={icon} style={styles.previewTool} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name={icon} size={20} color={Colors.textPrimary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.previewBottom}>
          <Pressable onPress={handleDiscard} hitSlop={8} style={styles.discardPressable}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
          <Button label="Next →" variant="primary" size="md" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCaptureStage('post'); }} />
        </View>
      </View>
    );
  }

  // ── Camera stage ──
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        onCameraReady={() => setCameraReady(true)}
        onMountError={(e) => setMountError(e.message ?? 'Camera failed to start')}
      />

      {/* Camera initializing indicator */}
      {!cameraReady && !mountError && (
        <View style={styles.cameraInitOverlay} pointerEvents="none">
          <ActivityIndicator color={Colors.primaryContainer} size="large" />
          <Text style={styles.cameraInitText}>Starting camera...</Text>
        </View>
      )}

      {/* Mount error overlay */}
      {mountError && (
        <View style={styles.cameraErrorOverlay}>
          <Text style={styles.cameraErrorEmoji}>📷</Text>
          <Text style={styles.cameraErrorTitle}>Camera unavailable</Text>
          <Text style={styles.cameraErrorSub}>{mountError}</Text>
        </View>
      )}

      {/* Filter tint overlay */}
      {activeFilter > 0 && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: FILTER_TINTS[activeFilter] }]} pointerEvents="none" />
      )}

      {/* Dark vignette */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Recording progress */}
      {isRecording && <Animated.View style={[styles.progressBar, progressBarStyle]} />}

      {/* Mission card */}
      <View style={styles.missionCard}>
        <Text style={styles.missionLabel}>TONIGHT'S MISSION</Text>
        <Text style={styles.missionText}>Capture 3 bars in Fells Point</Text>
        <View style={styles.missionProgress}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.missionDot, i === 0 && styles.missionDotDone]} />
          ))}
        </View>
      </View>

      {/* Top controls */}
      <View style={styles.topRow}>
        <Pressable style={styles.iconBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={cycleFlash}>
          <Ionicons name={FLASH_ICONS[flash] as keyof typeof Ionicons['glyphMap']} size={28} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={toggleFacing}>
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f, i) => (
          <Pressable
            key={f}
            style={[styles.filterChip, activeFilter === i && styles.filterChipActive]}
            onPress={() => { Haptics.selectionAsync(); setActiveFilter(i); }}
          >
            <Text style={[styles.filterChipText, activeFilter === i && styles.filterChipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Hint */}
      <View style={styles.hintOverlay} pointerEvents="none">
        <Text style={styles.hintText}>Tap to photo  ·  Hold to record</Text>
      </View>

      {/* Capture controls */}
      <View style={styles.bottomRow}>
        <View style={styles.cameraRollBtn}>
          <Ionicons name="images-outline" size={24} color="rgba(255,255,255,0.6)" />
        </View>

        <View style={styles.captureOuter}>
          <Pressable style={styles.captureInnerPressable} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            {isRecording ? (
              <Animated.View style={[styles.captureInnerRecording, recordingInnerStyle]} />
            ) : (
              <LinearGradient
                colors={[Colors.primaryContainer, '#FF7439']}
                style={styles.captureInnerIdle}
              />
            )}
          </Pressable>
        </View>

        <Pressable style={styles.iconBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="time-outline" size={28} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  permissionContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  permissionDenied: { alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  permissionEmoji: { fontSize: 48 },
  permissionTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.textPrimary, textAlign: 'center' },
  permissionSub: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },

  // ── Camera stage ──
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraInitOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cameraInitText: { fontFamily: Fonts.bodyLight, fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  cameraErrorOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  cameraErrorEmoji: { fontSize: 48 },
  cameraErrorTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.textPrimary, textAlign: 'center' },
  cameraErrorSub: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  progressBar: { position: 'absolute', top: 0, left: 0, height: 3, backgroundColor: Colors.primaryContainer, zIndex: 20 },

  missionCard: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(14,14,14,0.75)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  missionLabel: { fontFamily: Fonts.label, fontSize: 8, color: Colors.primaryContainer, letterSpacing: 3 },
  missionText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.textPrimary },
  missionProgress: { flexDirection: 'row', gap: 6, marginTop: 2 },
  missionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  missionDotDone: { backgroundColor: Colors.primaryContainer },

  topRow: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  filterScroll: { position: 'absolute', bottom: 140, left: 0, right: 0, zIndex: 10 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(14,14,14,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive: { backgroundColor: 'rgba(255,92,0,0.2)', borderColor: Colors.primaryContainer },
  filterChipText: { fontFamily: Fonts.label, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  filterChipTextActive: { color: Colors.primaryContainer },

  hintOverlay: { position: 'absolute', bottom: 130, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  hintText: { fontFamily: Fonts.bodyLight, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  bottomRow: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  cameraRollBtn: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(30,30,30,0.8)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerPressable: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  captureInnerIdle: { width: 68, height: 68, borderRadius: 34 },
  captureInnerRecording: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FF3366' },

  // ── Preview stage ──
  previewContainer: { flex: 1, backgroundColor: '#000' },
  reactionStrip: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 20,
    paddingHorizontal: 24,
  },
  reactionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  reactionEmoji: { fontSize: 22 },
  stickerOnImage: { position: 'absolute', fontSize: 36, zIndex: 15 },
  previewToolColumn: { position: 'absolute', right: 16, top: 120, bottom: 100, justifyContent: 'center', gap: 16, zIndex: 20 },
  previewTool: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBottom: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  discardPressable: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  discardText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: 'rgba(255,255,255,0.7)' },

  // ── Post stage ──
  postContainer: { flex: 1, backgroundColor: Colors.background },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  postTitle: { fontFamily: Fonts.display, fontSize: 24, color: Colors.primaryContainer, letterSpacing: 2 },
  postCloseBtn: { position: 'absolute', right: 16, top: 60, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  postCaptionRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16 },
  postPreviewThumb: {
    width: 90,
    height: 90,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  postPreviewImage: { width: 90, height: 90, borderRadius: 12 },
  captionInput: {
    flex: 1,
    minHeight: 80,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    textAlignVertical: 'top',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },
  sectionLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.primaryContainer, letterSpacing: 3, marginLeft: 16, marginBottom: 10 },

  audienceRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  audiencePill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: Colors.surfaceContainerLow,
    overflow: 'hidden',
  },
  audiencePillActive: { borderColor: Colors.primaryContainer },
  audiencePillText: { fontFamily: Fonts.label, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },
  audiencePillTextActive: { color: Colors.primaryContainer },

  barChipsContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  barChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  barChipSelected: { backgroundColor: 'rgba(255,92,0,0.15)', borderColor: Colors.primaryContainer },
  barChipText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textPrimary },
  barChipTextSelected: { color: Colors.primaryContainer },
  toggleRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  toggleRowLast: { borderBottomWidth: 0 },
  toggleLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.textPrimary },
  postButtonContainer: { marginHorizontal: 16, marginTop: 24, marginBottom: 40 },

  // ── Toast ──
  toastOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  toastText: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
});
