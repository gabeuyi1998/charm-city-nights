import { View } from 'react-native';

// Navigation is handled by tabBarButton in (tabs)/_layout.tsx —
// this screen is never rendered but must exist as a valid route file.
export default function CameraTab() {
  return <View style={{ flex: 1, backgroundColor: '#0e0e0e' }} />;
}
