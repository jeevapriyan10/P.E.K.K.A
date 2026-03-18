// filepath: src/components/nutrition/FoodEntryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  entry: any; // from SQLite
  onDelete: (id: number) => void;
}

export default function FoodEntryCard({ entry, onDelete }: Props) {
  const handleLongPress = () => {
    Alert.alert(
      "Delete Entry",
      `Are you sure you want to delete ${entry.food_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) }
      ]
    );
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} style={styles.card}>
      <View style={styles.details}>
        <Text style={styles.name}>{entry.food_name}</Text>
        <Text style={styles.sub}>{entry.grams}g • {entry.calories} kcal</Text>
      </View>
      <View style={styles.macros}>
        <Text style={[styles.macro, {color: Colors.dark.violet}]}>{entry.protein}g P</Text>
        <Text style={[styles.macro, {color: Colors.dark.lime}]}>{entry.carbs}g C</Text>
        <Text style={[styles.macro, {color: Colors.dark.rose}]}>{entry.fat}g F</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.dark.text, marginBottom: 4 },
  sub: { fontSize: 13, color: Colors.dark.muted },
  macros: { flexDirection: 'row', gap: 12 },
  macro: { fontSize: 13, fontWeight: 'bold' }
});
