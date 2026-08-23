import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function useWelcomingLayout() {
  const { height, width } = useWindowDimensions();

  return useMemo(() => {
    const compact = height < 740;
    const illustrationHeight = clamp(height * 0.43, 310, 380);
    const topSpacing = clamp(height * 0.015, 8, 16);
    const copyTop = clamp(height * 0.4, 320, 370);
    const paginationOffset = compact ? 100 : 109;

    return {
      compact,
      pageWidth: width,
      illustrationWidth: clamp(width, 320, 460),
      illustrationHeight,
      topSpacing,
      copyTop,
      paginationTop: copyTop + paginationOffset,
      buttonWidth: clamp(width - 36, 280, 430),
    };
  }, [height, width]);
}
