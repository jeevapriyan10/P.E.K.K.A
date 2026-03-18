// filepath: app/(tabs)/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { Colors } from '../../src/constants/colors';
import RingProgress from '../../src/components/ui/RingProgress';
import LoadingState from '../../src/components/ui/LoadingState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StreakHeatmap from '../../src/components/dashboard/StreakHeatmap';
import AISummaryCard from '../../src/components/ai/AISummaryCard';
import AnomalyBanner from '../../src/components/ai/AnomalyBanner';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

export default function Dashboard() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const netInfo = useNetInfo();
  
  const [name, setName] = useState('User');
  const [streaks, setStreaks] = useState<{type: string, count: number}[]>([]);
  const [progress, setProgress] = useState({ calories: 0, protein: 0, water: 0 });
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, water: 3000 });
  const [heatmapData, setHeatmapData] = useState<{[key: string]: number}>({});
  const [todaySteps, setTodaySteps] = useState(0);
  const [workoutDone, setWorkoutDone] = useState(false);

  const loadData = async () => {
    if (!db || !isReady) return;
    try {
      const userResult: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      if (userResult) {
        setName(userResult.name || 'User');
        const { calories, protein_g } = require('../../src/utils/tdeeCalculator').calculateTDEE(userResult);
        setGoals(prev => ({ ...prev, calories, protein: protein_g }));
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Load nutrition
      const foodEntries: any[] = await db.getAllAsync('SELECT calories, protein FROM food_entries WHERE date = ?', [today]);
      const totalCals = foodEntries.reduce((acc, curr) => acc + (curr.calories || 0), 0);
      const totalProt = foodEntries.reduce((acc, curr) => acc + (curr.protein || 0), 0);
      
      // Load water
      const waterLog: any = await db.getFirstAsync('SELECT amount_ml FROM water_logs WHERE date = ?', [today]);
      const totalWater = waterLog ? waterLog.amount_ml : 0;

      setProgress({
        calories: totalCals,
        protein: totalProt,
        water: totalWater
      });

      // Load streaks
      const sc: any[] = await db.getAllAsync('SELECT type, current_count FROM streaks');
      setStreaks(sc.map(s => ({ type: s.type, count: s.current_count })));

      // Load steps
      const stepsLog: any = await db.getFirstAsync('SELECT step_count FROM step_logs WHERE date = ?', [today]);
      setTodaySteps(stepsLog?.step_count || 0);

      // Load workout status
      const workoutLog: any = await db.getFirstAsync('SELECT id FROM workout_sessions WHERE date = ?', [today]);
      setWorkoutDone(!!workoutLog);

      // Load 28 day activity for heatmap
      const date28 = new Date();
      date28.setDate(date28.getDate() - 28);
      const dStr = date28.toISOString().split('T')[0];

      const workouts: any[] = await db.getAllAsync('SELECT date FROM workout_sessions WHERE date >= ?', [dStr]);
      const nutrition: any[] = await db.getAllAsync('SELECT date FROM food_entries WHERE date >= ?', [dStr]);

      const counts: {[key: string]: number} = {};
      workouts.forEach(w => counts[w.date] = (counts[w.date] || 0) + 1);
      nutrition.forEach(n => counts[n.date] = (counts[n.date] || 0) + 1);
      setHeatmapData(counts);

    } catch (e) {
      console.warn('Failed to load dashboard data', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [isReady])
  );

  if (!isReady) return <LoadingState />;

  const isOffline = netInfo.isConnected === false;

  const getStreakIcon = (type: string) => {
    switch(type) {
      case 'workout': return 'arm-flex';
      case 'nutrition': return 'food-apple';
      case 'water': return 'water';
      default: return 'fire';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <AnomalyBanner />
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {name}</Text>
            <Text style={styles.date}>{getFormattedDate()}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <MaterialCommunityIcons name="account-circle" size={40} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Daily Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="target" size={20} color={Colors.dark.cyan} />
            <Text style={styles.cardTitle}>Daily Goals</Text>
          </View>
          <View style={styles.ringsRow}>
            <RingProgress 
              value={progress.calories / goals.calories} 
              size={85} 
              color={Colors.dark.cyan} 
              label={`${Math.round(progress.calories)}/${goals.calories}`} 
              sublabel="kcal" 
            />
            <RingProgress 
              value={progress.protein / goals.protein} 
              size={85} 
              color={Colors.dark.lime} 
              label={`${Math.round(progress.protein)}/${goals.protein}`} 
              sublabel="protein" 
            />
            <RingProgress 
              value={progress.water / goals.water} 
              size={85} 
              color={Colors.dark.sky} 
              label={`${progress.water}/${goals.water}`} 
              sublabel="water" 
            />
          </View>
        </View>

        <AISummaryCard 
          todayData={{ 
            calories: progress.calories, 
            protein: progress.protein, 
            steps: todaySteps, 
            workoutDone: workoutDone 
          }} 
          goals={{
            calories: goals.calories,
            protein: goals.protein
          }}
        />

        {/* Heatmap */}
        <StreakHeatmap data={heatmapData} title="Activity Consistency (Last 28 Days)" />

        {/* Streaks */}
        <View style={styles.streakContainer}>
          {streaks.map(s => (
            <View key={s.type} style={styles.streakCard}>
               <MaterialCommunityIcons name={getStreakIcon(s.type as any)} size={24} color={Colors.dark.amber} />
               <Text style={styles.streakCount}>{s.count}</Text>
               <Text style={styles.streakType}>{s.type}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  offlineBanner: { backgroundColor: Colors.dark.amber, padding: 4, alignItems: 'center' },
  offlineText: { color: Colors.dark.bg, fontSize: 12, fontWeight: 'bold' },
  scroll: { padding: 16, paddingBottom: 40, gap: 24 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text },
  date: { fontSize: 14, color: Colors.dark.muted },

  card: {
    backgroundColor: Colors.dark.bg2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.dark.text },

  ringsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  
  streakContainer: { flexDirection: 'row', gap: 12 },
  streakCard: {
    flex: 1,
    backgroundColor: Colors.dark.bg2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 4,
  },
  streakCount: { fontSize: 22, fontWeight: 'bold', color: Colors.dark.text },
  streakType: { fontSize: 10, color: Colors.dark.muted, textTransform: 'uppercase', fontWeight: 'bold' }
});
