// filepath: app/progress/achievements.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';

const ALL_ACHIEVEMENTS = [
  { type: 'first_workout', name: 'First Step', desc: 'Completed your first workout session.', icon: '👟' },
  { type: '10_workouts', name: 'Consistency is Key', desc: 'Completed 10 workout sessions.', icon: '🦾' },
  { type: 'first_PR', name: 'Breaking Limits', desc: 'Hit your first personal record.', icon: '⭐' },
  { type: '5_PRs', name: 'Unstoppable Force', desc: 'Hit 5 personal records.', icon: '🔥' },
  { type: '10k_steps', name: '10k Club', desc: 'Walked 10,000 steps in a single day.', icon: '🏃' },
  { type: 'marathon_steps', name: 'Marathon Walker', desc: 'Walked the distance of a marathon in steps.', icon: '🏅' },
  { type: '7_day_streak', name: 'Weekly Warrior', desc: 'Maintain a 7-day activity streak.', icon: '🛡️' },
  { type: '30_day_streak', name: 'Legendary Status', desc: 'Maintain a 30-day activity streak.', icon: '👑' },
  { type: 'water_goal', name: 'Hydration Hero', desc: 'Hit your water goal 5 days in a row.', icon: '💧' },
  { type: 'perfect_macros', name: 'Nutrition Ninja', desc: 'Hit your macro targets within 5%.', icon: '🍱' },
  { type: 'early_bird', name: 'Early Bird', desc: 'Finish a workout before 7 AM.', icon: '🌅' },
  { type: 'night_owl', name: 'Night Owl', desc: 'Finish a workout after 10 PM.', icon: '🦉' },
  { type: 'social_star', name: 'Social Star', desc: 'Get your first 10 followers.', icon: '✨' },
  { type: 'body_builder', name: 'Body Builder', desc: 'Gain 2kg of muscle mass.', icon: '🏗️' },
  { type: 'fat_shredder', name: 'Fat Shredder', desc: 'Lose 5% of body fat.', icon: '✂️' },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const [earned, setEarned] = useState<Record<string, string>>({});

  const loadEarned = async () => {
    const db = await getDb();
    const rows: any[] = await db.getAllAsync('SELECT achievement_type, earned_at FROM achievements');
    const mapped: Record<string, string> = {};
    rows.forEach(r => mapped[r.achievement_type] = r.earned_at);
    setEarned(mapped);
  };

  useFocusEffect(useCallback(() => { loadEarned(); }, []));

  const renderItem = ({ item }: { item: typeof ALL_ACHIEVEMENTS[0] }) => {
    const earnedAt = earned[item.type];
    const isLocked = !earnedAt;

    return (
      <View style={[styles.card, isLocked && styles.cardLocked]}>
        <View style={[styles.iconBox, { backgroundColor: isLocked ? Colors.dark.bg3 : Colors.dark.bg }]}>
          <Text style={[styles.icon, isLocked && { opacity: 0.3 }]}>{isLocked ? '🔒' : item.icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, isLocked && styles.textLocked]}>{item.name}</Text>
          <Text style={styles.desc}>{item.desc}</Text>
          {earnedAt && <Text style={styles.date}>Earned on {earnedAt.split(' ')[0]}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{width: 40}} />
      </View>
      
      <FlatList 
        data={ALL_ACHIEVEMENTS}
        renderItem={renderItem}
        keyExtractor={i => i.type}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: Colors.dark.bg2, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border, alignItems: 'center' },
  cardLocked: { opacity: 0.6, borderColor: 'transparent' },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 28 },
  info: { flex: 1, marginLeft: 16 },
  name: { color: Colors.dark.lime, fontSize: 16, fontWeight: 'bold' },
  textLocked: { color: Colors.dark.muted },
  desc: { color: Colors.dark.text, fontSize: 12, marginTop: 4 },
  date: { color: Colors.dark.muted, fontSize: 10, marginTop: 8, fontStyle: 'italic' },
});
