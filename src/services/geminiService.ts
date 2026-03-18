// filepath: src/services/geminiService.ts
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NetInfoState, fetch as fetchNetInfo } from '@react-native-community/netinfo';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const RATE_LIMIT_KEY = 'gemini_rate_limit';
const MAX_CALLS_PER_HOUR = 10;

export interface DetectedFoodItem {
  name: string;
  estimated_grams: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
}

export interface BodyFatResult {
  minPct: number;
  maxPct: number;
  category: string;
  notes: string;
}

async function checkRateLimit(): Promise<boolean> {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  try {
    const data = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    let timestamps: number[] = data ? JSON.parse(data) : [];
    
    // clean up older timestamps
    timestamps = timestamps.filter(t => now - t < ONE_HOUR);
    
    if (timestamps.length >= MAX_CALLS_PER_HOUR) {
      return false; // rate limited
    }
    
    timestamps.push(now);
    await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
    return true;
  } catch (e) {
    return true; // proceed if error
  }
}

async function prepareImageBase64(uri: string): Promise<string> {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return compressed.base64 || '';
}

function parseGeminiJsonResponse<T>(responseText: string): T {
  const firstBracket = responseText.indexOf('[');
  const lastBracket = responseText.lastIndexOf(']');
  
  if (firstBracket === -1 || lastBracket === -1) {
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(responseText.substring(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('Could not find JSON structure in response');
  }
  
  return JSON.parse(responseText.substring(firstBracket, lastBracket + 1)) as T;
}

export async function analyzeFoodImage(uri: string): Promise<DetectedFoodItem[]> {
  const netInfo = await fetchNetInfo();
  if (!netInfo.isConnected) throw new Error('Offline. Cannot use AI features.');

  const canProceed = await checkRateLimit();
  if (!canProceed) throw new Error('Rate limit exceeded (10 calls per hour). Try again later.');

  const base64 = await prepareImageBase64(uri);
  
  const prompt = `You are a nutrition expert. Analyze this food image. Identify all food items visible and estimate their portion sizes (in grams) and macros PER 100g. Return a JSON array strictly. Do not include markdown. Format: [{"name": string, "estimated_grams": number, "calories_per_100g": number, "protein_per_100g": number, "carbs_per_100g": number, "fat_per_100g": number, "fiber_per_100g": number}]`;

  const response = await axios.post(API_URL, {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: base64 } }
      ]
    }]
  }, { headers: { 'Content-Type': 'application/json' }});

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No valid response from Gemini');

  return parseGeminiJsonResponse<DetectedFoodItem[]>(text);
}

export async function analyzeBodyFat(uri: string): Promise<BodyFatResult> {
  const netInfo = await fetchNetInfo();
  if (!netInfo.isConnected) throw new Error('Offline. Cannot use AI features.');

  const canProceed = await checkRateLimit();
  if (!canProceed) throw new Error('Rate limit: Try again later.');

  const base64 = await prepareImageBase64(uri);
  
  const prompt = `You are a fitness expert evaluating body composition visually. Return ONLY a single JSON object. Format: {"minPct": number, "maxPct": number, "category": string, "notes": string}`;

  const response = await axios.post(API_URL, {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: base64 } }
      ]
    }]
  }, { headers: { 'Content-Type': 'application/json' }});

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No valid response from Gemini');

  return parseGeminiJsonResponse<BodyFatResult>(text);
}
