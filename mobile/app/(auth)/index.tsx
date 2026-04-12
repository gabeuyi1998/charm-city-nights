import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors, Fonts } from '../../constants/theme';
import { login, setToken, syncUser } from '../../lib/api';

// ─── Decode JWT sub (Cognito user ID) without a library ───────────────────────
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function LoginScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      const { idToken } = res.data;

      // Store token
      await setToken(idToken);
      await SecureStore.setItemAsync('refresh_token', res.data.refreshToken ?? '');

      // Sync user to our DB
      const payload = decodeJwtPayload(idToken);
      const cognitoId = payload.sub as string;
      const username = (payload['cognito:username'] as string) ?? cognitoId;
      const userData = await syncUser({ cognitoId, username, email: email.trim().toLowerCase() }).catch(() => null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const onboardingDone = await SecureStore.getItemAsync('onboarding_complete');
      if (!onboardingDone && !userData?.data?.displayName) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(tabs)/');
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err.message?.includes('USER_NOT_CONFIRMED') || err.message?.includes('verify')) {
        // Navigate to confirm screen
        await SecureStore.setItemAsync('pending_confirm_email', email.trim().toLowerCase());
        router.push('/(auth)/confirm');
      } else {
        setError(err.message ?? 'Login failed. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[Colors.background, '#0D0A1A', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🦀</Text>
            <Text style={styles.logoTitle}>CHARM CITY</Text>
            <Text style={styles.logoSub}>NIGHTS</Text>
          </View>

          <Text style={styles.headline}>Welcome back</Text>
          <Text style={styles.subheadline}>Sign in to your account</Text>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#FF5C00" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, passFocused && styles.inputFocused]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* Login button */}
          <Pressable
            style={[styles.loginBtn, (!email || !password || loading) && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={!email || !password || loading}
          >
            <LinearGradient
              colors={['#FF5C00', '#FF7439']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>SIGN IN</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign up */}
          <Pressable
            style={styles.signupBtn}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.signupBtnText}>Create an account</Text>
          </Pressable>

          {/* Confirm account link */}
          <Pressable
            style={styles.confirmLink}
            onPress={() => router.push('/(auth)/confirm')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.confirmLinkText}>Already have a code? Confirm your account →</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },

  logoRow: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 48, marginBottom: 4 },
  logoTitle: { fontFamily: Fonts.display, fontSize: 28, color: Colors.primary, letterSpacing: 4 },
  logoSub: { fontFamily: Fonts.display, fontSize: 18, color: Colors.textSecondary, letterSpacing: 6 },

  headline: { fontFamily: Fonts.display, fontSize: 36, color: Colors.textPrimary, letterSpacing: 1 },
  subheadline: { fontFamily: Fonts.bodyLight, fontSize: 15, color: Colors.textMuted, marginTop: 4, marginBottom: 24 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,92,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,0,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: Fonts.body, fontSize: 13, color: '#FF5C00', flex: 1 },

  fieldGroup: { marginBottom: 16 },
  label: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputFocused: { borderColor: 'rgba(255,92,0,0.4)' },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },

  loginBtn: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#fff', letterSpacing: 1 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted },

  signupBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.textPrimary },

  confirmLink: { alignItems: 'center', marginTop: 20 },
  confirmLinkText: { fontFamily: Fonts.bodyLight, fontSize: 13, color: Colors.textMuted },
});
