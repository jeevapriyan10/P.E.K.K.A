// filepath: src/services/ai/hybrid.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeFoodImage as geminiAnalyzeFood } from '../geminiService';
import { contentModerationService } from '../contentModerationService';
import localFoodClassifier, { FoodItem } from './local/foodClassifier';
import localContentModerator, { ModerationResult } from './local/contentModerator';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const AI_PREFER_OFFLINE_KEY = 'ai_prefer_offline';

// Simple string hash for cache keys
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function getCache(key: string): Promise<{ result: any; timestamp: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (now - parsed.timestamp > CACHE_TTL) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function setCache(key: string, result: any): Promise<void> {
  try {
    const data = { result, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[HybridAI] Cache set failed:', e);
  }
}

async function getPreferOffline(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(AI_PREFER_OFFLINE_KEY);
    return val === '1';
  } catch {
    return false;
  }
}

export async function analyzeFoodImage(imageUri: string): Promise<FoodItem[]> {
  const netState = await NetInfo.fetch();
  const isOnline = netState.isConnected === true;
  const preferOffline = await getPreferOffline();

  const cacheKey = `food_cache_${hashString(imageUri)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log('[HybridAI] Using cached food analysis result');
    return cached.result;
  }

  // If user prefers offline or no internet, use local immediately
  if (preferOffline || !isOnline) {
    console.log('[HybridAI] Offline mode, using local food classifier');
    const result = await localFoodClassifier.predict(imageUri);
    await setCache(cacheKey, result);
    return result;
  }

  // Online and prefer cloud: try cloud first (Gemini)
  try {
    console.log('[HybridAI] Trying cloud food analysis');
    const result = await geminiAnalyzeFood(imageUri);
    await setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('[HybridAI] Cloud analysis failed, falling back to local:', error);
    const result = await localFoodClassifier.predict(imageUri);
    await setCache(cacheKey, result);
    return result;
  }
}

export async function moderatePost(
  content: { text: string; hasImage: boolean; imageBase64?: string },
  options?: { userId?: string; strictness?: 1 | 2 | 3 }
): Promise<ModerationResult> {
  const netState = await NetInfo.fetch();
  const isOnline = netState.isConnected === true;
  const preferOffline = await getPreferOffline();

  // Cache for moderation is less useful (text changes often), so skip caching

  // If user prefers offline or no internet, use local only
  if (preferOffline || !isOnline) {
    console.log('[HybridAI] Offline mode, using local content moderation');
    return localContentModerator.moderatePost(content.text, options);
  }

  // Online: try local first (cheaper)
  console.log('[HybridAI] Trying local content moderation first');
  const localResult = localContentModerator.moderatePost(content.text, options);

  // If local confidence is high enough, use it
  if (localResult.confidence >= 0.6) {
    console.log('[HybridAI] Local moderation sufficient (confidence:', localResult.confidence, ')');
    return localResult;
  }

  // Confidence low: fallback to cloud for better accuracy
  console.log('[HybridAI] Local confidence low (', localResult.confidence, '), trying cloud');
  try {
    const cloudResult = await contentModerationService.moderatePost(content);
    return cloudResult;
  } catch (error) {
    console.warn('[HybridAI] Cloud moderation failed, using local anyway:', error);
    return localResult;
  }
}

export async function setPreferOffline(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AI_PREFER_OFFLINE_KEY, enabled ? '1' : '0');
  } catch (e) {
    console.warn('[HybridAI] Failed to save offline preference:', e);
  }
}

export async function getPreferOfflineSetting(): Promise<boolean> {
  return getPreferOffline();
}

export default {
  analyzeFoodImage,
  moderatePost,
  setPreferOffline,
  getPreferOfflineSetting
};
