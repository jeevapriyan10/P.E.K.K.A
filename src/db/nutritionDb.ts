// filepath: src/db/nutritionDb.ts
import { getDb } from '../lib/database';
import { commonFoods } from '../data/commonFoods';

export async function seedCommonFoods() {
  const db = await getDb();
  const res: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM food_database');
  if (res.count === 0) {
    for (const food of commonFoods) {
      await db.runAsync(
        'INSERT INTO food_database (name, barcode, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
        [food.name, food.barcode, food.calories, food.protein, food.carbs, food.fat, food.fiber, 'system']
      );
    }
  }
}

export async function getFoodEntries(date: string) {
  const db = await getDb();
  return await db.getAllAsync('SELECT * FROM food_entries WHERE date = ? ORDER BY id DESC', [date]);
}

export async function addFoodEntry(entry: {
  date: string, meal_type: string, food_name: string, grams: number, calories: number, protein: number, carbs: number, fat: number, fiber: number
}) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO food_entries (date, meal_type, food_name, grams, calories, protein, carbs, fat, fiber, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
    [entry.date, entry.meal_type, entry.food_name, entry.grams, entry.calories, entry.protein, entry.carbs, entry.fat, entry.fiber]
  );
}

export async function deleteFoodEntry(id: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
}

export async function getWaterLog(date: string) {
  const db = await getDb();
  const log: any = await db.getFirstAsync('SELECT * FROM water_logs WHERE date = ?', [date]);
  return log ? log.amount_ml : 0;
}

export async function updateWaterLog(date: string, amount_ml: number) {
  const db = await getDb();
  const exists: any = await db.getFirstAsync('SELECT id FROM water_logs WHERE date = ?', [date]);
  if (exists) {
    if (amount_ml <= 0) {
      await db.runAsync('DELETE FROM water_logs WHERE date = ?', [date]);
    } else {
      await db.runAsync('UPDATE water_logs SET amount_ml = ?, logged_at = datetime("now") WHERE date = ?', [amount_ml, date]);
    }
  } else if (amount_ml > 0) {
    await db.runAsync('INSERT INTO water_logs (date, amount_ml, logged_at) VALUES (?, ?, datetime("now"))', [date, amount_ml]);
  }
}

export async function searchFoodDatabase(query: string) {
  const db = await getDb();
  const q = `%${query}%`;
  return await db.getAllAsync('SELECT * FROM food_database WHERE name LIKE ? LIMIT 20', [q]);
}

export async function addCustomFood(food: { name: string, barcode?: string, calories: number, protein: number, carbs: number, fat: number, fiber: number }) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO food_database (name, barcode, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))',
    [food.name, food.barcode || null, food.calories, food.protein, food.carbs, food.fat, food.fiber, 'custom']
  );
}
