// filepath: src/services/aiService.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDb } from '../lib/database';
import NetInfo from '@react-native-community/netinfo';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Validate API key exists
let API_URL: string;
if (GEMINI_API_KEY) {
  API_URL = `${BASE_URL}?key=${GEMINI_API_KEY}`;
} else {
  // API URL will be invalid; callGemini will return fallback
  API_URL = BASE_URL;
}

const DAILY_LIMIT = 20;
const CACHE_EXPIRY_HOURS = 24;

export interface DailyData {
  calories: number;
  protein: number;
  steps: number;
  workoutDone: boolean;
}

export interface WeekSummary {
  avgCalories: number;
  avgSteps: number;
  workoutsCount: number;
  weightTrend: 'up' | 'down' | 'stable';
}

export interface DayData {
  date: string;
  calories: number;
  protein: number;
  steps: number;
  workoutDone: boolean;
  weight?: number;
}

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 1000000).toString();
};

async function checkRateLimit(): Promise<boolean> {
  const date = new Date().toISOString().split('T')[0];
  const key = `ai_calls_${date}`;
  const countStr = await AsyncStorage.getItem(key);
  const count = countStr ? parseInt(countStr) : 0;

  if (count >= DAILY_LIMIT) return false;

  await AsyncStorage.setItem(key, (count + 1).toString());
  return true;
}

async function getCachedResponse(promptHash: string): Promise<string | null> {
  const db = await getDb();
  const now = new Date().toISOString();
  const cached: any = await db.getFirstAsync(
    'SELECT response FROM ai_cache WHERE prompt_hash = ? AND expires_at > ?',
    [promptHash, now]
  );
  return cached?.response || null;
}

async function setCachedResponse(promptHash: string, response: string) {
  const db = await getDb();
  const expiresAt = new Date(Date.now() + CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    'INSERT OR REPLACE INTO ai_cache (prompt_hash, response, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [promptHash, response, createdAt, expiresAt]
  );
}

const FALLBACK_RESPONSE = "I'm currently resting. Please check back later for more AI insights!";

async function callGemini(prompt: string): Promise<string> {
  // Check if API key is configured
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_KEY in your environment.');
    return FALLBACK_RESPONSE;
  }

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('Offline');
  }

  const promptHash = simpleHash(prompt);
  const cached = await getCachedResponse(promptHash);
  if (cached) return cached;

  const canCall = await checkRateLimit();
  if (!canCall) return FALLBACK_RESPONSE;

  try {
    const response = await axios.post(API_URL, {
      contents: [{ parts: [{ text: prompt }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || FALLBACK_RESPONSE;
    await setCachedResponse(promptHash, text);
    return text;
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.warn('Gemini log: Rate limited (429)');
    } else {
      console.warn('Gemini API Error:', error?.message);
    }
    return FALLBACK_RESPONSE;
  }
}

export const aiService = {
  async getDailySummary(data: DailyData): Promise<string> {
    const prompt = `Act as a professional fitness coach. Based on today's data: ${data.calories} kcal, ${data.protein}g protein, ${data.steps} steps, Workout: ${data.workoutDone ? 'Yes' : 'No'}. Provide a personal 2-sentence summary/motivation for the user. Keep it encouraging and concise.`;
    return await callGemini(prompt);
  },

  async getMealSuggestions(remainingMacros: { calories: number, protein: number, carbs: number, fat: number }): Promise<string[]> {
    const prompt = `Suggest 3 healthy meal ideas for someone with these remaining macros today: ${remainingMacros.calories} kcal, ${remainingMacros.protein}g protein, ${remainingMacros.carbs}g carbs, ${remainingMacros.fat}g fat. Return ONLY the meal names separated by newlines.`;
    const res = await callGemini(prompt);
    return res.split('\n').filter(s => s.trim().length > 0).map(s => s.replace(/^\d+\.\s*/, '').trim());
  },

  async getWeeklyReport(weekData: WeekSummary): Promise<{ grade: string, tips: string[], highlights: string[] }> {
    const prompt = `Analyze this weekly progress: Avg Calories: ${weekData.avgCalories}, Avg Steps: ${weekData.avgSteps}, Workouts: ${weekData.workoutsCount}, Weight Trend: ${weekData.weightTrend}. 
    Return a JSON object with:
    - grade: A letter from A+ to F
    - tips: Array of 3 specific improvement tips
    - highlights: Array of 2 positive highlights.
    No markdown, just JSON.`;

    const res = await callGemini(prompt);
    try {
      // Basic JSON extraction in case Gemini wraps it in markdown
      const jsonMatch = res.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : res);
    } catch (e) {
      return { grade: 'B', tips: ['Keep moving', 'Monitor intake', 'Stay hydrated'], highlights: ['Consistent logging', 'Active week'] };
    }
  },

  async getTipOfDay(): Promise<string> {
    const date = new Date().toISOString().split('T')[0];
    const prompt = `Give me one unique, short fitness or nutrition tip for ${date}. Maximum 15 words.`;
    return await callGemini(prompt);
  },

  async detectAnomalies(sevenDayData: DayData[]): Promise<string | null> {
    if (sevenDayData.length < 2) return null;

    // Logic based triggers (manual detection as requested)
    const recent = sevenDayData.slice(-5); // Look at last 5 days

    // <500 calories for 2+ days
    let lowCalCount = 0;
    for (let i = 0; i < Math.min(recent.length, 3); i++) {
      if (recent[recent.length - 1 - i].calories < 500 && recent[recent.length - 1 - i].calories > 0) lowCalCount++;
    }
    if (lowCalCount >= 2) return "You seem to be eating very little lately. Make sure you're fueling your body!";

    // No workout for 5+ days
    if (sevenDayData.length >= 5 && sevenDayData.every(d => !d.workoutDone)) {
      return "Rest is important, but you've been away from the gym for a while. Shall we get a light session in?";
    }

    // Protein <50% of goal (assuming avg goal 150g) for 3+ days
    let lowProteinCount = 0;
    for (let i = 0; i < Math.min(recent.length, 3); i++) {
      if (recent[recent.length - 1 - i].protein < 50) lowProteinCount++;
    }
    if (lowProteinCount >= 3) return "Your protein intake has been low. Try adding some lean meat, eggs, or legumes to your next meal.";

    // Weight loss >1kg in 3 days
    if (sevenDayData.length >= 3) {
      const w1 = sevenDayData[sevenDayData.length - 3].weight;
      const w2 = sevenDayData[sevenDayData.length - 1].weight;
      if (w1 && w2 && (w1 - w2) > 1.0) {
        return "You've lost weight quickly. Ensure you're staying hydrated and not losing muscle mass!";
      }
    }

    return null;
  }
};
