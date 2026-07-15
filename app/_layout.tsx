import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { hydrateThoughts } from '@/lib/doodle-store';

export const unstable_settings = {
  anchor: 'index',
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void hydrateThoughts();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="new-thought"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="doodle" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen
          name="thought/[id]"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
