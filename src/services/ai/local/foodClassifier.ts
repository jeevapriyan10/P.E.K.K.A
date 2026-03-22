// filepath: src/services/ai/local/foodClassifier.ts
// Offline heuristic food estimator.
// Uses filename keyword matching + deterministic selection from Indian food DB.
// For production, integrate TFLite or similar for actual image analysis.

import { commonFoods } from '../../../data/commonFoods';

export interface FoodItem {
  name: string;
  estimated_grams: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
}

// Simple hash function for deterministic selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Keyword to food category mapping for filename hints
const KEYWORD_MAP: Record<string, string[]> = {
  'rice': ['Rice (white)', 'Rice (brown)'],
  'chicken': ['Chicken (breast)', 'Chicken (thigh)'],
  'egg': ['Eggs'],
  'paneer': ['Paneer'],
  'fish': ['Fish (salmon)', 'Fish (tuna)'],
  'roti': ['Roti/Chapati'],
  'dal': ['Dal (cooked)', 'Lentils'],
  'idli': ['Idli'],
  'dosa': ['Dosa'],
  'sambar': ['Sambar'],
  'vegetable': ['Mixed vegetables', 'Spinach', 'Broccoli', 'Potato', 'Sweet potato'],
  'potato': ['Potato', 'Sweet potato'],
  'fruit': ['Banana', 'Apple', 'Orange', 'Mango', 'Avocado'],
  'oats': ['Oats'],
  'bread': ['Bread (white)', 'Bread (wheat)'],
  'pasta': ['Pasta'],
  'nuts': ['Almonds', 'Cashews', 'Walnuts'],
  'milk': ['Milk (full cream)', 'Milk (skim)', 'Curd/Yogurt'],
  'oil': ['Olive oil', 'Ghee'],
  'butter': ['Butter'],
  'cheese': ['Cheese'],
  'protein': ['Protein powder (whey)']
};

// Typical serving sizes (grams) for common food categories
const SERVING_SIZES: Record<string, { min: number; max: number }> = {
  'Rice (white)': { min: 150, max: 300 },
  'Rice (brown)': { min: 150, max: 300 },
  'Roti/Chapati': { min: 40, max: 80 }, // per piece, but we'll estimate total
  'Dal (cooked)': { min: 200, max: 400 },
  'Chicken (breast)': { min: 120, max: 250 },
  'Chicken (thigh)': { min: 150, max: 300 },
  'Eggs': { min: 50, max: 150 }, // per egg
  'Paneer': { min: 100, max: 200 },
  'Milk (full cream)': { min: 200, max: 400 },
  'Curd/Yogurt': { min: 150, max: 300 },
  'Fish (salmon)': { min: 150, max: 250 },
  'Fish (tuna)': { min: 120, max: 200 },
  'Oats': { min: 40, max: 80 },
  'Bread (white)': { min: 60, max: 120 },
  'Potato': { min: 150, max: 300 },
  'Banana': { min: 100, max: 200 },
  'Apple': { min: 150, max: 250 }
  // default 100-200 for others
};

function getServingSize(foodName: string): number {
  const serving = SERVING_SIZES[foodName];
  if (serving) {
    return Math.floor(serving.min + Math.random() * (serving.max - serving.min));
  }
  return 150; // default medium portion
}

export class LocalFoodClassifier {
  async initialize(): Promise<boolean> {
    console.log('[LocalFoodClassifier] Heuristic classifier initialized');
    return true;
  }

  async predict(imageBase64OrUri: string): Promise<FoodItem[]> {
    // The input might be a file URI or base64. We'll treat it as a string to hash.
    const hash = hashString(imageBase64OrUri);
    const foods = commonFoods;

    // Try to match keywords in the string (if it's a filename with hints)
    let candidates = foods;
    for (const [keyword, matches] of Object.entries(KEYWORD_MAP)) {
      if (imageBase64OrUri.toLowerCase().includes(keyword)) {
        candidates = foods.filter(f => matches.includes(f.name));
        break;
      }
    }

    // Deterministically pick one food based on hash
    const index = hash % candidates.length;
    const selected = candidates[index];

    // Estimate portion size
    const estimated_grams = getServingSize(selected.name);

    // Return as single-item estimate
    return [{
      name: selected.name,
      estimated_grams,
      calories_per_100g: selected.calories,
      protein_per_100g: selected.protein,
      carbs_per_100g: selected.carbs,
      fat_per_100g: selected.fat,
      fiber_per_100g: selected.fiber
    }];
  }

  dispose(): void {
    console.log('[LocalFoodClassifier] Disposed');
  }
}

export default new LocalFoodClassifier();
