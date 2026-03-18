// filepath: src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification handler (when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PERMISSION_KEY = 'notification_permission_granted';

export const notificationService = {
  async initNotificationChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('pekka_main', {
        name: 'P.E.K.K.A Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5EEAD4',
        sound: 'default',
        enableVibrate: true,
      });
    }
  },

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    const granted = finalStatus === 'granted';
    await AsyncStorage.setItem(PERMISSION_KEY, granted ? 'true' : 'false');
    
    if (granted) {
      await this.initNotificationChannel();
    }
    return granted;
  },

  async getPermissionStatus() {
    const stored = await AsyncStorage.getItem(PERMISSION_KEY);
    return stored === 'true';
  },

  async scheduleMealReminder(mealType: string, time: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${mealType}!`,
        body: `Don't forget to log your ${mealType.toLowerCase()} to stay on track.`,
        sound: 'default',
        data: { screen: 'log' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });
  },

  async scheduleWorkoutReminder(time: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to crush it!",
        body: "Your scheduled workout time is here. Let's make progress today.",
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });
  },

  async scheduleWaterReminder() {
    // Every 2.5 hours between 8am-9pm
    const times = [
      { h: 8, m: 0 },
      { h: 10, m: 30 },
      { h: 13, m: 0 },
      { h: 15, m: 30 },
      { h: 18, m: 0 },
      { h: 20, m: 30 }
    ];

    for (const t of times) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Stay Hydrated!",
          body: "It's time for a glass of water. Keep those cells happy.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: t.h,
          minute: t.m,
          repeats: true,
        },
      });
    }
  },

  async scheduleWeeklyReport() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your Weekly Fitness Report is Ready!",
        body: "See how you performed this week and get your AI-generated grade.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: 1, // Sunday
        hour: 8,
        minute: 0,
        repeats: true,
      },
    });
  },

  async sendAchievementNotification(name: string) {
     await Notifications.scheduleNotificationAsync({
      content: {
        title: "Achievement Unlocked!",
        body: `Congratulations! You've earned the ${name} badge!`,
      },
      trigger: null, // Send immediately
    });
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};
