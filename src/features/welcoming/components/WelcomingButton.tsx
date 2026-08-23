import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme/tokens';

type Props = {
  onPress: () => void;
  width: number;
};

export function WelcomingButton({ onPress, width }: Props) {
  return (
    <Pressable
      accessibilityHint="Continues to authentication when it becomes available"
      accessibilityLabel="Get Started"
      accessibilityRole="button"
      className="h-14 items-center justify-center rounded-[39px] border border-white/10 bg-primary active:opacity-90"
      onPress={onPress}
      style={[styles.shadow, { width }]}
    >
      <Text className="font-semibold text-lg leading-[22px] text-on-primary">
        Get Started
      </Text>
    </Pressable>
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
});
