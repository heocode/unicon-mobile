import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

import { useWelcomingOrchestrator } from '../animation/useWelcomingOrchestrator';
import { WelcomingButton } from '../components/WelcomingButton';
import { WelcomingCarousel } from '../components/WelcomingCarousel';
import { WelcomingIllustration } from '../components/WelcomingIllustration';
import { WelcomingPagination } from '../components/WelcomingPagination';
import { welcomingSlides } from '../config/welcomingSlides';
import { useWelcomingLayout } from '../hooks/useWelcomingLayout';
import type { WelcomingIndex } from '../types/welcoming.types';

export function WelcomingScreen() {
  const [committedIndex, setCommittedIndex] = useState<WelcomingIndex>(0);
  const reducedMotionPreference = useReducedMotion();
  const reducedMotion = reducedMotionPreference !== false;
  const insets = useSafeAreaInsets();
  const layout = useWelcomingLayout();
  const {
    error,
    illustrationIndex,
    handleIllustrationFailure,
    registerIllustration,
    requestTransition,
  } = useWelcomingOrchestrator(reducedMotion);

  useEffect(() => {
    if (error) {
      console.error('[Welcoming] Rive orchestration failed:', error.message);
    }
  }, [error]);

  const handleCommitIndex = useCallback(
    (index: WelcomingIndex) => {
      setCommittedIndex(index);
      requestTransition(index);
    },
    [requestTransition],
  );

  const handleGetStarted = () => {
    console.info('[Welcoming] Authentication route is not implemented yet.');
  };

  const illustrationSlide = welcomingSlides[illustrationIndex];
  const buttonBottom = Math.max(insets.bottom, 24);

  return (
    <View className="flex-1 bg-background">
      <WelcomingCarousel
        committedIndex={committedIndex}
        contentTop={layout.copyTop}
        onCommitIndex={handleCommitIndex}
        slides={welcomingSlides}
        width={layout.pageWidth}
      />

      <View
        pointerEvents="none"
        style={{
          height: layout.illustrationHeight,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: layout.topSpacing,
        }}
      >
        {!reducedMotion && !error ? (
          <WelcomingIllustration
            height={layout.illustrationHeight}
            index={illustrationIndex}
            onFailure={handleIllustrationFailure}
            registerIllustration={registerIllustration}
            slide={illustrationSlide}
            width={layout.illustrationWidth}
          />
        ) : null}
      </View>

      <View
        className="items-center"
        pointerEvents="none"
        style={{
          left: 0,
          position: 'absolute',
          right: 0,
          top: layout.paginationTop,
        }}
      >
        <WelcomingPagination
          activeIndex={committedIndex}
          count={welcomingSlides.length}
        />
      </View>

      <View
        className="absolute left-0 right-0 items-center"
        style={{ bottom: buttonBottom }}
      >
        <WelcomingButton
          onPress={handleGetStarted}
          reducedMotion={reducedMotion}
          width={layout.buttonWidth}
        />
      </View>
    </View>
  );
}
