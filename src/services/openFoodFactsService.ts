// filepath: src/services/openFoodFactsService.ts
import axios from 'axios';
import { fetch as fetchNetInfo } from '@react-native-community/netinfo';

export interface OffFoodResult {
  name: string;
  barcode: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
}

export async function fetchFoodByBarcode(barcode: string): Promise<OffFoodResult | null> {
  const netInfo = await fetchNetInfo();
  if (!netInfo.isConnected) {
     console.warn('Network offline, cannot query OpenFoodFacts');
     return null;
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await axios.get(url);
    if (response.data?.status === 1) {
      const p = response.data.product;
      const nut = p.nutriments;
      return {
        name: p.product_name || 'Unknown Product',
        barcode: barcode,
        calories_per_100g: nut['energy-kcal_100g'] || 0,
        protein_per_100g: nut['proteins_100g'] || 0,
        carbs_per_100g: nut['carbohydrates_100g'] || 0,
        fat_per_100g: nut['fat_100g'] || 0,
        fiber_per_100g: nut['fiber_100g'] || 0
      };
    }
  } catch (e) {
    console.warn("OpenFoodFacts query failed", e);
  }
  return null;
}
