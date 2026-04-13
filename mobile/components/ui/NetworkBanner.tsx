import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Fonts } from '../../constants/theme';

const BANNER_HEIGHT = 32;
const BACK_ONLINE_DURATION_MS = 2000;

export function NetworkBanner(): React.ReactElement {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const backOnlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;

      if (!connected) {
        setIsOffline(true);
        setShowBackOnline(false);
        if (backOnlineTimer.current) clearTimeout(backOnlineTimer.current);
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else if (isOffline) {
        setIsOffline(false);
        setShowBackOnline(true);
        backOnlineTimer.current = setTimeout(() => {
          Animated.timing(translateY, {
            toValue: -BANNER_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => setShowBackOnline(false));
        }, BACK_ONLINE_DURATION_MS);
      }
    });

    return () => {
      unsubscribe();
      if (backOnlineTimer.current) clearTimeout(backOnlineTimer.current);
    };
  }, [isOffline, translateY]);

  if (!isOffline && !showBackOnline) {
    return <></>;
  }

  const backgroundColor = showBackOnline && !isOffline ? '#00C9A7' : '#93000A';
  const label = showBackOnline && !isOffline ? 'Back online' : 'No connection';

  return (
    <Animated.View style={[styles.banner, { backgroundColor, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: BANNER_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  text: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
