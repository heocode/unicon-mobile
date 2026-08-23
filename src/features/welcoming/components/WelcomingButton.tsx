import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@/theme/tokens';

type Props = {
  onPress: () => void;
  reducedMotion: boolean;
  width: number;
};

const SHIMMER_WIDTH = 104;
const SHIMMER_DURATION = 1400;
const SHIMMER_PAUSE = 3400;

export function WelcomingButton({ onPress, reducedMotion, width }: Props) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(shimmerProgress);
    shimmerProgress.value = 0;

    if (!reducedMotion) {
      shimmerProgress.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: SHIMMER_DURATION,
            easing: Easing.inOut(Easing.cubic),
          }),
          withDelay(SHIMMER_PAUSE, withTiming(0, { duration: 0 })),
        ),
        -1,
      );
    }

    return () => cancelAnimation(shimmerProgress);
  }, [reducedMotion, shimmerProgress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -SHIMMER_WIDTH + shimmerProgress.value * (width + SHIMMER_WIDTH),
      },
      { rotateZ: '-16deg' },
    ],
  }));

  return (
    <View style={[styles.shadow, { width }]}>
      <Pressable
        accessibilityHint="Continues to authentication when it becomes available"
        accessibilityLabel="Get Started"
        accessibilityRole="button"
        className="h-14 overflow-hidden rounded-[39px] border border-white/10 bg-primary active:opacity-90"
        onPress={onPress}
      >
        {!reducedMotion ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.shimmer, shimmerStyle]}
          >
            <LinearGradient
              colors={[
                'rgba(255,255,255,0)',
                'rgba(255,255,255,0.16)',
                'rgba(255,255,255,0)',
              ]}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        ) : null}

        <View className="absolute inset-0 items-center justify-center">
          <Text className="font-semibold text-lg leading-[22px] text-on-primary">
            Get Started
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: theme.colors.foreground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  shimmer: {
    bottom: -28,
    position: 'absolute',
    top: -28,
    width: SHIMMER_WIDTH,
  },
  shimmerGradient: {
    flex: 1,
  },
});
