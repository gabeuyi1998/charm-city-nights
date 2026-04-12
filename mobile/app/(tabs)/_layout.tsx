import { View, StyleSheet, Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function CameraTabButton({ style }: { style?: object }) {
  return (
    <Pressable
      style={style}
      onPress={() => router.push('/camera')}
      accessibilityLabel="Camera"
    >
      <View style={styles.cameraButtonWrapper}>
        <View style={styles.cameraButton}>
          <Ionicons name="camera" size={26} color="#FFFFFF" />
        </View>
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: '#0A0A0F',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 83,
          paddingBottom: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? 'home' : 'home-outline') as IoniconsName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? 'location' : 'location-outline') as IoniconsName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          tabBarButton: ({ style }) => <CameraTabButton style={style as object} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? 'trophy' : 'trophy-outline') as IoniconsName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="crawls"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={(focused ? 'map' : 'map-outline') as IoniconsName}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={
                (focused
                  ? 'person-circle'
                  : 'person-circle-outline') as IoniconsName
              }
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cameraButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
});
