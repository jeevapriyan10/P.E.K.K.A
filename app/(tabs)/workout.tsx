// filepath: app/(tabs)/workout.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useFitnessStore } from '../../src/store/fitnessStore';
import { getWorkoutHistory, seedExercises } from '../../src/db/fitnessDb';
import { getDb } from '../../src/lib/database';

export default function WorkoutDashboard() {
  const router = useRouter();
  const { isWorkoutActive } = useFitnessStore();
  const [history, setHistory] = useState<any[]>([]);

  const init = async () => {
    await seedExercises();
    const records = await getWorkoutHistory();
    setHistory(records);
  };

  useFocusEffect(useCallback(() => { init(); }, []));

  const clearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all activity logs?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            const db = await getDb();
            await db.execAsync('DELETE FROM workout_sessions');
            await db.execAsync('DELETE FROM workout_exercises');
            await db.execAsync('DELETE FROM step_logs');
            await db.execAsync('DELETE FROM cardio_sessions');
            init();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Hub</Text>
        <TouchableOpacity onPress={clearHistory}>
          <MaterialCommunityIcons name="history" size={24} color={Colors.dark.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.card, { backgroundColor: Colors.dark.cyan }]} onPress={() => router.push('/fitness/workout-planner')}>
            <MaterialCommunityIcons name="play-circle" size={32} color={Colors.dark.bg} />
            <View>
              <Text style={[styles.cardTitle, { color: Colors.dark.bg }]}>Start Workout</Text>
              <Text style={[styles.cardSub, { color: Colors.dark.bg, opacity: 0.8 }]}>Choose exercises & go</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/fitness/workout-planner?view=history')}>
            <MaterialCommunityIcons name="calendar-clock" size={28} color={Colors.dark.lime} />
            <Text style={styles.cardTitle}>Planner</Text>
            <Text style={styles.cardSub}>Plan your week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.card} onPress={() => router.push('/fitness/cardio-log')}>
            <MaterialCommunityIcons name="run" size={28} color={Colors.dark.sky} />
            <Text style={styles.cardTitle}>Cardio Log</Text>
            <Text style={styles.cardSub}>Track runs & walks</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            <TouchableOpacity onPress={() => router.push('/fitness/workout-history')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="arm-flex-outline" size={48} color={Colors.dark.border} />
              <Text style={styles.empty}>No recent workouts. Time to lift!</Text>
            </View>
          ) : (
            history.slice(0, 3).map(h => (
              <TouchableOpacity key={`${h.category}-${h.id}`} style={styles.histItem} onPress={() => h.category !== 'cardio' && router.push(`/fitness/workout-summary?id=${h.id}`)}>
                <View style={[styles.histIcon, h.category === 'cardio' && { backgroundColor: Colors.dark.bg + '50' }]}>
                  <MaterialCommunityIcons name={h.category === 'cardio' ? "run" : "weight-lifter"} size={20} color={h.category === 'cardio' ? Colors.dark.sky : Colors.dark.lime} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.histName}>{h.name}</Text>
                  <Text style={styles.histDate}>{h.date}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  {/* Volume removed per design */}
                  <Text style={[styles.histVol, h.category === 'cardio' && { color: Colors.dark.sky }]}>
                    {h.category === 'cardio' ? `${Math.round(h.total_volume)} kcal` : `${h.duration_minutes} min`}
                  </Text>
                  {h.category !== 'cardio' && <Text style={styles.histTime}>{h.duration_minutes} min</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text },
  scroll: { padding: 16, gap: 24, paddingBottom: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flex: 1, minWidth: '45%', backgroundColor: Colors.dark.bg2, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border, gap: 12 },
  cardTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: Colors.dark.muted, fontSize: 11 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  seeAll: { color: Colors.dark.cyan, fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', padding: 40, gap: 12 },
  empty: { color: Colors.dark.muted, fontStyle: 'italic', textAlign: 'center' },
  histItem: { backgroundColor: Colors.dark.bg2, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  histIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.bg3, justifyContent: 'center', alignItems: 'center' },
  histName: { color: Colors.dark.text, fontSize: 15, fontWeight: 'bold' },
  histDate: { color: Colors.dark.muted, fontSize: 11, marginTop: 2 },
  histVol: { color: Colors.dark.lime, fontWeight: 'bold', fontSize: 14 },
  histTime: { color: Colors.dark.muted, fontSize: 11, marginTop: 2 },
});
