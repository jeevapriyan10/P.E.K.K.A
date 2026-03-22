// filepath: src/utils/checkAchievements.ts
import { getDb } from '../lib/database';
import { incrementStreak } from './streakCalculator';

export async function checkAchievements(showAchievement?: (name: string, icon: string) => void) {
  // Use a slight delay to ensure DB transactions from the caller (like saving a workout) are finished
  setTimeout(async () => {
    try {
      const db = await getDb();

      // COUNT-BASED ACHIEVEMENTS
      const sessRes: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM workout_sessions');
      const sessions = sessRes.c;

      const prRes: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM personal_records');
      const prs = prRes.c;

      const stepsRes: any = await db.getFirstAsync('SELECT MAX(step_count) as max_steps FROM step_logs');
      const maxSteps = stepsRes.max_steps || 0;

      // Check if achievements already exist
      const existingAchievements: any[] = await db.getAllAsync(
        'SELECT achievement_type FROM achievements'
      );
      const earnedTypes = new Set(existingAchievements.map(a => a.achievement_type));

      const assign = async (type: string, name: string, desc: string, icon: string) => {
        if (earnedTypes.has(type)) return; // Skip if already earned

        await db.runAsync(
          'INSERT INTO achievements (achievement_type, name, description, earned_at) VALUES (?, ?, ?, datetime("now"))',
          [type, name, desc]
        );
        console.log(`Achievement Earned: ${name}`);
        if (showAchievement) {
          showAchievement(name, icon);
        }
      };

      // Workout count achievements
      if (sessions >= 1) await assign('first_workout', 'First Step', 'Completed your first workout session.', '👟');
      if (sessions >= 10) await assign('10_workouts', 'Consistency is Key', 'Completed 10 workout sessions.', '🦾');
      if (sessions >= 50) await assign('50_workouts', 'Dedication', 'Completed 50 workout sessions.', '💪');
      if (sessions >= 100) await assign('100_workouts', 'Centurion', 'Completed 100 workout sessions.', '🏆');

      // PR achievements
      if (prs >= 1) await assign('first_PR', 'Breaking Limits', 'Hit your first personal record.', '⭐');
      if (prs >= 5) await assign('5_PRs', 'Unstoppable Force', 'Hit 5 personal records.', '🔥');
      if (prs >= 20) await assign('20_PRs', 'Record Breaker', 'Hit 20 personal records.', '💎');

      // Step achievements
      if (maxSteps >= 10000) await assign('10k_steps', '10k Club', 'Walked 10,000 steps in a single day.', '🏃');
      if (maxSteps >= 20000) await assign('20k_steps', 'Marathon Walker', 'Walked 20,000 steps in a single day.', '🏅');
      if (maxSteps >= 42195) await assign('marathon_steps', 'Full Marathon', 'Walked the distance of a marathon in steps.', '🌍');

      // STREAK ACHIEVEMENTS - Use proper streak calculator
      const { incrementStreak } = await import('./streakCalculator');
      const result = await incrementStreak('workout');

      if (result.current >= 7) await assign('7_day_streak', 'Weekly Warrior', '7-day consecutive workout streak.', '🛡️');
      if (result.current >= 14) await assign('14_day_streak', 'Bi-Weekly Beast', '14-day consecutive workout streak.', '⚔️');
      if (result.current >= 30) await assign('30_day_streak', 'Monthly Legend', '30-day consecutive workout streak.', '👑');
      if (result.current >= 90) await assign('90_day_streak', 'Quarterly Titan', '90-day consecutive workout streak.', '🏔️');

      if (result.current > 0 && result.current >= result.best && result.current > 1) {
        // Just set a new best streak
        console.log(`🏆 New best streak: ${result.current} days!`);
      }

    } catch (e) {
      console.warn('Achievement check error', e);
    }
  }, 500);
}
