import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface Props {
  currentMl: number;
  goalMl: number;
  onAdd: (amount: number) => void;
}

export default function WaterTracker({ currentMl, goalMl, onAdd }: Props) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = Math.min(1, currentMl / Math.max(1, goalMl));
  const offset = circumference - (pct * circumference);
  
  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.ringContainer}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size/2}, ${size/2}`}>
              <Circle 
                cx={size/2} cy={size/2} r={radius} 
                stroke="#1A1A1A" strokeWidth={strokeWidth} 
                fill="none" 
              />
              <Circle 
                cx={size/2} cy={size/2} r={radius} 
                stroke={Colors.dark.cyan} strokeWidth={strokeWidth} 
                fill="none" 
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.centerText}>
             <Text style={styles.mlText}>{currentMl}</Text>
             <Text style={styles.unitText}>ml</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Text style={styles.goalText}>Goal: {goalMl}ml</Text>
          <View style={styles.btnRow}>
             <TouchableOpacity style={styles.btn} onPress={() => onAdd(250)}>
               <Text style={styles.btnLabel}>+250</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.btn} onPress={() => onAdd(500)}>
               <Text style={styles.btnLabel}>+500</Text>
             </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={() => onAdd(-currentMl)}>
             <Text style={styles.resetText}>Reset Progress</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.dark.bg2, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  centerText: { position: 'absolute', alignItems: 'center' },
  mlText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  unitText: { color: Colors.dark.cyan, fontSize: 12, fontWeight: 'bold' },
  controls: { flex: 1, gap: 10 },
  goalText: { color: '#555', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  btnRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: '#1A1A1A', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  btnLabel: { color: Colors.dark.cyan, fontWeight: 'bold', fontSize: 13 },
  resetBtn: { marginTop: 4 },
  resetText: { color: '#444', fontSize: 12, fontWeight: '500' }
});
