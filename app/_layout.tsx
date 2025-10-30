import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import DatabaseService from '../services/DatabaseService';

import { UserProvider } from '@/context/user-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Make login the initial route
  initialRouteName: 'login',
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useEffect(() => {
    const initDatabase = async() => {
      try {
        await DatabaseService.init();
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    }

    initDatabase();
  }, []);

  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}
