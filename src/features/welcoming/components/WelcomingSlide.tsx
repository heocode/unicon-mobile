import { Text, View } from 'react-native';

import type { WelcomingSlideConfig } from '../types/welcoming.types';

type Props = {
  contentTop: number;
  slide: WelcomingSlideConfig;
  width: number;
};

export function WelcomingSlide({ contentTop, slide, width }: Props) {
  return (
    <View
      accessibilityLabel={`${slide.title}. ${slide.subtitle
        .map((segment) => segment.text)
        .join('')}`}
      className="items-center justify-start px-6"
      style={{ paddingTop: contentTop, width }}
    >
      <Text className="font-semibold text-[32px] leading-[41px] text-foreground">
        {slide.title}
      </Text>
      <Text className="mt-1.5 text-center font-medium text-base leading-[19px] text-foreground">
        {slide.subtitle.map((segment, index) => (
          <Text
            className={segment.emphasized ? 'font-semibold' : 'font-medium'}
            key={`${slide.id}-${index}`}
          >
            {segment.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}
