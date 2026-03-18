// filepath: src/components/fitness/StepTracker.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import RingProgress from '../ui/RingProgress';
import { saveDailySteps } from '../../db/fitnessDb';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StepTracker() {
  const [steps, setSteps] = useState(0);
  const [goal] = useState(10000);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let sub: Pedometer.Subscription | null = null;

    const init = async () => {
      const avail = await Pedometer.isAvailableAsync();
      setIsAvailable(avail);
      
      if (avail) {
        const todayStr = new Date().toISOString().split('T')[0];
        const stored = await AsyncStorage.getItem(`step_total_${todayStr}`);
        const initialSteps = parseInt(stored || '0', 10);
        setSteps(initialSteps);

        sub = Pedometer.watchStepCount(async result => {
          setSteps(prev => {
              const newTotal = initialSteps + result.steps;
              if (newTotal % 10 === 0) {
                 AsyncStorage.setItem(`step_total_${todayStr}`, newTotal.toString());
                 const distance = newTotal * 0.00076;
                 const cals = newTotal * 0.04;
                 saveDailySteps(todayStr, newTotal, distance, cals);
              }
              return newTotal;
          });
        });
      }
    };
    init();

    return () => {
      sub?.remove();
    };
  }, []);

  const distance = (steps * 0.00076).toFixed(2);
  const cals = Math.round(steps * 0.04);
  const floors = Math.floor(steps / 150);

  return (
    <View style={styles.card}>
       <View style={styles.ringBox}>
         <RingProgress value={steps / goal} size={90} strokeWidth={10} color={Colors.dark.cyan} label={`${steps}`} sublabel="steps" />
       </View>
       <View style={styles.stats}>
         <View style={styles.headerRow}>
           <MaterialCommunityIcons name="walk" size={16} color={Colors.dark.cyan} />
           <Text style={styles.desc}>DAILY ACTIVITY</Text>
         </View>
         
         <Text style={styles.main}>{steps.toLocaleString()} <Text style={styles.subText}>/ {goal.toLocaleString()}</Text></Text>
         
         {!isAvailable && <Text style={{color: Colors.dark.rose, fontSize: 10, marginBottom: 8}}>Sensor Unavailable</Text>}

         <View style={styles.metricGrid}>
           <View style={styles.metricItem}>
             <MaterialCommunityIcons name="fire" size={14} color={Colors.dark.amber} />
             <Text style={styles.metric}>{cals} kcal</Text>
           </View>
           <View style={styles.metricItem}>
             <MaterialCommunityIcons name="map-marker-distance" size={14} color={Colors.dark.sky} />
             <Text style={styles.metric}>{distance} km</Text>
           </View>
           <View style={styles.metricItem}>
              <MaterialCommunityIcons name="stairs" size={14} color={Colors.dark.lime} />
              <Text style={styles.metric}>{floors} flr</Text>
           </View>
         </View>
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    backgroundColor: Colors.dark.bg2, 
    padding: 16, 
    borderRadius: 20, 
    alignItems: 'center', 
    gap: 16, 
    borderWidth: 1, 
    borderColor: Colors.dark.border 
  },
  ringBox: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center' },
  stats: { flex: 1, gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  main: { fontSize: 22, fontWeight: 'bold', color: Colors.dark.text },
  subText: { fontSize: 14, color: Colors.dark.muted },
  desc: { fontSize: 10, color: Colors.dark.muted, fontWeight: 'bold', letterSpacing: 1 },
  metricGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  metricItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: Colors.dark.bg3, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  metric: { fontSize: 11, color: Colors.dark.text, fontWeight: '600' }
});
