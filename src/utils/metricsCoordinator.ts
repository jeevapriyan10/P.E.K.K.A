// filepath: src/utils/metricsCoordinator.ts
import { getDb } from '../lib/database';
import { calculateTDEE } from './tdeeCalculator';
import stepCounterService from '../services/stepCounter';

export interface DailyMetrics {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  steps: number;
  workouts: number;
}

export interface MetricUpdate {
  type: 'food' | 'water' | 'steps' | 'workout' | 'all';
  date: string;
  data: Partial<DailyMetrics>;
}

/**
 * Centralized service for all daily metrics
 * Ensures consistency across dashboard, reports, and achievements
 */
export const metricsCoordinator = {
  /**
   * Get all metrics for a specific date
   */
  async getMetrics(date: string): Promise<DailyMetrics> {
    const db = await getDb();

    // Food entries
    const foodEntries: any[] = await db.getAllAsync(
      'SELECT calories, protein, carbs, fat FROM food_entries WHERE date = ?',
      [date]
    );

    const totalCals = foodEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
    const totalProt = foodEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
    // Need to fetch carbs and fat from food_database or calculate from food_entries if stored
    // For now, assume they're in food_entries (check schema)
    const totalCarbs = foodEntries.reduce((sum, e) => sum + (e.carbs || 0), 0);
    const totalFat = foodEntries.reduce((sum, e) => sum + (e.fat || 0), 0);

    // Water
    const waterLog: any = await db.getFirstAsync(
      'SELECT amount_ml FROM water_logs WHERE date = ?',
      [date]
    );
    const water = waterLog?.amount_ml || 0;

    // Steps
    const stepsLog: any = await db.getFirstAsync(
      'SELECT step_count FROM step_logs WHERE date = ?',
      [date]
    );
    const steps = stepsLog?.step_count || 0;

    // Workouts
    const workoutCount: any = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM workout_sessions WHERE date = ?',
      [date]
    );
    const workouts = workoutCount?.count || 0;

    return {
      date,
      calories: totalCals,
      protein: totalProt,
      carbs: totalCarbs,
      fat: totalFat,
      water,
      steps,
      workouts
    };
  },

  /**
   * Get metrics for date range
   */
  async getMetricsRange(startDate: string, endDate: string): Promise<DailyMetrics[]> {
    const db = await getDb();

    // Get all dates in range that have any activity
    const datesQuery = `
      SELECT date FROM (
        SELECT date FROM food_entries WHERE date BETWEEN ? AND ?
        UNION
        SELECT date FROM water_logs WHERE date BETWEEN ? AND ?
        UNION
        SELECT date FROM step_logs WHERE date BETWEEN ? AND ?
        UNION
        SELECT date FROM workout_sessions WHERE date BETWEEN ? AND ?
      ) AS dates
      GROUP BY date
      ORDER BY date DESC
    `;

    const dateRows: any[] = await db.getAllAsync(datesQuery, [
      startDate, endDate, startDate, endDate,
      startDate, endDate, startDate, endDate
    ]);

    const metrics: DailyMetrics[] = [];
    for (const row of dateRows) {
      const daily = await this.getMetrics(row.date);
      metrics.push(daily);
    }

    return metrics;
  },

  /**
   * Get today's metrics (convenience)
   */
  async getTodayMetrics(): Promise<DailyMetrics> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMetrics(today);
  },

  /**
   * Record water intake
   */
  async recordWater(amountMl: number): Promise<void> {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    const existing: any = await db.getFirstAsync(
      'SELECT id, amount_ml FROM water_logs WHERE date = ?',
      [today]
    );

    if (existing) {
      const newAmount = existing.amount_ml + amountMl;
      await db.runAsync(
        'UPDATE water_logs SET amount_ml = ?, updated_at = datetime("now") WHERE date = ?',
        [newAmount, today]
      );
    } else {
      await db.runAsync(
        'INSERT INTO water_logs (date, amount_ml, logged_at) VALUES (?, ?, datetime("now"))',
        [today, amountMl]
      );
    }

    console.log(`[Metrics] Water logged: ${amountMl}ml`);
  },

  /**
   * Set water to specific amount (for reset or manual adjustment)
   */
  async setWater(amountMl: number): Promise<void> {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    if (amountMl <= 0) {
      await db.runAsync('DELETE FROM water_logs WHERE date = ?', [today]);
    } else {
      await db.runAsync(
        'INSERT OR REPLACE INTO water_logs (date, amount_ml, logged_at) VALUES (?, ?, datetime("now"))',
        [today, amountMl]
      );
    }
  },

  /**
   * Get current water for today
   */
  async getWater(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const db = await getDb();
    const result: any = await db.getFirstAsync(
      'SELECT amount_ml FROM water_logs WHERE date = ?',
      [today]
    );
    return result?.amount_ml || 0;
  },

  /**
   * Calculate daily TDEE goals from user profile
   */
  async getDailyGoals(): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
    const db = await getDb();
    const user: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');

    if (!user) {
      return { calories: 2000, protein: 150, carbs: 200, fat: 65 };
    }

    return calculateTDEE(user);
  },

  /**
   * Weekly summary for AI report
   */
  async getWeeklySummary(): Promise<{
    avgCalories: number;
    avgProtein: number;
    avgSteps: number;
    avgWater: number;
    workoutsCount: number;
    daysTracked: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const metrics = await this.getMetricsRange(startDate, new Date().toISOString().split('T')[0]);

    if (metrics.length === 0) {
      return {
        avgCalories: 0,
        avgProtein: 0,
        avgSteps: 0,
        avgWater: 0,
        workoutsCount: 0,
        daysTracked: 0
      };
    }

    const sum = metrics.reduce((acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      steps: acc.steps + m.steps,
      water: acc.water + m.water,
      workouts: acc.workouts + m.workouts
    }), { calories: 0, protein: 0, steps: 0, water: 0, workouts: 0 });

    const count = metrics.length;

    return {
      avgCalories: Math.round(sum.calories / count),
      avgProtein: Math.round(sum.protein / count),
      avgSteps: Math.round(sum.steps / count),
      avgWater: Math.round(sum.water / count),
      workoutsCount: sum.workouts,
      daysTracked: count
    };
  },

  /**
   * Check if daily goals are met
   */
  async getGoalProgress(): Promise<{
    calories: { current: number; goal: number; percentage: number };
    protein: { current: number; goal: number; percentage: number };
    water: { current: number; goal: number; percentage: number };
    steps: { current: number; goal: number; percentage: number };
  }> {
    const [todayMetrics, goals] = await Promise.all([
      this.getTodayMetrics(),
      this.getDailyGoals()
    ]);

    const waterGoal = 3000; // Could be stored in settings
    const stepsGoal = 10000; // Could be stored in settings

    return {
      calories: {
        current: todayMetrics.calories,
        goal: goals.calories,
        percentage: Math.min(100, (todayMetrics.calories / goals.calories) * 100)
      },
      protein: {
        current: todayMetrics.protein,
        goal: goals.protein,
        percentage: Math.min(100, (todayMetrics.protein / goals.protein) * 100)
      },
      water: {
        current: todayMetrics.water,
        goal: waterGoal,
        percentage: Math.min(100, (todayMetrics.water / waterGoal) * 100)
      },
      steps: {
        current: todayMetrics.steps,
        goal: stepsGoal,
        percentage: Math.min(100, (todayMetrics.steps / stepsGoal) * 100)
      }
    };
  },

  /**
   * Get last 7 days data for charts
   */
  async getLast7DaysChartData(): Promise<DailyMetrics[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today = 7 days
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    return this.getMetricsRange(startDate, new Date().toISOString().split('T')[0]);
  }
};

export default metricsCoordinator;
