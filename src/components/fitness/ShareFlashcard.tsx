// filepath: src/components/fitness/ShareFlashcard.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import MuscleHeatmap from './MuscleHeatmap';

interface Props {
  session: any;
  activations: any;
  streak: number;
}

export default function ShareFlashcard({ session, activations, streak }: Props) {
  const viewShotRef = useRef<ViewShot>(null);

  const captureAndShare = async () => {
    if (viewShotRef.current?.capture) {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    }
  };

  return (
    <View style={styles.outer}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>P.E.K.K.A</Text>
              <Text style={styles.tagline}>Level Up Your Fitness</Text>
            </View>
            <View style={styles.streakBox}>
              <MaterialCommunityIcons name="fire" size={24} color={Colors.dark.amber} />
              <Text style={styles.streakText}>{streak} Day Streak</Text>
            </View>
          </View>

          <View style={styles.main}>
            <View style={styles.heatmap}>
               <MuscleHeatmap activations={activations} />
            </View>
            
            <View style={styles.metrics}>
              <Text style={styles.workoutName}>{session.name}</Text>
              <Text style={styles.date}>{session.date}</Text>

              <View style={styles.metricRow}>
                <MetricItem icon="clock-outline" value={`${session.duration_minutes}m`} label="DURATION" />
                <MetricItem icon="fire" value={`${session.calories_burned || 0}`} label="KCAL" />
              </View>
              <View style={styles.metricRow}>
                <MetricItem icon="weight-lifter" value={`${Math.round(session.total_volume)}kg`} label="VOLUME" />
                <MetricItem icon="chart-line" value={`${session.rpe_score}/10`} label="INTENSITY" />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
             <Text style={styles.footerText}>Tracked with P.E.K.K.A - AI Fitness Companion</Text>
          </View>
        </View>
      </ViewShot>

      <TouchableOpacity style={styles.shareBtn} onPress={captureAndShare}>
        <MaterialCommunityIcons name="share-variant" size={20} color={Colors.dark.bg} />
        <Text style={styles.shareBtnText}>Share Progress</Text>
      </TouchableOpacity>
    </View>
  );
}

const MetricItem = ({ icon, value, label }: any) => (
  <View style={styles.metricItem}>
    <MaterialCommunityIcons name={icon} size={18} color={Colors.dark.cyan} />
    <View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  </View>
);



const styles = StyleSheet.create({
  outer: { width: '100%', gap: 16 },
  card: {
    backgroundColor: Colors.dark.bg,
    width: 380,
    padding: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.dark.cyan,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  brand: { color: Colors.dark.cyan, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold' },
  streakBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.dark.bg3, padding: 8, borderRadius: 12 },
  streakText: { color: Colors.dark.amber, fontWeight: 'bold', fontSize: 14 },
  main: { gap: 24 },
  heatmap: { transform: [{ scale: 0.9 }] },
  metrics: { gap: 12 },
  workoutName: { color: Colors.dark.text, fontSize: 22, fontWeight: 'bold' },
  date: { color: Colors.dark.muted, fontSize: 13, marginBottom: 8 },
  metricRow: { flexDirection: 'row', gap: 16 },
  metricItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.dark.bg2, padding: 12, borderRadius: 16 },
  metricValue: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  metricLabel: { color: Colors.dark.muted, fontSize: 8, fontWeight: 'bold' },
  footer: { marginTop: 24, borderTopWidth: 1, borderColor: Colors.dark.border, paddingTop: 16, alignItems: 'center' },
  footerText: { color: Colors.dark.dim, fontSize: 10, fontWeight: 'bold' },
  shareBtn: { flexDirection: 'row', backgroundColor: Colors.dark.cyan, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareBtnText: { color: Colors.dark.bg, fontWeight: 'bold' }
});
