// filepath: src/services/contentModerationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ModerationResult {
  approved: boolean;
  reason: string;
  category: 'workout' | 'nutrition' | 'progress' | 'tip' | 'motivation' | 'rejected';
  confidence: number;
}

const STORAGE_KEY_MODERATION_COUNT = 'moderation_call_count';
const STORAGE_KEY_MODERATION_DATE = 'moderation_call_date';
const MAX_CALLS_PER_DAY = 30;

export const contentModerationService = {
  async moderatePost(content: { text: string; hasImage: boolean; imageBase64?: string }): Promise<ModerationResult> {
    try {
      // 1. Check Rate Limit
      const isAllowed = await this.checkRateLimit();
      if (!isAllowed) {
        return { approved: true, reason: 'Moderation offline', category: 'workout', confidence: 0.5 };
      }

      // 2. Call Gemini
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY;
      if (!apiKey) throw new Error('No Gemini API key');

      const prompt = `You are a content moderator for a fitness-only social platform. Analyze this post and determine if it is appropriate.
APPROVED categories: workout logs, PR achievements, meal photos/nutrition, fitness tips, progress updates, exercise advice, recovery tips, supplement information (no illegal substances), motivational fitness content, body transformation (tasteful), recipe sharing.
REJECTED categories: cyberbullying or any negative targeting of individuals, extreme diet culture content promoting dangerous restriction, content unrelated to fitness/nutrition/wellness, hate speech or discrimination, inappropriate sexual content, dangerous training advice, promotion of prohibited substances, spam or advertisements.
Post text: '${content.text}'
Return ONLY valid JSON: {"approved": true/false, "reason": "short explanation", "category": "workout|nutrition|progress|tip|motivation|rejected", "confidence": 0.0-1.0}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!response.ok) throw new Error('Gemini API call failed');

      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      const result: ModerationResult = JSON.parse(resultText);
      
      await this.incrementCount();
      return result;

    } catch (error) {
      console.error('Moderation error:', error);
      // Offline fallback
      return { approved: true, reason: 'Moderation offline (Fallback)', category: 'workout', confidence: 0.5 };
    }
  },

  async checkRateLimit(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = await AsyncStorage.getItem(STORAGE_KEY_MODERATION_DATE);
    
    if (lastDate !== today) {
      await AsyncStorage.setItem(STORAGE_KEY_MODERATION_DATE, today);
      await AsyncStorage.setItem(STORAGE_KEY_MODERATION_COUNT, '0');
      return true;
    }

    const count = parseInt(await AsyncStorage.getItem(STORAGE_KEY_MODERATION_COUNT) || '0');
    return count < MAX_CALLS_PER_DAY;
  },

  async incrementCount() {
    const count = parseInt(await AsyncStorage.getItem(STORAGE_KEY_MODERATION_COUNT) || '0');
    await AsyncStorage.setItem(STORAGE_KEY_MODERATION_COUNT, (count + 1).toString());
  }
};
