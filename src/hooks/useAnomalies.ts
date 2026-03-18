// filepath: src/hooks/useAnomalies.ts
import { useState, useEffect } from 'react';
import { useDatabase } from '../providers/DatabaseProvider';
import { aiService, DayData } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISS_KEY = 'anomaly_dismissed_at';
const DISMISS_DURATION = 48 * 60 * 60 * 1000; // 48 hours

export function useAnomalies() {
  const { db, isReady } = useDatabase();
  const [anomaly, setAnomaly] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && db) {
      checkAnomalies();
    }
  }, [isReady, db]);

  const checkAnomalies = async () => {
    try {
      if (!db) return;

      const dismissedAt = await AsyncStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) {
        return;
      }

      const data: DayData[] = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Get daily cals
        const food: any = await db.getFirstAsync('SELECT SUM(calories) as total_cal, SUM(protein) as total_prot FROM food_entries WHERE date = ?', [dateStr]);
        // Get workout
        const workout: any = await db.getFirstAsync('SELECT id FROM workout_sessions WHERE date = ?', [dateStr]);
        // Get weight
        const weight: any = await db.getFirstAsync('SELECT weight_kg FROM weight_logs WHERE date = ? ORDER BY id DESC LIMIT 1', [dateStr]);
        // Get steps
        const steps: any = await db.getFirstAsync('SELECT step_count FROM step_logs WHERE date = ?', [dateStr]);
        
        data.push({
          date: dateStr,
          calories: food.total_cal || 0,
          protein: food.total_prot || 0,
          steps: steps?.step_count || 0,
          workoutDone: !!workout,
          weight: weight?.weight_kg
        });
      }

      const result = await aiService.detectAnomalies(data);
      setAnomaly(result);
    } catch (e) {
      console.warn('Anomaly check failed', e);
    }
  };

  const dismiss = async () => {
    setAnomaly(null);
    await AsyncStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  return { anomaly, dismiss };
}
