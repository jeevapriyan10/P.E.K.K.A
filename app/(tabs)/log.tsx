// filepath: app/(tabs)/log.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { Colors } from '../../src/constants/colors';
import { useNutritionStore } from '../../src/store/nutritionStore';
import { getFoodEntries, getWaterLog, updateWaterLog, deleteFoodEntry, seedCommonFoods } from '../../src/db/nutritionDb';
import { calculateTDEE } from '../../src/utils/tdeeCalculator';
import FoodEntryCard from '../../src/components/nutrition/FoodEntryCard';
import WaterTracker from '../../src/components/nutrition/WaterTracker';
import MacroPieChart from '../../src/components/nutrition/MacroPieChart';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function NutritionDashboard() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const currentDate = useNutritionStore(s => s.currentDate);
  const setCurrentDate = useNutritionStore(s => s.setCurrentDate);
  const setSelectedMealRange = useNutritionStore(s => s.setSelectedMealRange);

  const [tdee, setTdee] = useState({ calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 });
  const [entries, setEntries] = useState<any[]>([]);
  const [water, setWater] = useState(0);

  const loadDashboard = async () => {
    if (!db || !isReady) return;
    try {
      await seedCommonFoods();
      
      const userResult: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      if (userResult) {
        setTdee(calculateTDEE(userResult));
      }

      const foodItems = await getFoodEntries(currentDate);
      setEntries(foodItems);

      const w = await getWaterLog(currentDate);
      setWater(w);
      
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(useCallback(() => { loadDashboard(); }, [isReady, currentDate]));

  const addWater = async (amount: number) => {
    const newW = water + amount;
    setWater(newW);
    await updateWaterLog(currentDate, newW);
  };

  const removeEntry = async (id: number) => {
    await deleteFoodEntry(id);
    loadDashboard();
  };

  const navToSearch = (mealType: string) => {
    setSelectedMealRange(mealType);
    router.push('/nutrition/food-search');
  };

  // Summaries
  const consumed = {
    cals: entries.reduce((s, e) => s + e.calories, 0),
    p: entries.reduce((s, e) => s + e.protein, 0),
    c: entries.reduce((s, e) => s + e.carbs, 0),
    f: entries.reduce((s, e) => s + e.fat, 0)
  };

  const renderMealSection = (title: string) => {
    const sectionEntries = entries.filter((e) => e.meal_type === title);
    const sCals = sectionEntries.reduce((s, e) => s + e.calories, 0);

    return (
      <View key={title} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{Math.round(sCals)} kcal</Text>
        </View>
        <View style={styles.sectionBody}>
          {sectionEntries.map(e => (
            <FoodEntryCard key={e.id} entry={e} onDelete={removeEntry} />
          ))}
          <TouchableOpacity style={styles.btnAddFood} onPress={() => navToSearch(title)}>
            <Text style={styles.btnAddFoodText}>+ Add Food</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerDate}>{currentDate}</Text>
        <TouchableOpacity onPress={() => router.push('/nutrition/food-camera')} style={styles.cameraBtn}>
           <MaterialCommunityIcons name="camera" size={20} color={Colors.dark.lime} style={{marginRight: 6}} />
           <Text style={styles.cameraBtnText}>AI Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Macro Summary */}
        <View style={styles.summaryCard}>
          <MacroPieChart protein={consumed.p} carbs={consumed.c} fat={consumed.f} />
          <View style={styles.summaryStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statValue}>{Math.round(consumed.cals)} / {tdee.calories}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, {color: Colors.dark.violet}]}>Protein</Text>
              <Text style={styles.statValue}>{Math.round(consumed.p)} / {tdee.protein_g}g</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, {color: Colors.dark.lime}]}>Carbs</Text>
              <Text style={styles.statValue}>{Math.round(consumed.c)} / {tdee.carbs_g}g</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, {color: Colors.dark.rose}]}>Fat</Text>
              <Text style={styles.statValue}>{Math.round(consumed.f)} / {tdee.fat_g}g</Text>
            </View>
          </View>
        </View>

        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(renderMealSection)}

        <TouchableOpacity style={styles.supCard} onPress={() => router.push('/nutrition/supplements' as any)}>
           <View style={styles.supContent}>
              <MaterialCommunityIcons name="pill" size={24} color={Colors.dark.cyan} />
              <View style={{marginLeft: 12}}>
                 <Text style={styles.supTitle}>Supplement Log</Text>
                 <Text style={styles.supSub}>Track vitamins, creatine, protein</Text>
              </View>
           </View>
           <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark.muted} />
        </TouchableOpacity>

        <View style={{marginTop: 10}}>
          <WaterTracker currentMl={water} goalMl={3000} onAdd={addWater} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: Colors.dark.border },
  headerDate: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  cameraBtn: { backgroundColor: Colors.dark.limebg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cameraBtnText: { color: Colors.dark.lime, fontWeight: 'bold' },
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },
  
  summaryCard: { flexDirection: 'row', backgroundColor: Colors.dark.bg2, borderRadius: 16, padding: 20, gap: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  summaryStats: { flex: 1, gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: Colors.dark.muted, fontSize: 13, fontWeight: '600' },
  statValue: { color: Colors.dark.text, fontSize: 13, fontWeight: 'bold' },

  section: { backgroundColor: Colors.dark.bg2, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.dark.bg3 },
  sectionTitle: { color: Colors.dark.text, fontWeight: 'bold', fontSize: 16 },
  sectionSubtitle: { color: Colors.dark.muted, fontWeight: '600', fontSize: 14 },
  sectionBody: { paddingBottom: 8 },
  btnAddFood: { padding: 16, alignItems: 'center' },
  btnAddFoodText: { color: Colors.dark.lime, fontWeight: 'bold', fontSize: 15 },
  supCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, marginTop: 10 },
  supContent: { flexDirection: 'row', alignItems: 'center' },
  supTitle: { color: Colors.dark.text, fontSize: 15, fontWeight: 'bold' },
  supSub: { color: Colors.dark.muted, fontSize: 12, marginTop: 2 }
});
