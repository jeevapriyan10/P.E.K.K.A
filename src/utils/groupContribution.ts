// filepath: src/utils/groupContribution.ts
import { getDb } from '../lib/database';

export const groupContribution = {
  async calculate(goalType: 'steps' | 'workouts' | 'calories' | 'streak_days', period: 'weekly' | 'monthly') {
    const db = await getDb();
    const now = new Date();
    let startDate = new Date();

    if (period === 'weekly') {
      // Monday of the current week
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
    } else {
      // 1st of the month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const isoStart = startDate.toISOString().split('T')[0];

    switch (goalType) {
      case 'steps': {
        const row: any = await db.getFirstAsync('SELECT SUM(step_count) as total FROM step_logs WHERE date >= ?', [isoStart]);
        return row?.total || 0;
      }
      case 'workouts': {
        const row: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM workout_sessions WHERE date >= ?', [isoStart]);
        return row?.count || 0;
      }
      case 'calories': {
        const rows: any[] = await db.getAllAsync('SELECT SUM(calories) as daily_cal FROM food_entries WHERE date >= ? GROUP BY date', [isoStart]);
        if (rows.length === 0) return 0;
        const sum = rows.reduce((acc, r) => acc + (r.daily_cal || 0), 0);
        return sum / rows.length;
      }
      case 'streak_days': {
        const row: any = await db.getFirstAsync('SELECT current_count FROM streaks WHERE type = "workout"');
        return row?.current_count || 0;
      }
      default:
        return 0;
    }
  }
};
