// filepath: src/components/nutrition/WaterTracker.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  currentMl: number;
  goalMl: number;
  onAdd: (amount: number) => void;
}

export default function WaterTracker({ currentMl, goalMl, onAdd }: Props) {
  const progress = Math.min(1, currentMl / Math.max(1, goalMl)) * 100;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water</Text>
        <Text style={styles.subtitle}>{currentMl} / {goalMl} ml</Text>
      </View>
      
      {/* Simple horizontal progress bar instead of Arc to save SVG complexity if not needed heavily */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={() => onAdd(250)}>
          <Text style={styles.btnText}>+ 250ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onAdd(500)}>
          <Text style={styles.btnText}>+ 500ml</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnAlert} onPress={() => onAdd(-currentMl)}>
          <Text style={styles.btnAlertText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  subtitle: { color: Colors.dark.sky, fontSize: 14, fontWeight: '600' },
  barBg: { height: 8, backgroundColor: Colors.dark.bg4, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.dark.cyan },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, backgroundColor: Colors.dark.bg3, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: Colors.dark.sky, fontWeight: 'bold' },
  btnAlert: { padding: 12 },
  btnAlertText: { color: Colors.dark.muted }
});
