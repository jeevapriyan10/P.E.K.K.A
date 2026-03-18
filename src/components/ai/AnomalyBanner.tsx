// filepath: src/components/ai/AnomalyBanner.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAnomalies } from '../../hooks/useAnomalies';

export default function AnomalyBanner() {
  const { anomaly, dismiss } = useAnomalies();

  if (!anomaly) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#FACC15" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>AI Insight</Text>
          <Text style={styles.message}>{anomaly}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={dismiss}>
        <MaterialCommunityIcons name="close" size={20} color={Colors.dark.muted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginHorizontal: 20, 
    marginVertical: 10, 
    backgroundColor: '#1C1917', 
    borderRadius: 20, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#FACC15'
  },
  content: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  textContainer: { flex: 1 },
  title: { color: '#FACC15', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  message: { color: '#FFF', fontSize: 14, marginTop: 2, lineHeight: 20 }
});
