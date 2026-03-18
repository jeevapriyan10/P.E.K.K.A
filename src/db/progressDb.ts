// filepath: src/db/progressDb.ts
import { getDb } from '../lib/database';

export async function addWeightLog(weight: number, note?: string) {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  await db.runAsync(
    'INSERT INTO weight_logs (date, weight_kg, note, logged_at) VALUES (?, ?, ?, datetime("now"))',
    [today, weight, note || null]
  );
  
  // Also update latest weight in users table for calculations
  await db.runAsync('UPDATE users SET weight_kg = ?, updated_at = datetime("now") WHERE id = (SELECT id FROM users ORDER BY id DESC LIMIT 1)', [weight]);
}

export async function getWeightLogs(limit: number = 30) {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM weight_logs ORDER BY date DESC LIMIT ?', [limit]);
}

export async function addAchievement(type: string, name: string, desc: string) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR IGNORE INTO achievements (achievement_type, name, description, earned_at) VALUES (?, ?, ?, datetime("now"))',
    [type, name, desc]
  );
}

export async function getAchievements() {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM achievements ORDER BY earned_at DESC');
}
