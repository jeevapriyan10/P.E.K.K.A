// filepath: src/store/nutritionStore.ts
import { create } from 'zustand';

interface NutritionState {
  currentDate: string;
  selectedMealRange: string;
  setCurrentDate: (date: string) => void;
  setSelectedMealRange: (mealType: string) => void;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const useNutritionStore = create<NutritionState>((set) => ({
  currentDate: getTodayDateString(),
  selectedMealRange: 'Breakfast',
  setCurrentDate: (date: string) => set({ currentDate: date }),
  setSelectedMealRange: (mealType: string) => set({ selectedMealRange: mealType })
}));
