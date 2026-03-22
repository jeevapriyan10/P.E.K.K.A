// filepath: src/utils/streakCalculator.ts
import { getDb } from '../lib/database';

export interface StreakInfo {
  current: number;
  best: number;
  lastDate: string | null;
}

/**
 * Calculate workout streak based on consecutive days with workouts
 * Streak counts forward from the most recent workout day
 */
export async function calculateWorkoutStreak(): Promise<StreakInfo> {
  const db = await getDb();

  // Get all dates with workouts in the last 90 days (efficient query)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

  const workouts: any[] = await db.getAllAsync(
    `SELECT DISTINCT date FROM workout_sessions WHERE date >= ? ORDER BY date DESC`,
    [dateStr]
  );

  if (workouts.length === 0) {
    return { current: 0, best: 0, lastDate: null };
  }

  const dates = workouts.map(w => w.date);
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Determine if streak is active (most recent workout is today or yesterday)
  const mostRecent = dates[0];
  let currentStreak = 0;

  if (mostRecent === today || mostRecent === yesterdayStr) {
    // Count consecutive days backwards from mostRecent
    let consecutive = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        consecutive++;
      } else {
        break;
      }
    }
    currentStreak = consecutive;
  } else {
    currentStreak = 0;
  }

  // Calculate best streak (longest consecutive sequence)
  let bestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff === 1) {
      tempStreak++;
    } else {
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > bestStreak) bestStreak = tempStreak;

  return {
    current: currentStreak,
    best: bestStreak,
    lastDate: mostRecent
  };
}

/**
 * Update streak table based on today's workout status
 * Called after a workout is completed
 */
export async function updateWorkoutStreak(): Promise<void> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if workout exists today
  const todayWorkout: any = await db.getFirstAsync(
    'SELECT id FROM workout_sessions WHERE date = ?',
    [today]
  );

  if (!todayWorkout) {
    // No workout today, don't update streak
    return;
  }

  // Get current streak record
  const streakRecord: any = await db.getFirstAsync(
    'SELECT current_count, best_count, last_date FROM streaks WHERE type = "workout"'
  );

  if (!streakRecord) {
    // First streak ever
    await db.runAsync(
      'INSERT INTO streaks (type, current_count, best_count, last_date) VALUES (?, ?, ?, ?)',
      ['workout', 1, 1, today]
    );
  } else {
    const lastDate = streakRecord.last_date;
    let newCount = 1; // Default to reset

    if (lastDate === today) {
      // Already worked out today, no change
      newCount = streakRecord.current_count;
    } else if (lastDate === yesterdayStr) {
      // Consecutive day - increment
      newCount = streakRecord.current_count + 1;
    } else {
      // Broken streak - start new at 1
      newCount = 1;
    }

    const newBest = Math.max(newCount, streakRecord.best_count);

    await db.runAsync(
      'UPDATE streaks SET current_count = ?, best_count = ?, last_date = ? WHERE type = "workout"',
      [newCount, newBest, today]
    );
  }
}

/**
 * Get all streak types (workout, nutrition, water, etc.)
 */
export async function getAllStreaks(): Promise<Map<string, StreakInfo>> {
  const db = await getDb();
  const records: any[] = await db.getAllAsync(
    'SELECT type, current_count, best_count, last_date FROM streaks'
  );

  const streaks = new Map<string, StreakInfo>();
  records.forEach(r => {
    streaks.set(r.type, {
      current: r.current_count,
      best: r.best_count,
      lastDate: r.last_date
    });
  });

  return streaks;
}

/**
 * Reset a streak (for testing or if user wants to start fresh)
 */
export async function resetStreak(type: string = 'workout'): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE streaks SET current_count = 0, last_date = NULL WHERE type = ?',
    [type]
  );
}

/**
 * Increment streak manually (e.g., after completing a workout)
 */
export async function incrementStreak(type: string = 'workout'): Promise<StreakInfo> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const record: any = await db.getFirstAsync(
    'SELECT current_count, best_count, last_date FROM streaks WHERE type = ?',
    [type]
  );

  let newCount: number;
  let newBest: number;

  if (!record) {
    newCount = 1;
    newBest = 1;
  } else {
    const lastDate = record.last_date;
    if (lastDate === today) {
      // Already counted today
      return { current: record.current_count, best: record.best_count, lastDate };
    } else if (lastDate === yesterdayStr) {
      newCount = record.current_count + 1;
    } else {
      newCount = 1;
    }
    newBest = Math.max(newCount, record.best_count);
  }

  await db.runAsync(
    'INSERT OR REPLACE INTO streaks (type, current_count, best_count, last_date) VALUES (?, ?, ?, ?)',
    [type, newCount, newBest, today]
  );

  return { current: newCount, best: newBest, lastDate: today };
}

export default {
  calculateWorkoutStreak,
  updateWorkoutStreak,
  getAllStreaks,
  resetStreak,
  incrementStreak
};
