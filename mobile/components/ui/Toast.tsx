import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/theme';

export type ToastType = 'success' | 'error' | 'info' | 'badge';

export interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
  badgeEmoji?: string;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => undefined,
});

const SCREEN_HEIGHT = Dimensions.get('window').height;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
const TOAST_OFFSET_FROM_BOTTOM = TAB_BAR_HEIGHT + 16;

const TYPE_CONFIG: Record<
  ToastType,
  { borderColor: string; icon: string; vibrate: boolean }
> = {
  success: { borderColor: Colors.success, icon: '✅', vibrate: false },
  error: { borderColor: Colors.error, icon: '❌', vibrate: true },
  info: { borderColor: Colors.primary, icon: '🔥', vibrate: false },
  badge: { borderColor: Colors.secondary, icon: '🏅', vibrate: false },
};

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastItemProps {
  toast: ToastState;
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = TYPE_CONFIG[toast.type];
  const icon = toast.type === 'badge' && toast.badgeEmoji ? toast.badgeEmoji : config.icon;

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    translateY.value = withTiming(160, { duration: 300 }, () => {
      runOnJS(onDismiss)(toast.id);
    });
    opacity.value = withTiming(0, { duration: 300 });
  }, [dismissTimer, onDismiss, opacity, toast.id, translateY]);

  React.useEffect(() => {
    // Slide in
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });

    if (config.vibrate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const duration = toast.duration ?? 3000;
    dismissTimer.current = setTimeout(dismiss, duration);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        gestureTranslateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 60) {
        runOnJS(dismiss)();
      } else {
        gestureTranslateY.value = withSpring(0, { damping: 20 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + gestureTranslateY.value },
    ],
    opacity: opacity.value,
  }));

  const isBadge = toast.type === 'badge';

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.toast,
          { borderLeftColor: config.borderColor },
          isBadge && styles.toastBadge,
          animStyle,
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            dismiss();
          }}
          style={styles.toastInner}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Text style={styles.toastIcon}>{icon}</Text>
          <Text style={[styles.toastMessage, isBadge && styles.toastMessageBadge]}>
            {toast.message}
          </Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

export function ToastContainer(): React.ReactElement {
  const { toasts, dismiss } = useToastInternal();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}

interface InternalContextValue extends ToastContextValue {
  toasts: ToastState[];
  dismiss: (id: number) => void;
}

const InternalToastContext = createContext<InternalContextValue>({
  show: () => undefined,
  toasts: [],
  dismiss: () => undefined,
});

function useToastInternal(): InternalContextValue {
  return useContext(InternalToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const counter = useRef(0);

  const show = useCallback((opts: ToastOptions) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <InternalToastContext.Provider value={{ show, toasts, dismiss }}>
      <ToastContext.Provider value={{ show }}>
        {children}
        <ToastContainer />
      </ToastContext.Provider>
    </InternalToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: TOAST_OFFSET_FROM_BOTTOM,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastBadge: {
    paddingVertical: 4,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 44,
  },
  toastIcon: {
    fontSize: 20,
  },
  toastMessage: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  toastMessageBadge: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
});
