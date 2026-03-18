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
    
    // Fallback logic for combined groups
    if (!act) {
      if (id === 'Back') act = Math.max(activations['Lats']||0, activations['Traps']||0);
      if (id === 'Core') act = Math.max(activations['Abs']||0, activations['Obliques']||0);
    }

    if (act <= 0) return 'rgba(255, 255, 255, 0.05)';
    // Professional Heatmap: Dark Green -> Bright Lime -> Orange -> Red
    if (act < 0.3) return `rgba(94, 234, 212, ${0.4 + act})`; // Cyan
    if (act < 0.7) return `rgba(189, 255, 0, ${act})`; // Lime
    return `rgba(255, 69, 58, ${act})`; // Red for high activation
  };

  const Figure = ({ view }: { view: 'front' | 'back' }) => (
    <View style={styles.figure}>
      <Text style={styles.label}>{view.toUpperCase()} VIEW</Text>
      <Svg width="150" height="300" viewBox="0 0 100 200">
        <G transform="translate(0, 5)">
          {/* SILHOUETTE STROKE */}
          <Path 
            d={view === 'front' 
              ? "M50,5 C47,5 45,8 45,12 C45,17 47,19 46,21 C42,21 34,22 28,26 C23,29 20,38 18,45 C15,55 12,65 14,75 C15,80 18,85 19,90 L22,88 C22,78 26,60 28,50 L34,55 C34,65 31,80 34,95 C38,110 39,130 39,150 C39,170 38,185 36,190 L44,192 C46,180 47,160 48,110 L50,110 L52,110 C53,160 54,180 56,192 L64,190 C62,185 61,170 61,150 C61,130 62,110 66,95 C69,80 66,65 66,55 L72,50 C74,60 78,78 78,88 L81,90 C82,85 85,80 86,75 C88,65 85,55 82,45 C80,38 77,29 72,26 C66,22 58,21 54,21 C53,19 55,17 55,12 C55,8 53,5 50,5 Z"
              : "M50,5 C47,5 45,8 45,12 C45,17 47,19 46,21 C42,21 34,22 28,26 C23,29 20,38 18,45 C15,55 12,65 14,75 C15,80 18,85 19,90 L22,88 C22,78 26,60 28,50 L34,55 C34,65 31,80 34,95 C38,110 39,130 39,150 C39,170 38,185 36,190 L44,192 C46,180 47,160 48,110 L50,110 L52,110 C53,160 54,180 56,192 L64,190 C62,185 61,170 61,150 C61,130 62,110 66,95 C69,80 66,65 66,55 L72,50 C74,60 78,78 78,88 L81,90 C82,85 85,80 86,75 C88,65 85,55 82,45 C80,38 77,29 72,26 C66,22 58,21 54,21 C53,19 55,17 55,12 C55,8 53,5 50,5 Z"
            }
            fill="#0A0F0E" 
            stroke="#222" 
            strokeWidth="0.5" 
          />

          {/* Detailed Muscle Groups */}
          <Path d="M28,26 C23,29 20,38 18,45 L25,50 C29,42 34,28 36,25 Z" fill={getFill('Shoulders')} stroke="#111" strokeWidth="0.2" />
          <Path d="M72,26 C77,29 80,38 82,45 L75,50 C71,42 66,28 64,25 Z" fill={getFill('Shoulders')} stroke="#111" strokeWidth="0.2" />

          {/* Biceps/Triceps */}
          <Path d="M18,45 C16,55 14,65 15,72 L22,68 C20,60 25,50 25,50 Z" fill={view === 'front' ? getFill('Biceps') : getFill('Triceps')} />
          <Path d="M82,45 C84,55 86,65 85,72 L78,68 C80,60 75,50 75,50 Z" fill={view === 'front' ? getFill('Biceps') : getFill('Triceps')} />

          {view === 'front' ? (
            <G>
              {/* Chest - Pectorals */}
              <Path d="M35,26 C42,27 48,27 50,27 C52,27 58,27 65,26 L64,44 C58,47 52,45 50,45 C48,45 42,47 36,44 Z" fill={getFill('Chest')} stroke="#111" strokeWidth="0.2" />
              {/* Abs - Rectus Abdominis */}
              <Path d="M40,48 C45,49 55,49 60,48 L58,85 C54,88 46,88 42,85 Z" fill={getFill('Abs')} stroke="#111" strokeWidth="0.2" />
              {/* Obliques */}
              <Path d="M36,45 L40,48 L42,85 L38,80 Z" fill={getFill('Obliques')} />
              <Path d="M64,45 L60,48 L58,85 L62,80 Z" fill={getFill('Obliques')} />
              {/* Quads */}
              <Path d="M34,95 C38,105 39,125 39,150 L47,145 L48,110 L39,110 Z" fill={getFill('Quads')} />
              <Path d="M66,95 C62,105 61,125 61,150 L53,145 L52,110 L61,110 Z" fill={getFill('Quads')} />
            </G>
          ) : (
            <G>
              {/* Back - Lats */}
              <Path d="M34,26 C45,30 55,30 66,26 L62,80 C55,85 45,85 38,80 Z" fill={getFill('Lats')} />
              {/* Traps */}
              <Path d="M42,21 C45,24 55,24 58,21 L50,30 Z" fill={getFill('Traps')} />
              {/* Glutes */}
              <Path d="M36,88 C42,93 50,95 50,95 C50,95 58,93 64,88 L63,115 C58,112 50,110 50,110 C50,110 42,112 37,115 Z" fill={getFill('Glutes')} />
              {/* Hamstrings */}
              <Path d="M39,115 C38,130 39,140 39,150 L47,145 L48,110 Z" fill={getFill('Hamstrings')} />
              <Path d="M61,115 C62,130 61,140 61,150 L53,145 L52,110 Z" fill={getFill('Hamstrings')} />
            </G>
          )}

          {/* Forearms */}
          <Path d="M15,72 C16,80 18,85 19,90 L22,88 C20,80 22,68 22,68 Z" fill={getFill('Forearms')} />
          <Path d="M85,72 C84,80 82,85 81,90 L78,88 C80,80 78,68 78,68 Z" fill={getFill('Forearms')} />
          
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
    borderRadius: 32, 
    paddingVertical: 24, 
    borderWidth: 1, 
    borderColor: '#1A2322' 
  },
  figure: { alignItems: 'center' },
  label: { color: Colors.dark.muted, fontSize: 10, fontWeight: '900', marginBottom: 16, letterSpacing: 2 }
});
