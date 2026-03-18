// filepath: src/components/dashboard/StreakHeatmap.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  data: {[key: string]: number}; // date: count
  title: string;
}

export default function StreakHeatmap({ data, title }: Props) {
  // Simple 7x4 grid for "consistency" view
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {days.map((date, i) => {
          const count = data[date] || 0;
          let color = Colors.dark.bg3;
          if (count > 0) color = Colors.dark.lime;
          if (count > 2) color = Colors.dark.cyan;
          
          return (
            <View 
              key={date} 
              style={[styles.box, { backgroundColor: color }]} 
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.miniBox, {backgroundColor: Colors.dark.bg3}]} />
        <View style={[styles.miniBox, {backgroundColor: Colors.dark.lime}]} />
        <View style={[styles.miniBox, {backgroundColor: Colors.dark.cyan}]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.bg2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  box: {
    width: 25,
    height: 25,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendText: {
    color: Colors.dark.muted,
    fontSize: 10,
  },
  miniBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
