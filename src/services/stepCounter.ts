// filepath: src/services/stepCounter.ts
import { Pedometer } from 'expo-sensors';
import { getDb } from '../lib/database';
import { saveDailySteps } from '../db/fitnessDb';

const STEP_SYNC_INTERVAL = 10000; // Debounce DB writes to every 10 seconds

let isTracking = false;
let subscription: Pedometer.Subscription | null = null;
let initialSteps: number = 0;
let currentSteps: number = 0;
let lastSyncTime: number = 0;
let todayDate: string = '';

// Event emitter for real-time updates
type StepListener = (steps: number) => void;
const stepListeners: StepListener[] = [];

const notifyListeners = (steps: number) => {
  stepListeners.forEach(listener => listener(steps));
};

export const stepCounterService = {
  async isAvailable(): Promise<boolean> {
    try {
      return await Pedometer.isAvailableAsync();
    } catch (e) {
      console.error('[StepCounter] Availability check failed:', e);
      return false;
    }
  },

  async requestPermissions(): Promise<boolean> {
    // Pedometer uses motion permissions which are requested automatically by expo-sensors
    // No explicit permission request needed for Pedometer
    return true;
  },

  subscribe(listener: StepListener): () => void {
    stepListeners.push(listener);
    // Immediately call with current value
    if (isTracking) {
      listener(currentSteps);
    }
    // Return unsubscribe function
    return () => {
      const idx = stepListeners.indexOf(listener);
      if (idx > -1) stepListeners.splice(idx, 1);
    };
  },

  async startTracking(): Promise<boolean> {
    if (isTracking) {
      console.log('[StepCounter] Already tracking');
      return true;
    }

    try {
      const available = await this.isAvailable();
      if (!available) {
        console.warn('[StepCounter] Pedometer not available on this device');
        return false;
      }

      todayDate = new Date().toISOString().split('T')[0];

      // Get today's existing steps from database
      const db = await getDb();
      const existing: any = await db.getFirstAsync(
        'SELECT step_count FROM step_logs WHERE date = ?',
        [todayDate]
      );
      initialSteps = existing?.step_count || 0;
      currentSteps = initialSteps;
      lastSyncTime = Date.now();

      console.log(`[StepCounter] Starting with ${initialSteps} steps already recorded for today`);

      // Subscribe to step updates
      subscription = Pedometer.watchStepCount(async (result) => {
        const newTotal = initialSteps + result.steps;
        currentSteps = newTotal;

        // Throttle DB writes
        const now = Date.now();
        if (now - lastSyncTime >= STEP_SYNC_INTERVAL) {
          await this.persistSteps(newTotal - (lastSyncTime > 0 ? currentSteps - result.steps : 0));
          lastSyncTime = now;
        }

        notifyListeners(newTotal);
      });

      isTracking = true;
      console.log('[StepCounter] Started tracking');
      return true;
    } catch (error) {
      console.error('[StepCounter] Failed to start:', error);
      return false;
    }
  },

  async persistSteps(totalSteps: number): Promise<void> {
    try {
      const db = await getDb();
      const today = new Date().toISOString().split('T')[0];

      // Re-check today to handle day rollover
      const existing: any = await db.getFirstAsync(
        'SELECT id FROM step_logs WHERE date = ?',
        [today]
      );

      if (existing) {
        await db.runAsync(
          'UPDATE step_logs SET step_count = ?, updated_at = datetime("now") WHERE date = ?',
          [totalSteps, today]
        );
      } else {
        await db.runAsync(
          'INSERT INTO step_logs (date, step_count, distance_km, calories_burned, updated_at) VALUES (?, ?, ?, ?, datetime("now"))',
          [today, totalSteps, totalSteps * 0.00076, totalSteps * 0.04]
        );
      }

      console.log(`[StepCounter] Persisted ${totalSteps} steps for ${today}`);
    } catch (error) {
      console.error('[StepCounter] Persist error:', error);
    }
  },

  async stopTracking(): Promise<void> {
    try {
      subscription?.remove();
      subscription = null;
      // Final sync
      if (currentSteps > 0) {
        await this.persistSteps(currentSteps);
      }
      isTracking = false;
      console.log('[StepCounter] Stopped tracking');
    } catch (error) {
      console.error('[StepCounter] Stop error:', error);
    }
  },

  async getTodaySteps(): Promise<number> {
    if (isTracking) {
      return currentSteps;
    }
    try {
      const db = await getDb();
      const today = new Date().toISOString().split('T')[0];
      const result: any = await db.getFirstAsync(
        'SELECT step_count FROM step_logs WHERE date = ?',
        [today]
      );
      return result?.step_count || 0;
    } catch (error) {
      console.error('[StepCounter] Get today steps error:', error);
      return 0;
    }
  },

  async getStepsForDate(date: string): Promise<number> {
    try {
      const db = await getDb();
      const result: any = await db.getFirstAsync(
        'SELECT step_count FROM step_logs WHERE date = ?',
        [date]
      );
      return result?.step_count || 0;
    } catch (error) {
      console.error('[StepCounter] Get steps error:', error);
      return 0;
    }
  },

  async getLast7DaysSteps(): Promise<{ date: string; steps: number }[]> {
    try {
      const db = await getDb();
      const result: any[] = await db.getAllAsync(
        'SELECT date, step_count FROM step_logs WHERE date >= date("now", "-7 days") ORDER BY date DESC'
      );
      return result.map(r => ({ date: r.date, steps: r.step_count }));
    } catch (error) {
      console.error('[StepCounter] Get 7 days error:', error);
      return [];
    }
  },

  async calculateDistanceFromSteps(steps: number, strideLengthCm?: number): Promise<number> {
    const strideM = (strideLengthCm || 71.5) / 100;
    const distanceM = steps * strideM;
    return Math.round(distanceM * 100) / 100;
  },

  async estimateCaloriesFromSteps(steps: number, weightKg: number): Promise<number> {
    const multiplier = (weightKg / 70) * 0.04;
    return Math.round(steps * multiplier);
  },

  isTrackingNow(): boolean {
    return isTracking;
  }
};

export default stepCounterService;
