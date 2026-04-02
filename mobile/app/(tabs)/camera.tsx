import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function CameraTab() {
  useEffect(() => {
    router.push('/camera');
  }, []);
  // Return dark view so there's no white flash while the modal loads
  return <View style={{ flex: 1, backgroundColor: '#0e0e0e' }} />;
}
