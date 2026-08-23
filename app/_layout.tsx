import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import { LaunchGate } from '@/features/launch/components/LaunchGate';
import { theme } from '@/theme/tokens';

SplashScreen.setOptions({ duration: 0, fade: false });
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <LaunchGate>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.background },
            headerShown: false,
          }}
        />
      </LaunchGate>
    </SafeAreaProvider>
  );
}
