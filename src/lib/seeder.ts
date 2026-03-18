// filepath: src/lib/seeder.ts
import { getDb } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants/storageKeys';

export async function seedTestData() {
  const db = await getDb();
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // 1. Ensure a user exists
  const user: any = await db.getFirstAsync('SELECT * FROM users LIMIT 1');
  if (!user) {
    await db.runAsync(
      'INSERT INTO users (name, age, sex, height_cm, weight_kg, goal, activity_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
      ['Test User', 28, 'male', 178, 85, 'lose fat', 'moderate']
    );
    await AsyncStorage.setItem(StorageKeys.ONBOARDING_COMPLETE, '1');
  }

  // 2. Add 3 weight entries (different dates)
  const wDates = [0, 2, 5].map(days => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return formatDate(d);
  });
  
  await db.runAsync('DELETE FROM weight_logs');
  await db.runAsync('INSERT INTO weight_logs (date, weight_kg, note) VALUES (?, ?, ?)', [wDates[2], 86.5, 'Starting']);
  await db.runAsync('INSERT INTO weight_logs (date, weight_kg, note) VALUES (?, ?, ?)', [wDates[1], 85.8, 'Moving down']);
  await db.runAsync('INSERT INTO weight_logs (date, weight_kg, note) VALUES (?, ?, ?)', [wDates[0], 85.0, 'Today']);

  // 3. Add activity data for weekly report
  // Add some workouts from the last 7 days
  for (let i = 0; i < 4; i++) {
     const d = new Date(); d.setDate(d.getDate() - i);
     await db.runAsync('INSERT INTO workout_sessions (name, date, duration_minutes, total_volume, rpe_score) VALUES (?, ?, ?, ?, ?)', 
        ['Morning Power', formatDate(d), 45, 5000, 7]);
  }

  // Add nutrition for today
  const t = formatDate(today);
  await db.runAsync('DELETE FROM food_entries WHERE date = ?', [t]);
  await db.runAsync('INSERT INTO food_entries (date, meal_type, food_name, grams, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [t, 'Breakfast', 'Oats', 100, 389, 16.9, 66.3, 6.9]);
  await db.runAsync('INSERT INTO food_entries (date, meal_type, food_name, grams, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [t, 'Lunch', 'Chicken (breast)', 200, 330, 62, 0, 7.2]);

  // Add steps for today
  await db.runAsync('DELETE FROM step_logs WHERE date = ?', [t]);
  await db.runAsync('INSERT INTO step_logs (date, step_count, distance_km, calories_burned) VALUES (?, ?, ?, ?)',
    [t, 8500, 6.1, 350]);

  // 4. Seed Exercises and Foods if not present
  const exCount: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM exercises_library');
  if (exCount.c === 0) {
    const { exercisesLibrary } = require('../data/exercises');
    for (const ex of exercisesLibrary) {
      await db.runAsync(
        'INSERT INTO exercises_library (name, muscle_group_primary, muscle_groups_secondary, category, equipment, met_value) VALUES (?, ?, ?, ?, ?, ?)',
        [ex.name, ex.muscle_group_primary, ex.muscle_groups_secondary, ex.category, ex.equipment, ex.met_value]
      );
    }
  }

  const foodCount: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM food_database');
  if (foodCount.c === 0) {
    const { commonFoods } = require('../data/commonFoods');
    for (const food of commonFoods) {
      await db.runAsync(
        'INSERT INTO food_database (name, barcode, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        [food.name, food.barcode, food.calories, food.protein, food.carbs, food.fat, food.fiber, 'system']
      );
    }
  }

  console.log("Test data seeded successfully");
}
