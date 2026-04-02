import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

interface Slide {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
}

const SLIDES: Slide[] = [
  { emoji: '🦀', title: 'CHARM CITY\nNIGHTS', subtitle: "Baltimore's nightlife, gamified.", accent: '#FF6B35' },
  { emoji: '📍', title: 'DISCOVER\nTONIGHT', subtitle: 'See which bars are packed right now.', accent: '#FFD700' },
  { emoji: '🏅', title: 'COLLECT\nBADGES', subtitle: 'Check in, earn XP, climb the leaderboard.', accent: '#8B5CF6' },
  { emoji: '🗺️', title: 'JOIN\nCRAWLS', subtitle: 'Earn vouchers. Win Baltimore. 🦀', accent: '#00C9A7' },
];

// ---------------------------------------------------------------------------
// SlideItem
// ---------------------------------------------------------------------------

interface SlideItemProps {
  item: Slide;
  isActive: boolean;
}

function SlideItem({ item, isActive }: SlideItemProps): React.ReactElement {
  const emojiOpacity = useSharedValue(0);
  const emojiScale = useSharedValue(0.5);

  useEffect(() => {
    if (isActive) {
      emojiOpacity.value = withTiming(1, { duration: 400 });
      emojiScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    } else {
      emojiOpacity.value = withTiming(0, { duration: 200 });
      emojiScale.value = withTiming(0.5, { duration: 200 });
    }
  }, [isActive, emojiOpacity, emojiScale]);

  const emojiStyle = useAnimatedStyle(() => ({
    opacity: emojiOpacity.value,
    transform: [{ scale: emojiScale.value }],
  }));

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.Text style={[styles.slideEmoji, emojiStyle]}>{item.emoji}</Animated.Text>
      <Text style={[styles.slideTitle, { color: item.accent }]}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Social login button
// ---------------------------------------------------------------------------

interface SocialButtonProps {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  textColor: string;
  bgColor?: string;
  gradientColors?: readonly [string, string];
  borderColor?: string;
  onPress: () => void;
}

function SocialButton({
  label,
  iconName,
  iconColor,
  textColor,
  bgColor,
  gradientColors,
  borderColor,
  onPress,
}: SocialButtonProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 120 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const inner = (
    <View style={styles.socialBtnInner}>
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={[styles.socialBtnText, { color: textColor }]}>{label}</Text>
    </View>
  );

  const containerStyle = [
    styles.socialBtn,
    borderColor ? { borderWidth: 1, borderColor } : null,
    bgColor ? { backgroundColor: bgColor } : null,
    animatedStyle,
  ];

  if (gradientColors) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.socialBtn}
          >
            {inner}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={StyleSheet.absoluteFill}
      />
      {inner}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function AuthIndexScreen(): React.ReactElement {
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  // Dot animations — declared individually (Rules of Hooks)
  const dot0Width = useSharedValue(24);
  const dot1Width = useSharedValue(6);
  const dot2Width = useSharedValue(6);
  const dot3Width = useSharedValue(6);

  const dot0Color = useSharedValue(Colors.primary);
  const dot1Color = useSharedValue('rgba(255,255,255,0.3)');
  const dot2Color = useSharedValue('rgba(255,255,255,0.3)');
  const dot3Color = useSharedValue('rgba(255,255,255,0.3)');

  const dotWidths = [dot0Width, dot1Width, dot2Width, dot3Width];
  const dotColors = [dot0Color, dot1Color, dot2Color, dot3Color];

  const dot0Style = useAnimatedStyle(() => ({ width: dot0Width.value, backgroundColor: dot0Color.value }));
  const dot1Style = useAnimatedStyle(() => ({ width: dot1Width.value, backgroundColor: dot1Color.value }));
  const dot2Style = useAnimatedStyle(() => ({ width: dot2Width.value, backgroundColor: dot2Color.value }));
  const dot3Style = useAnimatedStyle(() => ({ width: dot3Width.value, backgroundColor: dot3Color.value }));

  const dotStyles = [dot0Style, dot1Style, dot2Style, dot3Style];

  const goToSlide = useCallback(
    (index: number) => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setCurrentSlide(index);
      dotWidths.forEach((dw, i) => {
        dw.value = withTiming(i === index ? 24 : 6, { duration: 200 });
      });
      dotColors.forEach((dc, i) => {
        dc.value = withTiming(i === index ? Colors.primary : 'rgba(255,255,255,0.3)', { duration: 200 });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Auto-advance every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        goToSlide(next);
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [goToSlide]);

  // Background glow
  const glowOpacity = useSharedValue(0.4);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const handleSocialPress = useCallback(() => {
    router.push('/(auth)/onboarding');
  }, []);

  const renderSlide = useCallback(
    ({ item, index }: ListRenderItemInfo<Slide>) => (
      <SlideItem item={item} isActive={index === currentSlide} />
    ),
    [currentSlide],
  );

  const keyExtractor = useCallback((_: Slide, i: number) => String(i), []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background */}
      <LinearGradient
        colors={[Colors.background, '#0D0A1A', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glowCircle, glowStyle]} />

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          goToSlide(index);
        }}
        style={styles.carousel}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {dotStyles.map((ds, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              Haptics.selectionAsync();
              goToSlide(i);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Animated.View style={[styles.dot, ds]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Social login buttons */}
      <View style={styles.buttonsContainer}>
        <SocialButton
          label="Continue with Facebook"
          iconName="logo-facebook"
          iconColor="#FFFFFF"
          textColor="#FFFFFF"
          bgColor="#1877F2"
          onPress={handleSocialPress}
        />
        <SocialButton
          label="Continue with Apple"
          iconName="logo-apple"
          iconColor="#FFFFFF"
          textColor="#FFFFFF"
          bgColor="#000000"
          borderColor="rgba(255,255,255,0.2)"
          onPress={handleSocialPress}
        />
        <SocialButton
          label="Continue with Google"
          iconName="logo-google"
          iconColor="#4285F4"
          textColor="#333333"
          bgColor="#FFFFFF"
          onPress={handleSocialPress}
        />
        <SocialButton
          label="Continue with Instagram"
          iconName="logo-instagram"
          iconColor="#FFFFFF"
          textColor="#FFFFFF"
          gradientColors={['#833AB4', '#FD1D1D']}
          onPress={handleSocialPress}
        />
      </View>

      {/* Bar owner link */}
      <TouchableOpacity
        style={styles.barOwnerBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/manager/signup' as never);
        }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.barOwnerText}>Bar Owner? Sign up here →</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  glowCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,107,53,0.12)',
    top: '20%',
    alignSelf: 'center',
  },

  // Carousel
  carousel: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  slideEmoji: { fontSize: 80, marginBottom: 20 },
  slideTitle: {
    fontFamily: Fonts.display,
    fontSize: 48,
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 52,
  },
  slideSubtitle: {
    fontFamily: Fonts.bodyLight,
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  dot: { height: 6, borderRadius: 3 },

  // Buttons
  buttonsContainer: { paddingHorizontal: 32, gap: 12, marginBottom: 16 },
  socialBtn: {
    height: 56,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  socialBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  socialBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16 },

  // Bar owner
  barOwnerBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  barOwnerText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.primary },
});
