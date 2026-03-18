// filepath: src/components/nutrition/MacroPieChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  size?: number;
}

export default function MacroPieChart({ 
  protein, carbs, fat, 
  proteinGoal = 150, carbsGoal = 200, fatGoal = 60,
  size = 140 
}: Props) {
  
  const strokeWidth = 12;
  const gap = 4;
  
  const renderRing = (val: number, goal: number, radius: number, color: string) => {
    const circumference = radius * 2 * Math.PI;
    const pct = Math.min(1, val / Math.max(1, goal));
    const offset = circumference - (pct * circumference);
    
    return (
      <G rotation="-90" origin={`${size/2}, ${size/2}`}>
        {/* Track */}
        <Circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke="#1A1A1A" strokeWidth={strokeWidth} 
          fill="none" 
        />
        {/* Fill */}
        <Circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke={color} strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </G>
    );
  };

  const r1 = (size / 2) - (strokeWidth / 2);
  const r2 = r1 - strokeWidth - gap;
  const r3 = r2 - strokeWidth - gap;

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size}>
        {renderRing(protein, proteinGoal, r1, Colors.dark.cyan)}
        {renderRing(carbs, carbsGoal, r2, Colors.dark.lime)}
        {renderRing(fat, fatGoal, r3, Colors.dark.rose)}
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.center}>
          <Text style={styles.centerText}>{Math.round(protein+carbs+fat)}g</Text>
          <Text style={styles.subtext}>Total</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 18, color: '#FFF', fontWeight: '800' },
  subtext: { fontSize: 10, color: '#555', marginTop: 1, textTransform: 'uppercase' }
});
