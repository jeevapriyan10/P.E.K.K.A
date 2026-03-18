// filepath: app/_layout.tsx
import "../global.css";
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseProvider } from '../src/providers/DatabaseProvider';
import { AchievementProvider } from '../src/providers/AchievementProvider';
import { StorageKeys } from '../src/constants/storageKeys';
import LoadingState from '../src/components/ui/LoadingState';
import { notificationService } from '../src/services/notificationService';

export default function RootLayout() {
  const [isChecked, setIsChecked] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function checkAuth() {
      try {
        const val = await AsyncStorage.getItem(StorageKeys.ONBOARDING_COMPLETE);
        setIsOnboarded(val === '1');
        
        // Request notification permissions on first launch
        await notificationService.requestPermissions();
        
      } catch (err) {
        setIsOnboarded(false);
      } finally {
        setIsChecked(true);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isChecked) return;
    if (isOnboarded) {
        setTimeout(() => router.replace('/(tabs)'), 0);
    } else {
        setTimeout(() => router.replace('/onboarding'), 0);
    }
  }, [isChecked, isOnboarded]);

  if (!isChecked) {
    return <LoadingState message="Initializing..." />;
  }

  return (
    <DatabaseProvider>
      <AchievementProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AchievementProvider>
    </DatabaseProvider>
  );
}
