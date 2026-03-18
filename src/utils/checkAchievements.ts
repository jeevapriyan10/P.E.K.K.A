// filepath: src/utils/checkAchievements.ts
import { getDb } from '../lib/database';

export async function checkAchievements(showAchievement?: (name: string, icon: string) => void) {
  // Use a slight delay to ensure DB transactions from the caller (like saving a workout) are finished
  setTimeout(async () => {
    try {
      const db = await getDb();
      
      const sessRes: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM workout_sessions');
      const sessions = sessRes.c;
      
      const prRes: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM personal_records');
      const prs = prRes.c;

      const stepsRes: any = await db.getFirstAsync('SELECT MAX(step_count) as max_steps FROM step_logs');
      const maxSteps = stepsRes.max_steps || 0;

      const assign = async (type: string, name: string, desc: string, icon: string) => {
        const exist: any = await db.getFirstAsync('SELECT id FROM achievements WHERE achievement_type = ?', [type]);
        if (!exist) {
          await db.runAsync(
            'INSERT INTO achievements (achievement_type, name, description, earned_at) VALUES (?, ?, ?, datetime("now"))',
            [type, name, desc]
          );
          console.log(`Achievement Earned: ${name}`);
          if (showAchievement) {
            showAchievement(name, icon);
          }
        }
      };

      if (sessions >= 1) await assign('first_workout', 'First Step', 'Completed your first workout session.', '👟');
      if (sessions >= 10) await assign('10_workouts', 'Consistency is Key', 'Completed 10 workout sessions.', '🦾');
      if (prs >= 1) await assign('first_PR', 'Breaking Limits', 'Hit your first personal record.', '⭐');
      if (prs >= 5) await assign('5_PRs', 'Unstoppable Force', 'Hit 5 personal records.', '🔥');
      if (maxSteps >= 10000) await assign('10k_steps', '10k Club', 'Walked 10,000 steps in a single day.', '🏃');
      if (maxSteps >= 42195) await assign('marathon_steps', 'Marathon Walker', 'Walked the distance of a marathon in steps.', '🏅');
      
      // Basic Streak Logic
      const today = new Date().toISOString().split('T')[0];
      const sessToday: any = await db.getFirstAsync('SELECT id FROM workout_sessions WHERE date = ?', [today]);
      if (sessToday) {
        const streak: any = await db.getFirstAsync('SELECT current_count, last_date FROM streaks WHERE type = "workout"');
        if (!streak) {
           await db.runAsync('INSERT INTO streaks (type, current_count, best_count, last_date) VALUES ("workout", 1, 1, ?)', [today]);
        } else if (streak.last_date !== today) {
           const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
           const yStr = yesterday.toISOString().split('T')[0];
           const newCount = streak.last_date === yStr ? streak.current_count + 1 : 1;
           await db.runAsync('UPDATE streaks SET current_count = ?, last_date = ? WHERE type = "workout"', [newCount, today]);
           
           if (newCount === 7) await assign('7_day_streak', 'Weekly Warrior', '7-day activity streak.', '🛡️');
           if (newCount === 30) await assign('30_day_streak', 'Legendary Status', '30-day activity streak.', '👑');
        }
      }

    } catch (e) {
      console.warn('Achievement check error', e);
    }
  }, 500);
}
