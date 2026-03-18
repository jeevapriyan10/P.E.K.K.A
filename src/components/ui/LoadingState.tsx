// filepath: src/components/ui/LoadingState.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Colors } from '../../constants/colors';

export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.dark.lime} />
      <Text style={{ marginTop: 16, color: Colors.dark.muted, fontSize: 16 }}>{message}</Text>
    </View>
  );
}
