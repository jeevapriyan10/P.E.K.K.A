// filepath: src/components/fitness/MuscleHeatmap.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface Props {
  activations: Record<string, number>; // value from 0 to 1
}

export default function MuscleHeatmap({ activations }: Props) {
  const getFill = (id: string, baseAct: number = 0) => {
    let act = activations[id] || baseAct;
    
    // Fallbacks
    if (!act) {
        if (id === 'Back') act = Math.max(activations['Lats']||0, activations['Traps']||0, activations['Lower Back']||0);
        if (id === 'Thighs') act = Math.max(activations['Quads']||0, activations['Hamstrings']||0);
        if (id === 'Chest') act = activations['Chest'] || 0;
    }

    if (act <= 0) return 'rgba(255, 255, 255, 0.05)';
    // Interpolate from a cool cyan to hot lime based on activation
    return `rgba(189, 255, 0, ${0.3 + (act * 0.7)})`;
  };

  const Figure = ({ view }: { view: 'front' | 'back' }) => (
    <View style={styles.figure}>
      <Text style={styles.label}>{view.toUpperCase()}</Text>
      <Svg width="140" height="280" viewBox="0 0 100 200">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.dark.bg2} stopOpacity="1" />
            <Stop offset="1" stopColor={Colors.dark.bg3} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <G transform="translate(0, 5)">
          {/* BASE SILHOUETTE */}
          <Path 
            d={view === 'front' 
              ? "M50,5 C47,5 45,8 45,12 C45,17 47,19 46,21 C42,21 34,22 28,26 C23,29 20,38 18,45 C15,55 12,65 14,75 C15,80 18,85 19,90 L22,88 C22,78 26,60 28,50 L34,55 C34,65 31,80 34,95 C38,110 39,130 39,150 C39,170 38,185 36,190 L44,192 C46,180 47,160 48,110 L50,110 L52,110 C53,160 54,180 56,192 L64,190 C62,185 61,170 61,150 C61,130 62,110 66,95 C69,80 66,65 66,55 L72,50 C74,60 78,78 78,88 L81,90 C82,85 85,80 86,75 C88,65 85,55 82,45 C80,38 77,29 72,26 C66,22 58,21 54,21 C53,19 55,17 55,12 C55,8 53,5 50,5 Z"
              : "M50,5 C47,5 45,8 45,12 C45,17 47,19 46,21 C42,21 34,22 28,26 C23,29 20,38 18,45 C15,55 12,65 14,75 C15,80 18,85 19,90 L22,88 C22,78 26,60 28,50 L34,55 C34,65 31,80 34,95 C38,110 39,130 39,150 C39,170 38,185 36,190 L44,192 C46,180 47,160 48,110 L50,110 L52,110 C53,160 54,180 56,192 L64,190 C62,185 61,170 61,150 C61,130 62,110 66,95 C69,80 66,65 66,55 L72,50 C74,60 78,78 78,88 L81,90 C82,85 85,80 86,75 C88,65 85,55 82,45 C80,38 77,29 72,26 C66,22 58,21 54,21 C53,19 55,17 55,12 C55,8 53,5 50,5 Z"
            }
            fill="#1A1A1A" 
            stroke={Colors.dark.border} 
            strokeWidth="1" 
          />

          {/* MUSCLE GROUPS */}
          {/* Shoulders / Delts */}
          <Path d="M28,26 C23,29 20,38 18,45 L25,50 C29,42 34,28 36,25 Z" fill={getFill('Shoulders')} />
          <Path d="M72,26 C77,29 80,38 82,45 L75,50 C71,42 66,28 64,25 Z" fill={getFill('Shoulders')} />

          {/* Arms (Biceps/Triceps depending on view) */}
          <Path d="M18,45 C15,55 12,65 14,75 L22,70 C20,60 25,50 25,50 Z" fill={view === 'front' ? getFill('Biceps') : getFill('Triceps')} />
          <Path d="M82,45 C85,55 88,65 86,75 L78,70 C80,60 75,50 75,50 Z" fill={view === 'front' ? getFill('Biceps') : getFill('Triceps')} />

          {/* Forearms */}
          <Path d="M14,75 C15,80 18,85 19,90 L22,88 C20,80 22,70 22,70 Z" fill={getFill('Forearms')} />
          <Path d="M86,75 C85,80 82,85 81,90 L78,88 C80,80 78,70 78,70 Z" fill={getFill('Forearms')} />

          {view === 'front' && (
            <G>
              {/* Chest */}
              <Path d="M35,26 C42,27 48,27 50,27 C52,27 58,27 65,26 L65,42 C58,45 52,43 50,43 C48,43 42,45 35,42 Z" fill={getFill('Chest')} />
              
              {/* Core / Abs */}
              <Path d="M36,45 C42,46 48,46 50,46 C52,46 58,46 64,45 L62,80 C56,85 54,85 50,85 C46,85 44,85 38,80 Z" fill={getFill('Core')} />
              
              {/* Quads */}
              <Path d="M34,95 C38,110 39,130 39,150 L47,145 L48,110 Z" fill={getFill('Quads')} />
              <Path d="M66,95 C62,110 61,130 61,150 L53,145 L52,110 Z" fill={getFill('Quads')} />
            </G>
          )}

          {view === 'back' && (
            <G>
              {/* Lats / Back */}
              <Path d="M36,25 C45,28 55,28 64,25 L65,70 C55,75 45,75 35,70 Z" fill={getFill('Back')} />
              
              {/* Traps */}
              <Path d="M42,21 C45,24 55,24 58,21 L50,30 Z" fill={getFill('Back')} />
              
              {/* Glutes */}
              <Path d="M34,85 C42,90 50,95 50,95 C50,95 58,90 66,85 L64,115 C58,112 50,110 50,110 C50,110 42,112 36,115 Z" fill={getFill('Glutes')} />
              
              {/* Hamstrings */}
              <Path d="M36,115 C38,130 39,140 39,150 L47,145 L48,110 Z" fill={getFill('Hamstrings')} />
              <Path d="M64,115 C62,130 61,140 61,150 L53,145 L52,110 Z" fill={getFill('Hamstrings')} />
            </G>
          )}

          {/* Calves */}
          <Path d="M39,150 C38,165 37,175 36,190 L44,192 C45,175 46,165 47,150 L43,148 Z" fill={getFill('Calves')} />
          <Path d="M61,150 C62,165 63,175 64,190 L56,192 C55,175 54,165 53,150 L57,148 Z" fill={getFill('Calves')} />
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
    backgroundColor: '#0F1312', 
    borderRadius: 24, 
    paddingVertical: 20, 
    borderWidth: 1, 
    borderColor: '#222' 
  },
  figure: { alignItems: 'center' },
  label: { color: Colors.dark.muted, fontSize: 11, fontWeight: '800', marginBottom: 12, letterSpacing: 2 }
});
