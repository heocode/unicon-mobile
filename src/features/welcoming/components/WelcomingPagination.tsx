import { View } from 'react-native';

import type { WelcomingIndex } from '../types/welcoming.types';

type Props = {
  activeIndex: WelcomingIndex;
  count: number;
};

export function WelcomingPagination({ activeIndex, count }: Props) {
  return (
    <View
      accessibilityElementsHidden
      className="h-[9px] w-[84px] flex-row items-center justify-between"
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          className={`h-[9px] w-[9px] rounded-full ${
            index === activeIndex
              ? 'bg-pagination-active'
              : 'bg-pagination-inactive'
          }`}
          key={index}
        />
      ))}
    </View>
  );
}
