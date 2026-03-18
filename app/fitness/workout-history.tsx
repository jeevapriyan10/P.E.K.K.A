// filepath: app/fitness/workout-history.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';

export default function ActivityHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const db = await getDb();
    
    // Fetch strength sessions
    const sessions: any[] = await db.getAllAsync('SELECT id, name, date, total_volume, duration_minutes, "strength" as category FROM workout_sessions ORDER BY date DESC, id DESC');
    
    // Fetch cardio sessions
    const cardio: any[] = await db.getAllAsync('SELECT id, type as name, date, calories_burned as total_volume, duration_minutes, "cardio" as category FROM cardio_sessions ORDER BY date DESC, id DESC');

    const combined = [...sessions, ...cardio].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(combined);
  };

  useFocusEffect(useCallback(() => { fetchHistory(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="chevron-left" size={24} color={Colors.dark.text} /></TouchableOpacity>
        <Text style={styles.title}>Activity Log</Text>
        <View style={{width: 24}} />
      </View>
      <FlatList 
        data={history}
        keyExtractor={(item, index) => `${item.category}-${item.id}-${index}`}
        renderItem={({item: h}) => (
          <TouchableOpacity 
            style={styles.histItem} 
            onPress={() => h.category === 'strength' ? router.push(`/fitness/workout-summary?id=${h.id}`) : null}
          >
            <View style={styles.iconBox}>
               <MaterialCommunityIcons 
                 name={h.category === 'strength' ? "weight-lifter" : "run"} 
                 size={20} 
                 color={h.category === 'strength' ? Colors.dark.lime : Colors.dark.sky} 
               />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.histName}>{h.name}</Text>
              <Text style={styles.histDate}>{h.date}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={[styles.histStat, {color: h.category === 'strength' ? Colors.dark.lime : Colors.dark.sky}]}>
                {h.category === 'strength' ? `${Math.round(h.total_volume)} kg` : `${h.total_volume} kcal`}
              </Text>
              <Text style={styles.histTime}>{h.duration_minutes} min</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', backgroundColor: Colors.dark.bg2 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16, gap: 10 },
  histItem: { backgroundColor: Colors.dark.bg2, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.bg3, justifyContent: 'center', alignItems: 'center' },
  histName: { color: Colors.dark.text, fontSize: 15, fontWeight: 'bold' },
  histDate: { color: Colors.dark.muted, fontSize: 11, marginTop: 2 },
  histStat: { fontWeight: 'bold', fontSize: 14 },
  histTime: { color: Colors.dark.muted, fontSize: 11, marginTop: 2 }
});
