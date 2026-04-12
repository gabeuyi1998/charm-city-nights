import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { Button } from '../../components/ui';
import { onboardUser } from '../../lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 4;

const NEIGHBORHOODS = [
  'Fells Point',
  'Federal Hill',
  'Canton',
  'Inner Harbor',
  'Locust Point',
  'Charles Village',
  'Hampden',
  'Remington',
  'Station North',
  'Mount Vernon',
  'Roland Park',
  'Waverly',
  'Dundalk',
  'Pigtown',
  'South Baltimore',
];

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  step: number;
  total: number;
}

function ProgressBar({ step, total }: ProgressBarProps): React.ReactElement {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            {
              backgroundColor:
                i < step ? Colors.primary : 'rgba(255,255,255,0.15)',
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Name
// ---------------------------------------------------------------------------

interface Step1Props {
  name: string;
  onNameChange: (v: string) => void;
}

function Step1({ name, onNameChange }: Step1Props): React.ReactElement {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>WHAT'S YOUR NAME?</Text>
      <Text style={styles.stepSubtitle}>We'll use this on your profile</Text>
      <TextInput
        style={[
          styles.textInput,
          focused && styles.textInputFocused,
        ]}
        value={name}
        onChangeText={onNameChange}
        placeholder="Your first name"
        placeholderTextColor={Colors.textMuted}
        autoFocus
        autoCorrect={false}
        returnKeyType="done"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Neighborhood
// ---------------------------------------------------------------------------

interface Step2Props {
  neighborhood: string;
  onNeighborhoodChange: (v: string) => void;
}

function Step2({ neighborhood, onNeighborhoodChange }: Step2Props): React.ReactElement {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>YOUR HOME TURF?</Text>
      <Text style={styles.stepSubtitle}>Where do you usually go out?</Text>
      <ScrollView
        style={styles.neighborhoodScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.neighborhoodGrid}
      >
        {NEIGHBORHOODS.map((n) => {
          const selected = neighborhood === n;
          return (
            <Pressable
              key={n}
              style={[
                styles.neighborhoodPill,
                selected && styles.neighborhoodPillSelected,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                onNeighborhoodChange(n);
              }}
            >
              <Text
                style={[
                  styles.neighborhoodText,
                  selected && styles.neighborhoodTextSelected,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Age
// ---------------------------------------------------------------------------

interface Step3Props {
  ageConfirmed: boolean;
  onAgeConfirmedChange: (v: boolean) => void;
}

function Step3({ ageConfirmed, onAgeConfirmedChange }: Step3Props): React.ReactElement {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>ONE QUICK THING</Text>
      <Text style={styles.stepSubtitle}>Baltimore bars require you to be 21+</Text>

      {/* Checkbox */}
      <Pressable
        style={styles.checkboxRow}
        onPress={() => {
          Haptics.selectionAsync();
          onAgeConfirmedChange(!ageConfirmed);
        }}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: ageConfirmed ? Colors.primary : Colors.surface,
              borderColor: ageConfirmed
                ? Colors.primary
                : 'rgba(255,255,255,0.2)',
            },
          ]}
        >
          {ageConfirmed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.checkboxLabel}>I confirm I am 21 or older</Text>
      </Pressable>

      {/* DOB */}
      <Text style={styles.dobLabel}>Date of birth (optional)</Text>
      <View style={styles.dobRow}>
        <TextInput
          style={[styles.textInput, styles.dobInput]}
          value={month}
          onChangeText={(t) => {
            setMonth(t.replace(/[^0-9]/g, '').substring(0, 2));
            if (t.length === 2) dayRef.current?.focus();
          }}
          placeholder="MM"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={2}
          returnKeyType="next"
        />
        <TextInput
          ref={dayRef}
          style={[styles.textInput, styles.dobInput]}
          value={day}
          onChangeText={(t) => {
            setDay(t.replace(/[^0-9]/g, '').substring(0, 2));
            if (t.length === 2) yearRef.current?.focus();
          }}
          placeholder="DD"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={2}
          returnKeyType="next"
        />
        <TextInput
          ref={yearRef}
          style={[styles.textInput, styles.dobInput, { flex: 1.4 }]}
          value={year}
          onChangeText={(t) =>
            setYear(t.replace(/[^0-9]/g, '').substring(0, 4))
          }
          placeholder="YYYY"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={4}
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Notifications
// ---------------------------------------------------------------------------

interface Step4Props {
  notifGranted: boolean;
  onNotifGranted: (v: boolean) => void;
}

function Step4({ notifGranted, onNotifGranted }: Step4Props): React.ReactElement {
  return (
    <View style={[styles.stepContent, styles.stepContentCentered]}>
      <Text style={styles.stepTitle}>STAY IN THE LOOP</Text>
      <Text style={styles.stepSubtitle}>
        Get flash deals, crowd alerts, and crawl updates
      </Text>
      <Text style={styles.bellEmoji}>🔔</Text>
      <Button
        label="Enable Notifications"
        variant="primary"
        size="full"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Placeholder — real permission request goes here
          onNotifGranted(true);
        }}
      />
      <TouchableOpacity
        style={styles.maybeLater}
        onPress={() => {
          Haptics.selectionAsync();
          onNotifGranted(false);
        }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.maybeLaterText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen(): React.ReactElement {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  const isNextDisabled =
    (step === 1 && name.trim().length === 0) ||
    (step === 3 && !ageConfirmed);

  const handleNext = useCallback(async () => {
    if (step < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        await onboardUser({
          displayName: name,
          homeNeighborhood: neighborhood,
          ageVerified: ageConfirmed,
        });
      } catch (e) {
        // non-blocking — navigate anyway if onboard fails
        console.warn('[onboarding] Failed to save:', e);
      }
      router.replace('/(tabs)/');
    }
  }, [step, name, neighborhood, ageConfirmed]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      Haptics.selectionAsync();
      setStep((s) => s - 1);
    }
  }, [step]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        <View style={styles.progressWrapper}>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </View>

        {/* Step content */}
        <View style={{ flex: 1 }}>
          {step === 1 && (
            <Step1 name={name} onNameChange={setName} />
          )}
          {step === 2 && (
            <Step2
              neighborhood={neighborhood}
              onNeighborhoodChange={setNeighborhood}
            />
          )}
          {step === 3 && (
            <Step3
              ageConfirmed={ageConfirmed}
              onAgeConfirmedChange={setAgeConfirmed}
            />
          )}
          {step === 4 && (
            <Step4
              notifGranted={notifGranted}
              onNotifGranted={setNotifGranted}
            />
          )}
        </View>

        {/* Navigation */}
        <View style={styles.navContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.nextBtnWrapper}>
            <Button
              label={step === TOTAL_STEPS ? 'FINISH →' : 'NEXT →'}
              variant="primary"
              size="full"
              disabled={isNextDisabled}
              onPress={handleNext}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Progress bar
  progressWrapper: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },

  // Step content
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  stepContentCentered: {
    alignItems: 'center',
  },
  stepTitle: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  stepSubtitle: {
    fontFamily: Fonts.bodyLight,
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },

  // Text input
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    fontFamily: Fonts.body,
    fontSize: 18,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 32,
    minHeight: 56,
  },
  textInputFocused: {
    borderColor: 'rgba(255,107,53,0.3)',
  },

  // Neighborhood pills
  neighborhoodScroll: {
    marginTop: 24,
  },
  neighborhoodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  neighborhoodPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  neighborhoodPillSelected: {
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderColor: 'rgba(255,107,53,0.6)',
  },
  neighborhoodText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  neighborhoodTextSelected: {
    color: Colors.primary,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    minHeight: 44,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textPrimary,
    marginLeft: 12,
  },

  // DOB
  dobLabel: {
    fontFamily: Fonts.bodyLight,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 24,
  },
  dobRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 0,
  },
  dobInput: {
    flex: 1,
    marginTop: 8,
    textAlign: 'center',
  },

  // Step 4 notification
  bellEmoji: {
    fontSize: 64,
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
  },
  maybeLater: {
    marginTop: 16,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maybeLaterText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textMuted,
  },

  // Navigation
  navContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    bottom: 40,
    zIndex: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textMuted,
  },
  nextBtnWrapper: {
    width: '100%',
  },
});
