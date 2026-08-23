import * as SplashScreen from 'expo-splash-screen';
import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { theme } from '@/theme/tokens';

import { LaunchAnimation } from './LaunchAnimation';

const LAUNCH_TIMEOUT_MS = 5_000;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function LaunchGate({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const hasHiddenNativeSplashRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const viewportSize = clamp(width * 0.62, 220, 300);

  const hideNativeSplash = useCallback(() => {
    if (!hasHiddenNativeSplashRef.current) {
      hasHiddenNativeSplashRef.current = true;
      SplashScreen.hide();
    }
  }, []);

  const clearLaunchTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (animated: boolean) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;
      clearLaunchTimeout();

      if (!animated) {
        opacity.setValue(0);
        setVisible(false);
        return;
      }

      Animated.timing(opacity, {
        duration: 240,
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    },
    [clearLaunchTimeout, opacity],
  );

  const handleComplete = useCallback(() => finish(true), [finish]);

  const handleFailure = useCallback(
    (_error: Error) => {
      hideNativeSplash();
      finish(false);
    },
    [finish, hideNativeSplash],
  );

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      hideNativeSplash();
      finish(false);
    }, LAUNCH_TIMEOUT_MS);

    return clearLaunchTimeout;
  }, [clearLaunchTimeout, finish, hideNativeSplash]);

  useEffect(() => {
    if (reducedMotion === true) {
      hideNativeSplash();
      finish(false);
    }
  }, [finish, hideNativeSplash, reducedMotion]);

  return (
    <View style={styles.root}>
      {children}

      {visible ? (
        <Animated.View style={[styles.overlay, { opacity }]}>
          {reducedMotion === false ? (
            <View style={{ height: viewportSize, width: viewportSize }}>
              <LaunchAnimation
                onComplete={handleComplete}
                onFailure={handleFailure}
                onReady={hideNativeSplash}
              />
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  root: {
    flex: 1,
  },
});
