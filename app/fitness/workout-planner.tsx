import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutPlannerScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedule = async () => {
    try {
      const db = await getDb();
      // For now, we'll fetch actual workouts from the last 7 days and future templates
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const daysData = [];
      for(let i=0; i<7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dStr = d.toISOString().split('T')[0];
        
        const sessions: any[] = await db.getAllAsync('SELECT * FROM workout_sessions WHERE date = ?', [dStr]);
        daysData.push({
          day: DAYS[i],
          date: dStr,
          isToday: dStr === today.toISOString().split('T')[0],
          sessions
        });
      }
      setSchedule(daysData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>7-Day Planner</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Weekly Overview</Text>
          <Text style={styles.introSub}>Track your consistency and plan your next session.</Text>
        </View>

        <View style={styles.daysList}>
          {schedule.map((item, idx) => (
            <View key={item.date} style={[styles.dayCard, item.isToday && styles.todayCard]}>
              <View style={styles.dayHeader}>
                <View>
                   <Text style={[styles.dayName, item.isToday && {color: Colors.dark.lime}]}>{item.day}</Text>
                   <Text style={styles.dayDate}>{new Date(item.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</Text>
                </View>
                {item.sessions.length > 0 ? (
                  <View style={styles.badge}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={Colors.dark.lime} />
                    <Text style={styles.badgeText}>COMPLETED</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/fitness/active-workout')}>
                    <MaterialCommunityIcons name="plus" size={16} color={Colors.dark.muted} />
                    <Text style={styles.addBtnText}>Schedule</Text>
                  </TouchableOpacity>
                )}
              </View>

              {item.sessions.map((s: any) => (
                <View key={s.id} style={styles.sessionRow}>
                  <MaterialCommunityIcons name="dumbbell" size={18} color={Colors.dark.cyan} />
                  <View style={{flex: 1, marginLeft: 12}}>
                    <Text style={styles.sessionName}>{s.name || 'Strength Training'}</Text>
                    <Text style={styles.sessionMeta}>{s.duration_minutes}m • {s.total_volume}kg total</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  scroll: { padding: 20 },
  intro: { marginBottom: 30 },
  introTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  introSub: { color: '#777', fontSize: 14, marginTop: 4 },
  daysList: { gap: 16 },
  dayCard: { backgroundColor: '#111', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#222' },
  todayCard: { borderColor: Colors.dark.lime, backgroundColor: '#141A18' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  dayDate: { color: '#555', fontSize: 12, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A2E2A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: Colors.dark.lime, fontSize: 10, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4 },
  addBtnText: { color: '#555', fontSize: 12, fontWeight: '600' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 12, borderRadius: 12, marginTop: 8 },
  sessionName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  sessionMeta: { color: '#777', fontSize: 12, marginTop: 2 }
});
