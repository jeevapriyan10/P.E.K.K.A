import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';

export default function WorkoutPlannerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>7-Day Planner Placeholder</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.dark.text, fontSize: 18 }
});
