// filepath: src/components/nutrition/DetectedFoodCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import { Colors } from '../../constants/colors';
import { DetectedFoodItem } from '../../services/geminiService';

interface Props {
  item: DetectedFoodItem;
  onConfirm: (item: DetectedFoodItem, grams: number) => void;
}

export default function DetectedFoodCard({ item, onConfirm }: Props) {
  const [grams, setGrams] = useState(item.estimated_grams);
  
  const increment = (amt: number) => setGrams(g => Math.max(1, g + amt));

  const ratio = grams / 100;
  const cals = Math.round(item.calories_per_100g * ratio);
  const p = Math.round(item.protein_per_100g * ratio);
  const c = Math.round(item.carbs_per_100g * ratio);
  const f = Math.round(item.fat_per_100g * ratio);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      
      <View style={styles.macroRow}>
        <Text style={styles.cals}>{cals} kcal</Text>
        <Text style={[styles.macro, {color: Colors.dark.violet}]}>{p}g P</Text>
        <Text style={[styles.macro, {color: Colors.dark.lime}]}>{c}g C</Text>
        <Text style={[styles.macro, {color: Colors.dark.rose}]}>{f}g F</Text>
      </View>

      <Text style={styles.sliderLabel}>Portion: {grams}g</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btnSm} onPress={() => increment(-50)}><Text style={styles.btnTextSm}>-50</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnSm} onPress={() => increment(-10)}><Text style={styles.btnTextSm}>-10</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnSm} onPress={() => increment(10)}><Text style={styles.btnTextSm}>+10</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnSm} onPress={() => increment(50)}><Text style={styles.btnTextSm}>+50</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => onConfirm(item, grams)}>
        <Text style={styles.btnPrimaryText}>Add to Diary</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.dark.bg2, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.border },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 8, textTransform: 'capitalize' },
  macroRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cals: { color: Colors.dark.text, fontWeight: 'bold' },
  macro: { fontWeight: 'bold' },
  sliderLabel: { color: Colors.dark.dim, fontSize: 14, marginBottom: 8, textAlign: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  btnSm: { backgroundColor: Colors.dark.bg3, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnTextSm: { color: Colors.dark.text, fontWeight: 'bold' },
  btnPrimary: { backgroundColor: Colors.dark.lime, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimaryText: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 }
});
