import { useCallback, useEffect, useRef } from 'react';
import {
  type AccessibilityActionEvent,
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
} from 'react-native';

import { WelcomingSlide } from './WelcomingSlide';
import type {
  WelcomingIndex,
  WelcomingSlideConfig,
} from '../types/welcoming.types';

type Props = {
  committedIndex: WelcomingIndex;
  contentTop: number;
  onCommitIndex: (index: WelcomingIndex) => void;
  slides: readonly WelcomingSlideConfig[];
  width: number;
};

export function WelcomingCarousel({
  committedIndex,
  contentTop,
  onCommitIndex,
  slides,
  width,
}: Props) {
  const listRef = useRef<FlatList<WelcomingSlideConfig>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({
      animated: false,
      offset: committedIndex * width,
    });
  }, [committedIndex, width]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<WelcomingSlideConfig>) => (
      <WelcomingSlide contentTop={contentTop} slide={item} width={width} />
    ),
    [contentTop, width],
  );

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.max(
      0,
      Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)),
    ) as WelcomingIndex;

    if (nextIndex !== committedIndex) onCommitIndex(nextIndex);
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    const delta = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    const nextIndex = Math.max(
      0,
      Math.min(slides.length - 1, committedIndex + delta),
    ) as WelcomingIndex;

    if (nextIndex !== committedIndex) onCommitIndex(nextIndex);
  };

  return (
    <FlatList
      accessibilityRole="adjustable"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      accessibilityLabel="Welcoming pages"
      accessibilityValue={{
        max: slides.length,
        min: 1,
        now: committedIndex + 1,
        text: `${committedIndex + 1} of ${slides.length}`,
      }}
      bounces={false}
      data={slides as readonly WelcomingSlideConfig[]}
      decelerationRate="fast"
      directionalLockEnabled
      getItemLayout={(_, index) => ({ index, length: width, offset: width * index })}
      horizontal
      initialScrollIndex={committedIndex}
      keyExtractor={(item) => item.id}
      onAccessibilityAction={handleAccessibilityAction}
      onMomentumScrollEnd={handleMomentumEnd}
      pagingEnabled
      ref={listRef}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      style={StyleSheet.absoluteFill}
    />
  );
}
