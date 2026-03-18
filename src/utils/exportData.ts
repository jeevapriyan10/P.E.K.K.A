import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from '../lib/database';

export async function exportUserData() {
  try {
    const db = await getDb();
    
    // Fetch data from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateLimit = ninetyDaysAgo.toISOString().split('T')[0];

    // Food Entries
    const foodItems: any[] = await db.getAllAsync(
      'SELECT * FROM food_entries WHERE date >= ? ORDER BY date DESC', 
      [dateLimit]
    );
    
    // Workout Sessions
    const workouts: any[] = await db.getAllAsync(
      'SELECT * FROM workout_sessions WHERE date >= ? ORDER BY date DESC',
      [dateLimit]
    );

    // Weight Logs
    const weights: any[] = await db.getAllAsync(
      'SELECT * FROM weight_logs WHERE date >= ? ORDER BY date DESC',
      [dateLimit]
    );

    // Step Logs
    const steps: any[] = await db.getAllAsync(
      'SELECT * FROM step_logs WHERE date >= ? ORDER BY date DESC',
      [dateLimit]
    );

    let csvContent = 'P.E.K.K.A Data Export - Last 90 Days\n\n';

    // Food CSV
    csvContent += 'NUTRITION LOG\n';
    csvContent += 'Date,Meal,Food,Amount,Calories,Protein,Carbs,Fat\n';
    foodItems.forEach(item => {
      csvContent += `${item.date},${item.meal_type},"${item.food_name}",${item.grams},${item.calories},${item.protein},${item.carbs},${item.fat}\n`;
    });
    csvContent += '\n';

    // Workout CSV
    csvContent += 'WORKOUT LOG\n';
    csvContent += 'Date,Name,Duration(m),Volume(kg),RPE,Notes\n';
    workouts.forEach(item => {
      csvContent += `${item.date},"${item.name}",${item.duration_minutes},${item.total_volume},${item.rpe_score},"${item.notes || ''}"\n`;
    });
    csvContent += '\n';

    // Weight CSV
    csvContent += 'WEIGHT LOG\n';
    csvContent += 'Date,Weight(kg),Notes\n';
    weights.forEach(item => {
      csvContent += `${item.date},${item.weight_kg},"${item.note || ''}"\n`;
    });
    csvContent += '\n';

    // Steps CSV
    csvContent += 'STEP LOG\n';
    csvContent += 'Date,Steps,Distance(km),Calories\n';
    steps.forEach(item => {
      csvContent += `${item.date},${item.step_count},${item.distance_km},${item.calories_burned}\n`;
    });

    const fileName = 'pekka_export.csv';
    // @ts-ignore
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // @ts-ignore
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      // @ts-ignore
      encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export P.E.K.K.A Data',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      alert('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  }
}
