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
import { register } from '../../lib/api';

export default function SignupScreen(): React.ReactElement {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirm;
  const passwordStrong = password.length >= 8;
  const canSubmit = username.trim().length >= 2 && email.includes('@') && passwordStrong && passwordsMatch && !loading;

  const handleSignup = useCallback(async () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);

    try {
      await register(email.trim().toLowerCase(), password, username.trim());
      // Store email for confirm screen
      await SecureStore.setItemAsync('pending_confirm_email', email.trim().toLowerCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(auth)/confirm');
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message ?? 'Signup failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, email, password, username]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[Colors.background, '#0D0A1A', Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>

          <Text style={styles.headline}>Create account</Text>
          <Text style={styles.subheadline}>Join Baltimore's nightlife app</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#FF5C00" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(t) => setUsername(t.replace(/\s/g, '').toLowerCase())}
              placeholder="charmcitynighter"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 chars, uppercase, number"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPass}
                returnKeyType="next"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPass((v) => !v)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            {password.length > 0 && !passwordStrong && (
              <Text style={styles.hint}>Must be at least 8 characters</Text>
            )}
          </View>

          {/* Confirm */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              style={[styles.input, confirm.length > 0 && !passwordsMatch && styles.inputError]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <Text style={styles.hint}>Passwords don't match</Text>
            )}
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSignup}
            disabled={!canSubmit}
          >
            <LinearGradient
              colors={['#FF5C00', '#FF7439']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>CREATE ACCOUNT</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.terms}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },

  backBtn: { marginBottom: 24 },
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
  inputError: { borderColor: 'rgba(255,92,0,0.5)' },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  hint: { fontFamily: Fonts.bodyLight, fontSize: 12, color: '#FF5C00', marginTop: 6 },

  submitBtn: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: '#fff', letterSpacing: 1 },

  terms: { fontFamily: Fonts.bodyLight, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 20 },
});
