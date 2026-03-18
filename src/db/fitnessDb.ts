// filepath: src/db/fitnessDb.ts
import { getDb } from '../lib/database';
import { exercisesLibrary } from '../data/exercises';

export async function seedExercises() {
  const db = await getDb();
  const res: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM exercises_library');
  if (res.count === 0) {
    for (const ex of exercisesLibrary) {
      await db.runAsync(
        'INSERT INTO exercises_library (name, muscle_group_primary, muscle_groups_secondary, category, equipment, met_value) VALUES (?, ?, ?, ?, ?, ?)',
        [ex.name, ex.muscle_group_primary, ex.muscle_groups_secondary, ex.category, ex.equipment, ex.met_value]
      );
    }
  }
}

export async function searchExercises(query: string, filter?: string) {
  const db = await getDb();
  let qText = 'SELECT * FROM exercises_library WHERE name LIKE ?';
  const params: any[] = [`%${query}%`];
  if (filter && filter !== 'All') {
    qText += ' AND muscle_group_primary = ?';
    params.push(filter);
  }
  return await db.getAllAsync(qText + ' LIMIT 30', params);
}

export async function getPersonalRecords(exerciseName: string) {
  const db = await getDb();
  const result: any = await db.getFirstAsync(
    'SELECT MAX(weight) as max_weight, MAX(reps) as max_reps FROM personal_records WHERE exercise_name = ?',
    [exerciseName]
  );
  return result || { max_weight: 0, max_reps: 0 };
}

export async function updatePersonalRecord(exerciseName: string, weight: number, reps: number) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO personal_records (exercise_name, weight, reps, date, achieved_at) VALUES (?, ?, ?, date("now"), datetime("now"))',
    [exerciseName, weight, reps]
  );
}

export async function saveWorkoutSession(session: { name: string, duration_minutes: number, total_volume: number, calories_burned: number, notes: string, rpe_score: number }, exercises: any[]) {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO workout_sessions (date, name, duration_minutes, total_volume, calories_burned, notes, rpe_score, created_at) VALUES (date("now"), ?, ?, ?, ?, ?, ?, datetime("now"))',
    [session.name, session.duration_minutes, session.total_volume, session.calories_burned, session.notes, session.rpe_score]
  );
  
  const sessionId = res.lastInsertRowId;
  for (const ex of exercises) {
    for (const set of ex.sets) {
       await db.runAsync(
         'INSERT INTO workout_exercises (session_id, exercise_name, set_number, weight, reps, is_pr) VALUES (?, ?, ?, ?, ?, ?)',
         [sessionId, ex.name, set.set_number, set.weight, set.reps, set.is_pr ? 1 : 0]
       );
    }
  }
  return sessionId;
}

export async function saveDailySteps(date: string, steps: number, distance_km: number, calories_burned: number) {
  const db = await getDb();
  const exists: any = await db.getFirstAsync('SELECT id FROM step_logs WHERE date = ?', [date]);
  if (exists) {
    await db.runAsync(
      'UPDATE step_logs SET step_count = ?, distance_km = ?, calories_burned = ?, updated_at = datetime("now") WHERE date = ?',
      [steps, distance_km, calories_burned, date]
    );
  } else {
    await db.runAsync(
      'INSERT INTO step_logs (date, step_count, distance_km, calories_burned, updated_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [date, steps, distance_km, calories_burned]
    );
  }
}

export async function getWorkoutHistory() {
  const db = await getDb();
  return await db.getAllAsync(`
    SELECT id, date, name, duration_minutes, total_volume, 'strength' as category FROM workout_sessions
    UNION ALL
    SELECT id, date, type as name, duration_minutes, calories_burned as total_volume, 'cardio' as category FROM cardio_sessions
    ORDER BY date DESC LIMIT 20
  `);
}

export async function getSessionDetails(id: number) {
  const db = await getDb();
  const session = await db.getFirstAsync('SELECT * FROM workout_sessions WHERE id = ?', [id]);
  const exercises = await db.getAllAsync(
     `SELECT e.*, l.muscle_group_primary 
      FROM workout_exercises e
      LEFT JOIN exercises_library l ON e.exercise_name = l.name 
      WHERE e.session_id = ?`,
     [id]
  );
  return { session, exercises };
}
