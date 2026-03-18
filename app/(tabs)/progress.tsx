// filepath: app/(tabs)/progress.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';
import WeightChart from '../../src/components/progress/WeightChart';
import { exportUserData } from '../../src/utils/exportData';

// @ts-ignore
const PHOTO_DIR = FileSystem.documentDirectory + 'progress_photos/';

export default function ProgressDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [achievementsCount, setAchievementsCount] = useState(0);

  const loadData = async () => {
    try {
      const db = await getDb();
      const user: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      setProfile(user);

      const logs: any[] = await db.getAllAsync('SELECT * FROM weight_logs ORDER BY date DESC LIMIT 30');
      setWeightLogs(logs);

      const photoRows: any[] = await db.getAllAsync('SELECT * FROM progress_photos ORDER BY date DESC LIMIT 4');
      setPhotos(photoRows);

      const achCount: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM achievements');
      setAchievementsCount(achCount.c || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const chartData = [...weightLogs].reverse().map(w => ({
    value: w.weight_kg,
    label: w.date.split('-')[2],
    date: w.date
  }));

  const calculateBodyComp = () => {
    if (!profile) return { bmi: '--', bf: '--', lean: '--', fat: '--' };
    const h = profile.height_cm / 100;
    const bmi = (profile.weight_kg / (h * h)).toFixed(1);
    return { bmi, bf: '22.5%', lean: '58.2kg', fat: '16.8kg', status: 'Healthy' };
  };

  const comp = calculateBodyComp();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Metrics</Text>
        <TouchableOpacity onPress={exportUserData}>
          <MaterialCommunityIcons name="file-export-outline" size={24} color={Colors.dark.cyan} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Weight Trend */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>WEIGHT TREND</Text>
            <TouchableOpacity onPress={() => router.push('/progress/weight-log')}>
              <Text style={styles.seeAll}>VIEW HISTORY</Text>
            </TouchableOpacity>
          </View>
          <WeightChart data={chartData} goalWeight={profile?.weight_kg || 70} />
        </View>

        {/* Composition Grid */}
        <View style={styles.metricGrid}>
           <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>BMI</Text>
              <Text style={styles.metricVal}>{comp.bmi}</Text>
              <View style={styles.statusBadge}><Text style={styles.statusText}>{comp.status}</Text></View>
           </View>
           <TouchableOpacity style={styles.metricCard} onPress={() => router.push('/progress/body-fat-calculator')}>
              <Text style={styles.metricLabel}>BODY FAT %</Text>
              <Text style={styles.metricVal}>{comp.bf}</Text>
              <Text style={styles.metricLink}>ESTIMATE ›</Text>
           </TouchableOpacity>
           <View style={[styles.metricCard, {flex: 2, minWidth: '95%'}]}>
              <View style={styles.row}>
                <View style={{flex:1}}>
                  <Text style={styles.metricLabel}>LEAN MASS</Text>
                  <Text style={styles.metricVal}>{comp.lean}</Text>
                </View>
                <View style={{flex:1}}>
                  <Text style={styles.metricLabel}>FAT MASS</Text>
                  <Text style={styles.metricVal}>{comp.fat}</Text>
                </View>
                <MaterialCommunityIcons name="lightning-bolt" size={32} color={Colors.dark.cyan} />
              </View>
           </View>
        </View>

        {/* Photo Gallery */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROGRESS PHOTOS</Text>
            <TouchableOpacity onPress={() => router.push('/progress/progress-photos')}>
              <Text style={styles.seeAll}>GALLERY</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoRow}>
             {photos.length === 0 ? (
               <View style={styles.noPhoto}><Text style={styles.noPhotoText}>No snapshots yet</Text></View>
             ) : (
               photos.map(p => <Image key={p.id} source={{ uri: PHOTO_DIR + p.photo_path }} style={styles.photo} />)
             )}
             <TouchableOpacity style={styles.addPhoto} onPress={() => router.push('/progress/progress-photos')}>
               <MaterialCommunityIcons name="camera-plus" size={24} color={Colors.dark.muted} />
             </TouchableOpacity>
          </View>
        </View>

        {/* Achievements */}
        <TouchableOpacity style={styles.achCard} onPress={() => router.push('/progress/achievements')}>
           <View style={styles.achInfo}>
              <Text style={styles.achTitle}>AWARDS & MILESTONES</Text>
              <Text style={styles.achSub}>{achievementsCount} UNLOCKED</Text>
           </View>
           <View style={styles.achIcons}>
              <MaterialCommunityIcons name="medal" size={24} color="#FFD700" />
              <MaterialCommunityIcons name="fire" size={24} color={Colors.dark.amber} />
              <MaterialCommunityIcons name="trophy" size={24} color={Colors.dark.cyan} />
           </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text },
  scroll: { padding: 20, gap: 32, paddingBottom: 60 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: Colors.dark.muted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  seeAll: { color: Colors.dark.cyan, fontSize: 10, fontWeight: 'bold' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.dark.bg2, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.border },
  metricLabel: { color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  metricVal: { color: Colors.dark.text, fontSize: 22, fontWeight: 'bold' },
  metricLink: { color: Colors.dark.cyan, fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  statusBadge: { backgroundColor: 'rgba(189,255,0,0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { color: Colors.dark.lime, fontSize: 10, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
  photoRow: { flexDirection: 'row', gap: 8 },
  photo: { width: 70, height: 70, borderRadius: 12, backgroundColor: Colors.dark.bg3 },
  noPhoto: { flex: 1, height: 70, backgroundColor: Colors.dark.bg3, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.dark.border },
  noPhotoText: { color: Colors.dark.muted, fontSize: 11 },
  addPhoto: { width: 70, height: 70, backgroundColor: Colors.dark.bg3, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.dark.border, justifyContent: 'center', alignItems: 'center' },
  achCard: { flexDirection: 'row', backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 24, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.dark.border },
  achInfo: { gap: 4 },
  achTitle: { color: Colors.dark.text, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  achSub: { color: Colors.dark.cyan, fontSize: 11, fontWeight: 'bold' },
  achIcons: { flexDirection: 'row', gap: 12 }
});
