import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getMe, updateMe } from '../lib/api';
import { Colors, Fonts } from '../constants/theme';

export default function EditProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(({ data }) => {
        setDisplayName(data.displayName ?? '');
        setBio(data.bio ?? '');
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const payload: { displayName?: string; bio?: string } = {};
      if (displayName.trim()) payload.displayName = displayName.trim();
      if (bio.trim()) payload.bio = bio.trim();
      await updateMe(payload);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerLoader}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Display Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the city about yourself…"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={160}
              textAlignVertical="top"
              autoCorrect
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          >
            <LinearGradient
              colors={['#FF5C00', '#FF7439']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.manropeBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerSpacer: { width: 32 },
  scrollContent: {
    padding: 24,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: Fonts.manropeSemiBold,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: Fonts.manropeRegular,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  errorBox: {
    backgroundColor: Colors.errorContainer,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontFamily: Fonts.manropeRegular,
    fontSize: 14,
    color: Colors.onErrorContainer,
  },
  saveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveBtnPressed: { opacity: 0.85 },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: Fonts.manropeBold,
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.5,
  },
});
