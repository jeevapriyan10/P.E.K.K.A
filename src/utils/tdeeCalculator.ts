// filepath: src/utils/tdeeCalculator.ts
export interface UserProfile {
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
  activity_level: string;
}

export function calculateTDEE(user: UserProfile) {
  const { weight_kg, height_cm, age, sex, goal, activity_level } = user;

  // BMR Calculation (Mifflin-St Jeor)
  let bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  if (sex.toLowerCase() === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  // Activity Multiplier
  let activityMultiplier = 1.2;
  const activityMap: Record<string, number> = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very active': 1.9
  };
  const normalizedActivity = activity_level.toLowerCase();
  if (activityMap[normalizedActivity]) {
    activityMultiplier = activityMap[normalizedActivity];
  }

  let tdee = bmr * activityMultiplier;

  // Goal Adjustment
  const normalizedGoal = goal.toLowerCase();
  let proteinMultiplier = 1.6;

  if (normalizedGoal.includes('lose fat') || normalizedGoal.includes('lose')) {
    tdee -= 500;
    proteinMultiplier = 1.8;
  } else if (normalizedGoal.includes('build muscle') || normalizedGoal.includes('build')) {
    tdee += 300;
    proteinMultiplier = 2.2;
  } else if (normalizedGoal.includes('maintain')) {
    proteinMultiplier = 1.6;
  } else if (normalizedGoal.includes('get fitter')) {
    proteinMultiplier = 1.8;
  }

  const calories = Math.round(tdee);
  
  // Macros
  const protein_g = Math.round(weight_kg * proteinMultiplier);
  const fat_g = Math.round((calories * 0.25) / 9); // 25% of calories
  
  const proteinCalories = protein_g * 4;
  const fatCalories = fat_g * 9;
  const remainingCalories = calories - proteinCalories - fatCalories;
  
  const carbs_g = Math.round(Math.max(0, remainingCalories / 4));

  return {
    calories,
    protein_g,
    carbs_g,
    fat_g
  };
}
