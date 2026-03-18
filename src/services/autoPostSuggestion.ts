// filepath: src/services/autoPostSuggestion.ts
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

export const autoPostSuggestion = {
  suggestWorkoutPost(workoutName: string, volume: number, duration: number) {
    const text = `Just finished ${workoutName}! ${volume}kg total volume. ${duration} min. #P.E.K.K.A`;
    
    Alert.alert(
      "Share your workout?",
      "Would you like to post this workout to your fitness feed?",
      [
        { text: "Not now", style: "cancel" },
        { 
          text: "Share", 
          onPress: () => {
            // Ideally navigate to create-post with pre-filled text
            // router.push({ pathname: '/social/create-post', params: { text } });
          } 
        }
      ]
    );
  },

  suggestNutritionPost() {
    Alert.alert(
      "Share your nutrition day?",
      "You've logged 3 meals today. Want to share your nutrition summary with friends?",
      [
        { text: "Maybe later", style: "cancel" },
        { text: "Share", onPress: () => {} }
      ]
    );
  }
};
