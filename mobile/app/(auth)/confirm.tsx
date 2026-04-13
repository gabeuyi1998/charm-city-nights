import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors, Fonts } from '../../constants/theme';
import { confirmEmail, resendCode } from '../../lib/api';

export default function ConfirmScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill email from secure store
  React.useEffect(() => {
    SecureStore.getItemAsync('pending_confirm_email').then((e) => {
      if (e) setEmail(e);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!email || code.length < 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);
    try {
      await confirmEmail(email.trim().toLowerCase(), code.trim());
      await SecureStore.deleteItemAsync('pending_confirm_email');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => router.replace('/(auth)/'), 1500);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'Invalid code. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [email, code]);

  const handleResend = useCallback(async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    try {
      await resendCode(email.trim().toLowerCase());
      setError('Code resent — check your email.');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  }, [email]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={[Colors.background, '#0D0A1A', Colors.background]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inner}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>

          <Text style={styles.emoji}>📬</Text>
          <Text style={styles.headline}>Verify your email</Text>
          <Text style={styles.subheadline}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailHighlight}>{email || 'your email'}</Text>
          </Text>

          {error ? (
            <View style={[styles.errorBox, error.includes('resent') && styles.infoBox]}>
              <Ionicons name={error.includes('resent') ? 'checkmark-circle' : 'alert-circle'} size={16} color={error.includes('resent') ? '#00C9A7' : '#FF5C00'} />
              <Text style={[styles.errorText, error.includes('resent') && styles.infoText]}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.errorBox, styles.infoBox]}>
              <Ionicons name="checkmark-circle" size={16} color="#00C9A7" />
              <Text style={styles.infoText}>Account confirmed! Redirecting to login…</Text>
            </View>
          ) : null}

          {/* Email field (editable in case user came directly) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Code field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>VERIFICATION CODE</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').substring(0, 6))}
              placeholder="000000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          </View>

          <Pressable
            style={[styles.confirmBtn, (!email || code.length < 6 || loading) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!email || code.length < 6 || loading}
          >
            <LinearGradient colors={['#FF5C00', '#FF7439']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtnGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>CONFIRM ACCOUNT</Text>}
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.resendBtn} onPress={handleResend} disabled={resending}>
            <Text style={styles.resendText}>{resending ? 'Sending…' : "Didn't get a code? Resend"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: 16 },
  headline: { fontFamily: Fonts.display, fontSize: 32, color: Colors.textPrimary, textAlign: 'center' },
  subheadline: { fontFamily: Fonts.bodyLight, fontSize: 15, color: Colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 22 },
  emailHighlight: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,92,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,92,0,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  infoBox: { backgroundColor: 'rgba(0,201,167,0.1)', borderColor: 'rgba(0,201,167,0.3)' },
  errorText: { fontFamily: Fonts.body, fontSize: 13, color: '#FF5C00', flex: 1 },
  infoText: { fontFamily: Fonts.body, fontSize: 13, color: '#00C9A7', flex: 1 },
  fieldGroup: { marginBottom: 16 },
  label: { fontFamily: Fonts.label, fontSize: 11, color: Colors.textMuted, letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: Fonts.body, fontSize: 16, color: Colors.textPrimary,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  codeInput: { fontSize: 28, textAlign: 'center', letterSpacing: 12, fontFamily: Fonts.bodySemiBold },
  confirmBtn: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#fff', letterSpacing: 1 },
  resendBtn: { alignItems: 'center', marginTop: 20, minHeight: 44, justifyContent: 'center' },
  resendText: { fontFamily: Fonts.bodyLight, fontSize: 14, color: Colors.textMuted },
});
