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

    if (act <= 0.1) return 'rgba(255, 255, 255, 0.05)';
    // In the image, the active muscle is a solid, vibrant lime
    return Colors.dark.lime; 
  };

  const Figure = ({ view }: { view: 'front' | 'back' }) => (
    <View style={styles.figure}>
      <Text style={styles.label}>{view.toUpperCase()} VIEW</Text>
      <Svg width="140" height="280" viewBox="0 0 100 200">
        <G transform="translate(0, 5)">
          {/* REFINED GEOMETRIC SILHOUETTE */}
          <Path 
            d={view === 'front' 
              ? "M50,2 C45,2 43,6 43,10 C43,15 45,18 45,20 C40,20 32,22 26,26 C20,30 16,40 14,48 C12,58 10,68 12,78 C13,85 16,90 18,95 L22,92 C21,80 25,60 28,50 L34,55 C34,65 32,85 35,100 C38,120 38,150 40,195 L48,198 C48,160 48,120 49,105 L51,105 C52,120 52,160 52,198 L60,195 C62,150 62,120 65,100 C68,85 66,65 66,55 L72,50 C75,60 79,80 78,92 L82,95 C84,90 87,85 88,78 C90,68 88,58 86,48 C84,40 80,30 74,26 C68,22 60,20 55,20 C55,18 57,15 57,10 C57,6 55,2 50,2 Z"
              : "M50,2 C45,2 43,6 43,10 C43,15 45,18 45,20 C40,20 32,22 26,26 C20,30 16,40 14,48 C12,58 10,68 12,78 C13,85 16,90 18,95 L22,92 C21,80 25,60 28,50 L34,55 C34,65 32,85 35,100 C38,120 38,150 40,195 L48,198 C48,160 48,120 49,105 L51,105 C52,120 52,160 52,198 L60,195 C62,150 62,120 65,100 C68,85 66,65 66,55 L72,50 C75,60 79,80 78,92 L82,95 C84,90 87,85 88,78 C90,68 88,58 86,48 C84,40 80,30 74,26 C68,22 60,20 55,20 C55,18 57,15 57,10 C57,6 55,2 50,2 Z"
            }
            fill="#111" 
            stroke="#222" 
            strokeWidth="1" 
          />

          {/* MUSCLE MAPPING FRONT */}
          {view === 'front' ? (
            <G>
              <Path d="M26,26 C20,30 18,40 18,48 L28,50 C32,42 34,28 36,25 Z" fill={getFill('Shoulders')} />
              <Path d="M74,26 C80,30 82,40 82,48 L72,50 C68,42 66,28 64,25 Z" fill={getFill('Shoulders')} />
              <Path d="M36,26 C42,28 58,28 64,26 L62,45 C58,48 52,48 50,48 C48,48 42,48 38,45 Z" fill={getFill('Chest')} />
              <Path d="M42,50 C45,52 55,52 58,50 L56,95 C54,98 46,98 44,95 Z" fill={getFill('Abs')} />
              <Path d="M35,100 C38,115 39,140 40,160 L48,155 L40,105 Z" fill={getFill('Quads')} />
              <Path d="M65,100 C62,115 61,140 60,160 L52,155 L60,105 Z" fill={getFill('Quads')} />
            </G>
          ) : (
            <G>
              <G transform="translate(0,0)">
                <Path d="M34,26 C45,30 55,30 66,26 L64,70 C58,75 52,75 46,75 L36,70 Z" fill={getFill('Back')} />
                <Path d="M40,21 C45,24 55,24 60,21 L50,30 Z" fill={getFill('Traps')} />
                <Path d="M40,75 C45,80 55,80 60,75 L58,105 C54,108 46,108 42,105 Z" fill={getFill('Glutes')} />
              </G>
            </G>
          )}
          {/* Arms/Legs as simple silhouettes */}
          <Path d="M18,45 C16,55 14,65 15,72 C16,80 18,85 19,90 L22,88 C22,78 26,60 28,50 Z" fill={getFill('Arms')} opacity={0.3} />
          <Path d="M82,45 C84,55 86,65 85,72 C84,80 82,85 81,90 L78,88 C78,78 74,60 72,50 Z" fill={getFill('Arms')} opacity={0.3} />
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
    backgroundColor: '#0A0A0A', // Darker background like the image
    borderRadius: 32, 
    paddingVertical: 30, 
    borderWidth: 1, 
    borderColor: '#1A1A1A' 
  },
  figure: { alignItems: 'center' },
  label: { color: '#555', fontSize: 10, fontWeight: '900', marginBottom: 20, letterSpacing: 2 }
});
