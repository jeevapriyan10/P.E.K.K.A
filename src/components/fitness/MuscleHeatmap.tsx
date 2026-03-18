// filepath: src/components/fitness/MuscleHeatmap.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface Props {
  activations: Record<string, number>; // value from 0 to 1
}

export default function MuscleHeatmap({ activations }: Props) {
  const getFill = (id: string) => {
    const act = activations[id] || 0;
    if (act > 0) return '#ef4444'; // MuscleWiki red highlight
    return 'none';
  };

  const Figure = ({ view }: { view: 'front' | 'back' }) => (
    <View style={styles.figure}>
      <Text style={styles.label}>{view.toUpperCase()} VIEW</Text>
      <Svg width="150" height="300" viewBox="0 0 100 200">
        <G stroke="#333" strokeWidth="0.8" fill="none">
          {/* Silhouettes - More biological/detailed */}
          {view === 'front' ? (
            <G>
              {/* Head */}
              <Path d="M45,15 Q50,5 55,15 Q55,25 50,28 Q45,25 45,15" fill="#f8f9fa" />
              {/* Neck */}
              <Path d="M47,28 L53,28 L54,32 L46,32 Z" fill="#f8f9fa" />
              {/* Chest */}
              <Path d="M35,35 Q50,40 65,35 L64,55 Q50,60 36,55 Z" fill={getFill('Chest') || '#f8f9fa'} />
              {/* Shoulders */}
              <Path d="M35,35 Q28,38 25,48 L32,52 Q34,42 35,35" fill={getFill('Shoulders') || '#f8f9fa'} />
              <Path d="M65,35 Q72,38 75,48 L68,52 Q66,42 65,35" fill={getFill('Shoulders') || '#f8f9fa'} />
              {/* Biceps */}
              <Path d="M25,48 Q20,60 22,75 L28,72 Q27,62 32,52 Z" fill={getFill('Biceps') || '#f8f9fa'} />
              <Path d="M75,48 Q80,60 78,75 L72,72 Q73,62 68,52 Z" fill={getFill('Biceps') || '#f8f9fa'} />
              {/* Forearms */}
              <Path d="M22,75 Q20,95 25,110 L30,105 Q27,90 28,72 Z" fill={getFill('Forearms') || '#f8f9fa'} />
              <Path d="M78,75 Q80,95 75,110 L70,105 Q73,90 72,72 Z" fill={getFill('Forearms') || '#f8f9fa'} />
              {/* Abs */}
              <Path d="M40,58 Q50,60 60,58 L58,95 Q50,98 42,95 Z" fill={getFill('Abs') || '#f8f9fa'} />
              {/* Obliques */}
              <Path d="M36,55 Q35,75 42,95 L40,58 Z" fill={getFill('Obliques') || '#f8f9fa'} />
              <Path d="M64,55 Q65,75 58,95 L60,58 Z" fill={getFill('Obliques') || '#f8f9fa'} />
              {/* Quads */}
              <Path d="M35,100 Q32,130 38,160 L48,155 Q48,125 49,100 Z" fill={getFill('Quads') || '#f8f9fa'} />
              <Path d="M65,100 Q68,130 62,160 L52,155 Q52,125 51,100 Z" fill={getFill('Quads') || '#f8f9fa'} />
              {/* Calves */}
              <Path d="M38,165 Q35,185 40,195 L45,193 Q45,175 45,165 Z" fill={getFill('Calves') || '#f8f9fa'} />
              <Path d="M62,165 Q65,185 60,195 L55,193 Q55,175 55,165 Z" fill={getFill('Calves') || '#f8f9fa'} />
            </G>
          ) : (
            <G>
              <Path d="M45,15 Q50,5 55,15 Q55,25 50,28 Q45,25 45,15" fill="#f8f9fa" />
              {/* Traps */}
              <Path d="M40,32 Q50,25 60,32 L50,40 Z" fill={getFill('Traps') || '#f8f9fa'} />
              {/* Upper Back */}
              <Path d="M35,35 Q50,45 65,35 L62,55 Q50,65 38,55 Z" fill={getFill('Back') || '#f8f9fa'} />
              {/* Lats */}
              <Path d="M38,55 Q35,75 45,90 L50,85 Q45,70 50,45" fill={getFill('Lats') || '#f8f9fa'} />
              <Path d="M62,55 Q65,75 55,90 L50,85 Q55,70 50,45" fill={getFill('Lats') || '#f8f9fa'} />
              {/* Triceps */}
              <Path d="M25,48 Q22,60 23,75 L30,72 Q29,62 32,52 Z" fill={getFill('Triceps') || '#f8f9fa'} />
              <Path d="M75,48 Q78,60 77,75 L70,72 Q71,62 68,52 Z" fill={getFill('Triceps') || '#f8f9fa'} />
              {/* Glutes */}
              <Path d="M40,92 Q50,110 60,92 L58,120 Q50,125 42,120 Z" fill={getFill('Glutes') || '#f8f9fa'} />
              {/* Hamstrings */}
              <Path d="M42,120 Q38,145 40,165 L48,160 Q48,140 48,120 Z" fill={getFill('Hamstrings') || '#f8f9fa'} />
              <Path d="M58,120 Q62,145 60,165 L52,160 Q52,140 52,120 Z" fill={getFill('Hamstrings') || '#f8f9fa'} />
            </G>
          )}
        </G>
      </Svg>
    </View>
  );

  return (
    <View style={styles.container}>
      <Figure view="front" />
      <Figure view="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    backgroundColor: '#fff', // White background strictly like MuscleWiki
    borderRadius: 24, 
    paddingVertical: 20,
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  figure: { alignItems: 'center' },
  label: { color: '#999', fontSize: 9, fontWeight: '700', marginBottom: 15, letterSpacing: 1.5 }
});
