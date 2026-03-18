import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { View, Text } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.dark.bg,
          borderTopColor: Colors.dark.border,
        },
        tabBarActiveTintColor: Colors.dark.lime,
        tabBarInactiveTintColor: Colors.dark.dim,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: 'Dash', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} /> }} />
      <Tabs.Screen name="log" options={{ tabBarLabel: 'Log', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text" size={24} color={color} /> }} />
      <Tabs.Screen name="workout" options={{ tabBarLabel: 'Workout', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="weight-lifter" size={24} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ tabBarLabel: 'Progress', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-line" size={24} color={color} /> }} />
      <Tabs.Screen name="social" options={{ tabBarLabel: 'Social', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={24} color={color} /> }} />
    </Tabs>
  );
}
