import '../global.css';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NetworkBanner } from '../components/ui/NetworkBanner';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { BASE_URL } from '../lib/api';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'b2e00942-738b-47bc-b461-76fd6110fa09',
  });

  const jwt = await SecureStore.getItemAsync('jwt');
  if (!jwt) return;

  await fetch(`${BASE_URL}/users/push-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ token: token.data, platform: Platform.OS }),
  }).catch(() => {});
}

export default function RootLayout() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [fontsLoaded] = useFonts({
    // Manrope — Stitch design system spec
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    // Legacy fonts — kept for backward compat
    BebasNeue_400Regular,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Check for stored session on launch
  useEffect(() => {
    SecureStore.getItemAsync('jwt').then((token) => {
      setSessionChecked(true);
      if (token) {
        router.replace('/(tabs)/');
        registerPushToken();
      } else {
        router.replace('/(auth)/');
      }
    }).catch(() => {
      setSessionChecked(true);
      router.replace('/(auth)/');
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded && sessionChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, sessionChecked]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NetworkBanner />
      <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="bar/[id]"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="camera"
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="story-viewer" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="dms/[userId]" />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="leaderboard" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style="light" />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
