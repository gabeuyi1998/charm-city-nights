import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../constants/theme';
import { getStoryPresign, createStory } from '../lib/api';

type FlashMode = 'off' | 'on' | 'auto';
type Facing = 'front' | 'back';

const MAX_RECORD_MS = 60000;

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
      <Pressable onPress={() => Linking.openSettings()} style={styles.settingsBtn}>
        <Text style={styles.settingsBtnText}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

// ─── Preview Screen ────────────────────────────────────────────────────────────
function PreviewScreen({ uri, isVideo, onRetake, onDone }: {
  uri: string;
  isVideo: boolean;
  onRetake: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handlePost = useCallback(async () => {
    setUploading(true);
    setError(null);
    setProgress(0);
    progressAnim.setValue(0);

    try {
      const parts = uri.split('/');
      const filename = parts[parts.length - 1] ?? (isVideo ? 'story.mp4' : 'story.jpg');
      const contentType = isVideo ? 'video/mp4' : 'image/jpeg';

      const { data: { uploadUrl, key } } = await getStoryPresign(filename, contentType);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = e.loaded / e.total;
            setProgress(Math.round(pct * 100));
            Animated.timing(progressAnim, {
              toValue: pct,
              duration: 100,
              useNativeDriver: false,
            }).start();
          }
        };

        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error during upload'));

        fetch(uri).then((r) => r.blob()).then((blob) => xhr.send(blob)).catch(reject);
      });

      await createStory(key, isVideo);
      setSuccess(true);
      setUploading(false);
      setTimeout(() => { onDone(); router.back(); }, 1000);
    } catch (e) {
      setUploading(false);
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  }, [uri, isVideo, progressAnim, onDone, router]);

  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewMedia}>
        <Ionicons name={isVideo ? 'videocam' : 'image'} size={80} color="rgba(255,255,255,0.3)" />
        <Text style={styles.previewLabel}>{isVideo ? 'Video captured' : 'Photo captured'}</Text>
      </View>

      {uploading && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, {
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}

      {success && (
        <View style={styles.statusBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
          <Text style={styles.successText}>Story posted!</Text>
        </View>
      )}

      {error != null && (
        <View style={styles.statusBanner}>
          <Ionicons name="alert-circle" size={20} color="#FF3366" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={handlePost}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.previewButtons}>
        <Pressable style={styles.retakeBtn} onPress={onRetake} disabled={uploading}>
          <Text style={styles.retakeBtnText}>Retake</Text>
        </Pressable>
        <Pressable style={styles.postBtn} onPress={handlePost} disabled={uploading || success}>
          <LinearGradient
            colors={['#FF5C00', '#FF7439']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postBtnGradient}
          >
            <Text style={styles.postBtnText}>
              {uploading ? `Uploading… ${progress}%` : 'Post to Story →'}
            </Text>
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

  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micGranted, setMicGranted] = useState(false);

  const [facing, setFacing] = useState<Facing>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const captureScale = useRef(new Animated.Value(1)).current;
  const recordingProgress = useRef(new Animated.Value(0)).current;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef(0);

  useEffect(() => {
    Audio.requestPermissionsAsync().then(({ granted }) => setMicGranted(granted));
  }, []);

  const cycleFlash = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((f) => ({ off: 'on', on: 'auto', auto: 'off' } as Record<FlashMode, FlashMode>)[f]);
  }, []);

  const flipCamera = useCallback(() => {
    Haptics.selectionAsync();
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const handlePressIn = useCallback(() => {
    pressStart.current = Date.now();
    pressTimer.current = setTimeout(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      setIsVideo(true);
      recordingProgress.setValue(0);
      Animated.timing(recordingProgress, { toValue: 1, duration: MAX_RECORD_MS, useNativeDriver: false }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(captureScale, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(captureScale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
        ]),
      ).start();

      try {
        const video = await cameraRef.current?.recordAsync();
        if (video?.uri) {
          setCapturedUri(video.uri);
          setIsRecording(false);
          setIsVideo(true);
        }
      } catch {
        setIsRecording(false);
      }

      recordingTimer.current = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, MAX_RECORD_MS);
    }, 200);
  }, [captureScale, recordingProgress]);

  const handlePressOut = useCallback(async () => {
    const elapsed = Date.now() - pressStart.current;
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    if (recordingTimer.current) { clearTimeout(recordingTimer.current); recordingTimer.current = null; }

    captureScale.stopAnimation();
    Animated.timing(captureScale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    recordingProgress.stopAnimation();
    recordingProgress.setValue(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRecording) {
      cameraRef.current?.stopRecording();
      setIsRecording(false);
      return;
    }

    if (elapsed < 200) {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
        if (photo?.uri) {
          setCapturedUri(photo.uri);
          setIsVideo(false);
        }
      } catch (e) {
        console.warn('[camera] takePicture error:', e);
      }
    }
  }, [captureScale, isRecording, recordingProgress]);

  if (!camPermission) return <View style={styles.permContainer} />;

  if (!camPermission.granted) {
    return (
      <PermissionScreen
        onRequest={async () => {
          await requestCamPermission();
          const { granted } = await Audio.requestPermissionsAsync();
          setMicGranted(granted);
        }}
      />
    );
  }

  if (capturedUri) {
    return (
      <PreviewScreen
        uri={capturedUri}
        isVideo={isVideo}
        onRetake={() => { setCapturedUri(null); setIsVideo(false); }}
        onDone={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCapturedUri(null);
          setIsVideo(false);
        }}
      />
    );
  }

  const flashIcon = { off: 'flash-off', on: 'flash', auto: 'flash-outline' }[flash] as React.ComponentProps<typeof Ionicons>['name'];

  return (
    <View style={styles.viewfinder}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode="video"
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {isRecording && (
        <Animated.View
          style={[styles.recordingBar, {
            width: recordingProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}
          pointerEvents="none"
        />
      )}

      <View style={styles.topRow}>
        <Pressable style={styles.topBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        {isRecording && (
          <View style={styles.recPill}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC</Text>
          </View>
        )}
        <Pressable style={styles.topBtn} onPress={cycleFlash}>
          <Ionicons name={flashIcon} size={26} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.sideSlot} />
        <Animated.View style={[styles.captureRing, { transform: [{ scale: captureScale }] }]}>
          <Pressable
            style={styles.captureInner}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityLabel="Capture photo or hold to record video"
          >
            {isRecording ? (
              <View style={styles.captureInnerRecording} />
            ) : (
              <LinearGradient
                colors={[Colors.primary, '#FF7439']}
                style={[StyleSheet.absoluteFill, { borderRadius: 36 }]}
              />
            )}
          </Pressable>
        </Animated.View>
        <View style={styles.sideSlot}>
          <Pressable style={styles.sideBtn} onPress={flipCamera}>
            <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
          </Pressable>
        </View>
      </View>

      {!isRecording && (
        <Text style={styles.hint} pointerEvents="none">
          TAP PHOTO · HOLD VIDEO
        </Text>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  permContainer: { flex: 1, backgroundColor: '#131313', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 },
  permTitle: { color: '#E5E2E1', fontSize: 20, fontFamily: Fonts.headline, textAlign: 'center' },
  permSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  permBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50, marginTop: 8 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  settingsBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  settingsBtnText: { color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontSize: 14 },

  viewfinder: { flex: 1, backgroundColor: '#000' },
  recordingBar: { position: 'absolute', top: 0, left: 0, height: 3, backgroundColor: '#FF3366', zIndex: 60 },

  topRow: { position: 'absolute', top: 56, left: 0, right: 0, zIndex: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 22 },
  recPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,51,102,0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recText: { color: '#fff', fontSize: 12, fontFamily: Fonts.label, letterSpacing: 1 },

  bottomRow: { position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32 },
  sideSlot: { width: 56, alignItems: 'center' },
  sideBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  captureRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff', padding: 4, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', backgroundColor: Colors.primary },
  captureInnerRecording: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FF3366', alignSelf: 'center', marginTop: 20 },
  hint: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: Fonts.label, letterSpacing: 2, zIndex: 40 },

  previewContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between' },
  previewMedia: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  previewLabel: { color: 'rgba(255,255,255,0.4)', fontFamily: Fonts.body, fontSize: 14 },
  previewButtons: { flexDirection: 'row', gap: 12, padding: 24, paddingBottom: 48 },
  retakeBtn: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  retakeBtnText: { color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 16 },
  postBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  postBtnGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  postBtnText: { color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 16 },

  progressOverlay: { position: 'absolute', bottom: 120, left: 24, right: 24, alignItems: 'center', gap: 8 },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  progressText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.label, fontSize: 12 },

  statusBanner: { position: 'absolute', bottom: 160, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 12 },
  successText: { color: '#4ade80', fontFamily: Fonts.bodySemiBold, fontSize: 14, flex: 1 },
  errorText: { color: '#FF3366', fontFamily: Fonts.body, fontSize: 13, flex: 1 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontFamily: Fonts.bodySemiBold, fontSize: 13 },
});
