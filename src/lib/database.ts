// filepath: src/lib/database.ts
import * as SQLite from 'expo-sqlite';

export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        age INTEGER,
        sex TEXT,
        height_cm REAL,
        weight_kg REAL,
        goal TEXT,
        activity_level TEXT,
        units TEXT DEFAULT 'metric',
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS food_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        meal_type TEXT,
        food_name TEXT,
        grams REAL,
        calories REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        logged_at TEXT
      );

      CREATE TABLE IF NOT EXISTS food_database (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        barcode TEXT UNIQUE,
        calories_per_100g REAL,
        protein_per_100g REAL,
        carbs_per_100g REAL,
        fat_per_100g REAL,
        fiber_per_100g REAL,
        source TEXT DEFAULT 'custom',
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS water_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        amount_ml INTEGER,
        logged_at TEXT
      );

      CREATE TABLE IF NOT EXISTS supplements_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        name TEXT,
        dosage TEXT,
        time_taken TEXT,
        taken INTEGER DEFAULT 0,
        logged_at TEXT
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT,
        duration_minutes INTEGER,
        total_volume REAL,
        calories_burned REAL,
        rpe_score INTEGER,
        notes TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        exercise_name TEXT,
        set_number INTEGER,
        weight REAL,
        reps INTEGER,
        is_pr INTEGER,
        FOREIGN KEY(session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS exercises_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        muscle_group_primary TEXT,
        muscle_groups_secondary TEXT,
        category TEXT,
        equipment TEXT,
        met_value REAL
      );

      CREATE TABLE IF NOT EXISTS personal_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_name TEXT UNIQUE,
        weight REAL,
        reps INTEGER,
        date TEXT,
        achieved_at TEXT
      );

      CREATE TABLE IF NOT EXISTS cardio_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        type TEXT,
        duration_minutes INTEGER,
        distance_km REAL,
        calories_burned REAL,
        intensity TEXT,
        notes TEXT,
        logged_at TEXT
      );

      CREATE TABLE IF NOT EXISTS step_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        step_count INTEGER,
        distance_km REAL,
        calories_burned REAL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS workout_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        exercises_json TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS weight_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        weight_kg REAL,
        note TEXT,
        logged_at TEXT
      );

      CREATE TABLE IF NOT EXISTS progress_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        photo_path TEXT,
        weight_kg REAL,
        body_fat_pct REAL,
        note TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        achievement_type TEXT UNIQUE,
        name TEXT,
        description TEXT,
        earned_at TEXT
      );

      CREATE TABLE IF NOT EXISTS streaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT UNIQUE,
        current_count INTEGER,
        best_count INTEGER,
        last_date TEXT
      );

      CREATE TABLE IF NOT EXISTS ai_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_hash TEXT UNIQUE,
        response TEXT,
        created_at TEXT,
        expires_at TEXT
      );

      CREATE TABLE IF NOT EXISTS social_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        display_name TEXT,
        bio TEXT,
        avatar_path TEXT,
        is_public INTEGER DEFAULT 1,
        share_workouts INTEGER DEFAULT 1,
        share_nutrition INTEGER DEFAULT 1,
        share_steps INTEGER DEFAULT 1,
        share_achievements INTEGER DEFAULT 1,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS community_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT UNIQUE,
        name TEXT,
        description TEXT,
        icon TEXT,
        creator_username TEXT,
        member_count INTEGER DEFAULT 0,
        shared_goal_type TEXT,
        shared_goal_target REAL,
        goal_period TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id_ref TEXT,
        username TEXT,
        display_name TEXT,
        avatar TEXT,
        joined_at TEXT,
        last_contribution REAL DEFAULT 0,
        last_synced_at TEXT,
        FOREIGN KEY(group_id_ref) REFERENCES community_groups(group_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS feed_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_username TEXT,
        content_type TEXT,
        text_content TEXT,
        media_path TEXT,
        workout_ref_id INTEGER,
        nutrition_summary TEXT,
        likes_count INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 1,
        ai_approved INTEGER DEFAULT 1,
        category TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS reported_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        reason TEXT,
        reported_at TEXT
      );

      CREATE TABLE IF NOT EXISTS social_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_username TEXT,
        following_username TEXT,
        profile_json TEXT,
        synced_at TEXT,
        created_at TEXT
      );
    `);
    
    // Developer Hotfixes for missing columns in existing DB
    try { await db.execAsync('ALTER TABLE social_connections ADD COLUMN profile_json TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE group_members ADD COLUMN group_id_ref TEXT'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE feed_posts ADD COLUMN ai_approved INTEGER DEFAULT 1'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE social_profile ADD COLUMN share_workouts INTEGER DEFAULT 1'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE social_profile ADD COLUMN share_nutrition INTEGER DEFAULT 1'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE social_profile ADD COLUMN share_steps INTEGER DEFAULT 1'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE social_profile ADD COLUMN share_achievements INTEGER DEFAULT 1'); } catch (e) {}
    try { await db.execAsync('ALTER TABLE feed_posts ADD COLUMN category TEXT'); } catch (e) {}

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('vitacore.db');
  }
  return dbPromise;
};
