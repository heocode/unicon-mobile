import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  WelcomingIllustrationAdapter,
  type WelcomingIllustrationHandle,
} from '../animation/WelcomingIllustrationAdapter';
import type {
  WelcomingIndex,
  WelcomingSlideConfig,
} from '../types/welcoming.types';

type Props = {
  height: number;
  index: WelcomingIndex;
  onFailure: (error: Error) => void;
  registerIllustration: (
    index: WelcomingIndex,
    handle: WelcomingIllustrationHandle | null,
  ) => void;
  slide: WelcomingSlideConfig;
  width: number;
};

export function WelcomingIllustration({
  height,
  index,
  onFailure,
  registerIllustration,
  slide,
  width,
}: Props) {
  const register = useCallback(
    (handle: WelcomingIllustrationHandle | null) => {
      registerIllustration(index, handle);
    },
    [index, registerIllustration],
  );

  return (
    <View style={[styles.viewport, { height, width }]}>
      <WelcomingIllustrationAdapter
        accessibilityLabel={slide.accessibilityLabel}
        key={slide.id}
        onFailure={onFailure}
        ref={register}
        source={slide.riveSource}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    alignSelf: 'center',
  },
});
