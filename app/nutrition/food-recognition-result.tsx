// filepath: app/nutrition/food-recognition-result.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { DetectedFoodItem } from '../../src/services/geminiService';
import DetectedFoodCard from '../../src/components/nutrition/DetectedFoodCard';
import { useNutritionStore } from '../../src/store/nutritionStore';
import { addFoodEntry } from '../../src/db/nutritionDb';

export default function FoodRecognitionResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { date, selectedMealRange } = useNutritionStore(s => ({ date: s.currentDate, selectedMealRange: s.selectedMealRange }));
  
  let initialData: DetectedFoodItem[] = [];
  try {
    if (params.results) initialData = JSON.parse(params.results as string);
  } catch (e) {}

  const [items, setItems] = useState<DetectedFoodItem[]>(initialData);

  const confirmSingle = async (item: DetectedFoodItem, grams: number) => {
    const ratio = grams / 100;
    await addFoodEntry({
      date,
      meal_type: selectedMealRange,
      food_name: item.name,
      grams,
      calories: Math.round(item.calories_per_100g * ratio),
      protein: Math.round(item.protein_per_100g * ratio),
      carbs: Math.round(item.carbs_per_100g * ratio),
      fat: Math.round(item.fat_per_100g * ratio),
      fiber: Math.round(item.fiber_per_100g * ratio)
    });

    const newItems = items.filter(i => i.name !== item.name);
    if (newItems.length === 0) {
      router.replace('/(tabs)/log');
    } else {
      setItems(newItems);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/log')}><Text style={styles.backBtn}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>AI Results</Text>
        <View style={{width: 50}}/>
      </View>

      <ScrollView style={styles.scroll}>
        {items.length === 0 && (
           <Text style={styles.empty}>No food items detected.</Text>
        )}
        
        {items.map((item, idx) => (
          <DetectedFoodCard 
            key={`${item.name}-${idx}`} 
            item={item} 
            onConfirm={confirmSingle} 
          />
        ))}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 16 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }
});
