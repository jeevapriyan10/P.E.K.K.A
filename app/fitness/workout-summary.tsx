// filepath: app/fitness/workout-summary.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { getSessionDetails } from '../../src/db/fitnessDb';
import { getDb } from '../../src/lib/database';
import ShareFlashcard from '../../src/components/fitness/ShareFlashcard';

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [session, setSession] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [activations, setActivations] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await getSessionDetails(Number(id));
        setSession(data.session);
        setExercises(data.exercises);

        // Calculate total sets and reps
        let sets = 0;
        let reps = 0;
        data.exercises.forEach((e: any) => {
          sets += e.sets.length;
          reps += e.sets.reduce((sum: number, s: any) => sum + s.reps, 0);
        });
        setTotalSets(sets);
        setTotalReps(reps);

        const acts: Record<string, number> = {};
        data.exercises.forEach((e: any) => {
          if (e.muscle_group_primary) {
            acts[e.muscle_group_primary] = (acts[e.muscle_group_primary] || 0) + 0.25;
          }
        });
        Object.keys(acts).forEach(k => acts[k] = Math.min(1, acts[k]));
        setActivations(acts);

        const db = await getDb();
        const sData: any = await db.getFirstAsync('SELECT current_count FROM streaks WHERE type = "workout"');
        setStreak(sData?.current_count || 1);
      }
    };
    load();
  }, [id]);

  if (!session) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/workout')}>
           <MaterialCommunityIcons name="close" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Session Summary</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.sessName}>{session.name}</Text>
          <Text style={styles.sessDate}>{session.date}</Text>
        </View>

        <View style={styles.statsGrid}>
           <StatBox icon="fire" val={session.calories_burned || 0} label="Kcal" color={Colors.dark.amber} />
           <StatBox icon="clock-outline" val={session.duration_minutes} label="Min" color={Colors.dark.sky} />
           <StatBox icon="trophy-outline" val={exercises.filter(e=>e.is_pr).length} label="PRs" color="#FFD700" />
           <StatBox icon="weight-bar" val={totalSets} label="Sets" color={Colors.dark.cyan} />
           <StatBox icon="repeat" val={totalReps} label="Reps" color={Colors.dark.violet} />
           {/* Volume removed per design - not emphasized */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share Your Workout</Text>
          <ShareFlashcard session={session} activations={activations} streak={streak} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Details</Text>
          {exercises.reduce((acc: any[], curr) => {
             const last = acc[acc.length-1];
             if (last && last.exercise_name === curr.exercise_name) {
               last.sets.push(curr);
             } else {
               acc.push({ ...curr, sets: [curr] });
             }
             return acc;
          }, []).map((ex, i) => (
             <View key={i} style={styles.exCard}>
               <View style={styles.exHeader}>
                 <Text style={styles.exName}>{ex.exercise_name}</Text>
                 <Text style={styles.exMuscle}>{ex.muscle_group_primary}</Text>
               </View>
               <View style={styles.setsList}>
                 {ex.sets.map((s: any, si: number) => (
                   <View key={si} style={styles.setRow}>
                     <Text style={styles.setNum}>{si+1}</Text>
                     <Text style={styles.setVal}>{s.weight} kg × {s.reps}</Text>
                     {!!s.is_pr && <MaterialCommunityIcons name="trophy" size={12} color="#FFD700" />}
                   </View>
                 ))}
               </View>
             </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatBox = ({ icon, val, label, color }: any) => (
  <View style={styles.statBox}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={[styles.statVal, { color }]}>{val}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', backgroundColor: Colors.dark.bg2 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20, gap: 30 },
  hero: { alignItems: 'center' },
  sessName: { color: Colors.dark.text, fontSize: 32, fontWeight: 'bold' },
  sessDate: { color: Colors.dark.muted, fontSize: 14, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  statVal: { fontSize: 24, fontWeight: 'bold', marginVertical: 4 },
  statLbl: { color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { gap: 16 },
  sectionTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  exCard: { backgroundColor: Colors.dark.bg2, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exName: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  exMuscle: { color: Colors.dark.muted, fontSize: 12 },
  setsList: { gap: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.dark.bg3, padding: 8, borderRadius: 8 },
  setNum: { color: Colors.dark.dim, fontWeight: 'bold', width: 20 },
  setVal: { color: Colors.dark.text, fontSize: 14, fontWeight: '600' }
});
