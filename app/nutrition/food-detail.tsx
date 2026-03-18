// filepath: app/nutrition/food-detail.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useNutritionStore } from '../../src/store/nutritionStore';
import { addFoodEntry } from '../../src/db/nutritionDb';

export default function FoodDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { date, selectedMealRange } = useNutritionStore(s => ({ date: s.currentDate, selectedMealRange: s.selectedMealRange }));
  
  const [gramsStr, setGramsStr] = useState('100');
  const [mealType, setMealType] = useState(selectedMealRange);

  const grams = parseFloat(gramsStr) || 0;
  
  const cal100 = parseFloat(params.calories as string) || 0;
  const p100 = parseFloat(params.protein as string) || 0;
  const c100 = parseFloat(params.carbs as string) || 0;
  const f100 = parseFloat(params.fat as string) || 0;
  const fib100 = parseFloat(params.fiber as string) || 0;

  const ratio = grams / 100;
  
  const totals = {
    cals: Math.round(cal100 * ratio),
    p: Math.round(p100 * ratio * 10) / 10,
    c: Math.round(c100 * ratio * 10) / 10,
    f: Math.round(f100 * ratio * 10) / 10,
    fib: Math.round(fib100 * ratio * 10) / 10,
  };

  const handleSave = async () => {
    if (grams <= 0) return;
    await addFoodEntry({
      date,
      meal_type: mealType,
      food_name: params.name as string,
      grams,
      calories: totals.cals,
      protein: totals.p,
      carbs: totals.c,
      fat: totals.f,
      fiber: totals.fib
    });
    router.replace('/(tabs)/log');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Add Food</Text>
        <View style={{width: 50}}/>
      </View>

      <View style={styles.content}>
        <Text style={styles.foodName}>{params.name}</Text>
        
        <View style={styles.mealSelector}>
          {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => (
            <TouchableOpacity key={m} style={[styles.mealBtn, mealType === m && styles.mealBtnActive]} onPress={() => setMealType(m)}>
              <Text style={[styles.mealText, mealType === m && styles.mealTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Portion Size (grams)</Text>
          <View style={styles.inputRow}>
            <TextInput
               style={styles.input}
               keyboardType="numeric"
               value={gramsStr}
               onChangeText={setGramsStr}
               maxLength={4}
            />
            <Text style={styles.inputSuffix}>g</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{totals.cals} kcal</Text>
          <View style={styles.macros}>
             <View style={styles.macroCol}><Text style={[styles.mVal, {color: Colors.dark.violet}]}>{totals.p}g</Text><Text style={styles.mLabel}>Protein</Text></View>
             <View style={styles.macroCol}><Text style={[styles.mVal, {color: Colors.dark.lime}]}>{totals.c}g</Text><Text style={styles.mLabel}>Carbs</Text></View>
             <View style={styles.macroCol}><Text style={[styles.mVal, {color: Colors.dark.rose}]}>{totals.f}g</Text><Text style={styles.mLabel}>Fat</Text></View>
          </View>
        </View>

        <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
          <Text style={styles.btnSaveText}>Add to {mealType}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  foodName: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 20, textTransform: 'capitalize' },
  mealSelector: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  mealBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: Colors.dark.bg2, borderWidth: 1, borderColor: Colors.dark.border },
  mealBtnActive: { backgroundColor: Colors.dark.limebg, borderColor: Colors.dark.lime },
  mealText: { color: Colors.dark.dim, fontWeight: 'bold' },
  mealTextActive: { color: Colors.dark.lime },
  inputGroup: { marginBottom: 24 },
  label: { color: Colors.dark.text, marginBottom: 8, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: Colors.dark.bg2, borderColor: Colors.dark.border, borderWidth: 1, padding: 16, borderRadius: 12, color: Colors.dark.text, fontSize: 20 },
  inputSuffix: { position: 'absolute', right: 20, color: Colors.dark.muted, fontSize: 20 },
  summaryCard: { backgroundColor: Colors.dark.bg2, padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  summaryTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 16 },
  macros: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  macroCol: { alignItems: 'center' },
  mVal: { fontSize: 20, fontWeight: 'bold' },
  mLabel: { fontSize: 12, color: Colors.dark.muted, marginTop: 4 },
  btnSave: { backgroundColor: Colors.dark.lime, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnSaveText: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 18 }
});
