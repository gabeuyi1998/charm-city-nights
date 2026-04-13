/**
 * CameraScreen — ground-up rewrite
 *
 * Design:
 *  - Photo / Video mode toggle (no ambiguous press-and-hold)
 *  - Photo: tap shutter → capture → preview with real Image
 *  - Video: tap shutter to start → tap again to stop → preview with real Video
 *  - Upload: XHR read local file as blob → PUT to S3 presigned URL with progress
 *  - Preview: expo-image for photos, expo-av Video for videos
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../constants/theme';
import { getStoryPresign, createStory } from '../lib/api';

type CaptureMode = 'photo' | 'video';
type FlashSetting = 'off' | 'on' | 'auto';
type Facing = 'front' | 'back';

const FLASH_ICONS: Record<FlashSetting, React.ComponentProps<typeof Ionicons>['name']> = {
  off: 'flash-off',
  on: 'flash',
  auto: 'flash-outline',
};

// ─── Permission Screen ─────────────────────────────────────────────────────────

function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={styles.permContainer}>
      <Ionicons name="camera-outline" size={56} color={Colors.primary} />
      <Text style={styles.permTitle}>Camera Access Needed</Text>
      <Text style={styles.permSub}>
        Charm City Nights needs camera access to capture your nights out.
      </Text>
      <Pressable onPress={onRequest} style={styles.permBtn}>
        <Text style={styles.permBtnText}>Enable Camera</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openSettings()} style={styles.openSettingsBtn}>
        <Text style={styles.openSettingsBtnText}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

// ─── Preview Screen ────────────────────────────────────────────────────────────

function PreviewScreen({
  uri,
  isVideo,
  onRetake,
}: {
  uri: string;
  isVideo: boolean;
  onRetake: () => void;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handlePost = useCallback(async () => {
    if (uploading || done) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    progressAnim.setValue(0);

    try {
      // Derive filename + content type
      const parts = uri.split('/');
      const rawName = parts[parts.length - 1] ?? '';
      const filename = rawName || (isVideo ? 'story.mp4' : 'story.jpg');
      const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

      // 1. Get S3 presigned URL
      const { data: { uploadUrl, key } } = await getStoryPresign(filename, contentType);

      // 2. Read local file as blob via XHR, then upload to S3
      await new Promise<void>((resolve, reject) => {
        // Step A: read local file
        const readXhr = new XMLHttpRequest();
        readXhr.open('GET', uri);
        readXhr.responseType = 'blob';

        readXhr.onload = () => {
          if (!readXhr.response) { reject(new Error('Could not read captured file')); return; }
          const blob: Blob = readXhr.response;

          // Step B: upload blob to S3
          const uploadXhr = new XMLHttpRequest();
          uploadXhr.open('PUT', uploadUrl);
          uploadXhr.setRequestHeader('Content-Type', contentType);

          uploadXhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = e.loaded / e.total;
              setProgress(Math.round(pct * 100));
              Animated.timing(progressAnim, {
                toValue: pct,
                duration: 80,
                useNativeDriver: false,
              }).start();
            }
          };

          uploadXhr.onload = () => {
            if (uploadXhr.status >= 200 && uploadXhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${uploadXhr.status}`));
            }
          };
          uploadXhr.onerror = () => reject(new Error('Network error during upload'));
          uploadXhr.send(blob);
        };

        readXhr.onerror = () => reject(new Error('Could not read captured file'));
        readXhr.send();
      });

      // 3. Save story record in our DB
      await createStory(key, isVideo);

      setDone(true);
      setUploading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 1200);
    } catch (e: unknown) {
      setUploading(false);
      setError(e instanceof Error ? e.message : 'Upload failed — tap to retry');
    }
  }, [uri, isVideo, progressAnim, uploading, done, router]);

  return (
    <View style={styles.previewContainer}>
      {/* Real media preview */}
      {isVideo ? (
        <Video
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={false}
        />
      ) : (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}

      {/* Dark scrim at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.previewScrim}
        pointerEvents="none"
      />

      {/* Video badge */}
      {isVideo && (
        <View style={styles.videoBadge}>
          <Ionicons name="videocam" size={12} color="#fff" />
          <Text style={styles.videoBadgeText}>VIDEO</Text>
        </View>
      )}

      {/* Upload progress */}
      {uploading && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Uploading… {progress}%</Text>
        </View>
      )}

      {/* Success */}
      {done && (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
          <Text style={styles.successText}>Story posted!</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.statusRow}>
          <Ionicons name="alert-circle" size={20} color="#FF3366" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.previewButtons}>
        <Pressable
          style={styles.retakeBtn}
          onPress={onRetake}
          disabled={uploading}
        >
          <Text style={styles.retakeBtnText}>Retake</Text>
        </Pressable>

        <Pressable
          style={[styles.postBtn, (uploading || done) && { opacity: 0.6 }]}
          onPress={error ? handlePost : handlePost}
          disabled={uploading || done}
        >
          <LinearGradient
            colors={['#FF5C00', '#FF7439']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postBtnGradient}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>
                {done ? 'Posted ✓' : error ? 'Retry ↺' : 'Post to Story →'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Camera Screen ────────────────────────────────────────────────────────

export default function CameraScreen(): React.ReactElement {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [micGranted, setMicGranted] = useState(false);

  const [facing, setFacing] = useState<Facing>('back');
  const [flash, setFlash] = useState<FlashSetting>('off');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedIsVideo, setCapturedIsVideo] = useState(false);

  // Recording ring animation
  const recordRingAnim = useRef(new Animated.Value(0)).current;
  const recordLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setMicGranted(granted));
  }, []);

  const cycleFlash = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((f) => ({ off: 'on', on: 'auto', auto: 'off' } as Record<FlashSetting, FlashSetting>)[f]);
  }, []);

  const flipCamera = useCallback(() => {
    Haptics.selectionAsync();
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const switchMode = useCallback((m: CaptureMode) => {
    if (isRecording) return;
    Haptics.selectionAsync();
    setCaptureMode(m);
  }, [isRecording]);

  const handleShutter = useCallback(async () => {
    if (!cameraReady) return;

    if (captureMode === 'photo') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
        if (photo?.uri) {
          setCapturedUri(photo.uri);
          setCapturedIsVideo(false);
        }
      } catch (e) {
        console.warn('[camera] takePicture failed:', e);
      }
      return;
    }

    // Video mode — toggle record
    if (!isRecording) {
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      recordLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(recordRingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(recordRingAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        ]),
      );
      recordLoop.current.start();

      try {
        const video = await cameraRef.current?.recordAsync({ maxDuration: 60 });
        if (video?.uri) {
          setCapturedUri(video.uri);
          setCapturedIsVideo(true);
        }
      } catch (e) {
        console.warn('[camera] recordAsync failed:', e);
      } finally {
        recordLoop.current?.stop();
        recordRingAnim.setValue(0);
        setIsRecording(false);
      }
    } else {
      // Stop recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      cameraRef.current?.stopRecording();
    }
  }, [captureMode, isRecording, cameraReady, recordRingAnim]);

  // ── Permission not yet determined ─────────────────────────────────────────
  if (!permission) {
    return <View style={styles.container} />;
  }

  // ── Permission denied ─────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <PermissionScreen
        onRequest={async () => {
          await requestPermission();
          await Audio.requestPermissionsAsync().then(({ granted }) => setMicGranted(granted));
        }}
      />
    );
  }

  // ── Preview after capture ─────────────────────────────────────────────────
  if (capturedUri) {
    return (
      <PreviewScreen
        uri={capturedUri}
        isVideo={capturedIsVideo}
        onRetake={() => {
          setCapturedUri(null);
          setCapturedIsVideo(false);
        }}
      />
    );
  }

  // ── Live viewfinder ───────────────────────────────────────────────────────
  const recordingBorderColor = recordRingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.9)', 'rgba(255,51,102,0.9)'],
  });

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode="video"
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Camera not ready spinner */}
      {!cameraReady && (
        <View style={styles.readyOverlay} pointerEvents="none">
          <ActivityIndicator color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* ── Top Row ── */}
      <View style={styles.topRow}>
        <Pressable style={styles.topBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        {isRecording ? (
          <View style={styles.recPill}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>RECORDING</Text>
          </View>
        ) : (
          <Text style={styles.modeTitle}>{captureMode === 'photo' ? 'PHOTO' : 'VIDEO'}</Text>
        )}

        <Pressable style={styles.topBtn} onPress={cycleFlash}>
          <Ionicons name={FLASH_ICONS[flash]} size={26} color="#fff" />
        </Pressable>
      </View>

      {/* ── Mode Selector ── */}
      {!isRecording && (
        <View style={styles.modeSwitcher}>
          <Pressable
            style={[styles.modeTab, captureMode === 'photo' && styles.modeTabActive]}
            onPress={() => switchMode('photo')}
          >
            <Text style={[styles.modeTabText, captureMode === 'photo' && styles.modeTabTextActive]}>
              PHOTO
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, captureMode === 'video' && styles.modeTabActive]}
            onPress={() => switchMode('video')}
          >
            <Text style={[styles.modeTabText, captureMode === 'video' && styles.modeTabTextActive]}>
              VIDEO
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Bottom Row ── */}
      <View style={styles.bottomRow}>
        {/* Empty left slot */}
        <View style={styles.sideSlot} />

        {/* Shutter */}
        <Pressable
          onPress={handleShutter}
          disabled={!cameraReady}
          style={styles.shutterWrap}
          accessibilityLabel={captureMode === 'photo' ? 'Take photo' : isRecording ? 'Stop recording' : 'Start recording'}
        >
          <Animated.View style={[
            styles.shutterRing,
            isRecording && { borderColor: recordingBorderColor as any },
          ]}>
            {captureMode === 'video' && isRecording ? (
              <View style={styles.stopSquare} />
            ) : captureMode === 'video' ? (
              <View style={styles.videoShutter}>
                <View style={styles.videoShutterDot} />
              </View>
            ) : (
              <LinearGradient
                colors={[Colors.primary, '#FF7439']}
                style={[StyleSheet.absoluteFill, { borderRadius: 34 }]}
              />
            )}
          </Animated.View>
        </Pressable>

        {/* Flip camera */}
        <View style={styles.sideSlot}>
          <Pressable style={styles.flipBtn} onPress={flipCamera} disabled={isRecording}>
            <Ionicons name="camera-reverse-outline" size={28} color={isRecording ? 'rgba(255,255,255,0.3)' : '#fff'} />
          </Pressable>
        </View>
      </View>

      {!isRecording && !capturedUri && (
        <Text style={styles.hint} pointerEvents="none">
          {captureMode === 'photo' ? 'TAP TO CAPTURE' : 'TAP TO START · TAP AGAIN TO STOP'}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  readyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // Permission
  permContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permTitle: { color: '#E5E2E1', fontSize: 22, fontFamily: Fonts.display, textAlign: 'center' },
  permSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 50,
    marginTop: 8,
  },
  permBtnText: { color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 16 },
  openSettingsBtn: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  openSettingsBtnText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.body, fontSize: 14 },

  // Top controls
  topRow: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
  modeTitle: {
    fontFamily: Fonts.label,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 3,
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,51,102,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recText: { color: '#fff', fontSize: 11, fontFamily: Fonts.label, letterSpacing: 1 },

  // Mode switcher
  modeSwitcher: {
    position: 'absolute',
    bottom: 148,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  modeTab: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
  },
  modeTabActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  modeTabText: {
    fontFamily: Fonts.label,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  modeTabTextActive: { color: '#fff' },

  // Bottom controls
  bottomRow: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  sideSlot: { width: 56, alignItems: 'center' },
  flipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shutter
  shutterWrap: { alignItems: 'center', justifyContent: 'center' },
  shutterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Photo shutter fill (gradient handled inline)
  stopSquare: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#FF3366',
  },
  videoShutter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,51,102,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoShutterDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3366',
  },

  hint: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontFamily: Fonts.label,
    letterSpacing: 2,
    zIndex: 40,
  },

  // Preview
  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    zIndex: 5,
  },
  videoBadge: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,51,102,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  videoBadgeText: { color: '#fff', fontFamily: Fonts.label, fontSize: 10, letterSpacing: 1 },

  progressWrap: {
    position: 'absolute',
    bottom: 150,
    left: 24,
    right: 24,
    zIndex: 10,
    alignItems: 'center',
    gap: 6,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  progressText: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.label, fontSize: 12 },

  statusRow: {
    position: 'absolute',
    bottom: 150,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 12,
    borderRadius: 12,
  },
  successText: { color: '#4ade80', fontFamily: Fonts.bodySemiBold, fontSize: 14, flex: 1 },
  errorText: { color: '#FF3366', fontFamily: Fonts.body, fontSize: 13, flex: 1 },

  previewButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 48,
  },
  retakeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: { color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 16 },
  postBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  postBtnGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  postBtnText: { color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 16 },
});
