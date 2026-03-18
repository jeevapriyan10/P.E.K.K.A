// filepath: src/components/nutrition/MacroPieChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
  strokeWidth?: number;
}

export default function MacroPieChart({ protein, carbs, fat, size = 120, strokeWidth = 14 }: Props) {
  const sum = protein + carbs + fat;
  const total = sum === 0 ? 1 : sum;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const proteinPct = protein / total;
  const carbsPct = carbs / total;
  const fatPct = fat / total;

  const proteinDash = circumference * proteinPct;
  const carbsDash = circumference * carbsPct;
  const fatDash = circumference * fatPct;

  const carbsOffset = circumference - proteinDash;
  const fatOffset = carbsOffset - carbsDash;

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          {/* Base track */}
          <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.dark.bg4} strokeWidth={strokeWidth} fill="none" />
          
          {/* Protein */}
          {protein > 0 && <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.dark.violet} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${proteinDash} ${circumference}`} />}

          {/* Carbs */}
          {carbs > 0 && <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.dark.lime} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${carbsDash} ${circumference}`} strokeDashoffset={carbsOffset} />}

          {/* Fat */}
          {fat > 0 && <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.dark.rose} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${fatDash} ${circumference}`} strokeDashoffset={fatOffset} />}
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.center}>
          <Text style={styles.centerText}>{Math.round(sum)}g</Text>
          <Text style={styles.subtext}>Total Macros</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { fontSize: 18, color: Colors.dark.text, fontWeight: 'bold' },
  subtext: { fontSize: 10, color: Colors.dark.muted }
});
