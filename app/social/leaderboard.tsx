// filepath: app/social/leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb, ProfileExport } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

type MetricType = 'workouts' | 'steps' | 'streak' | 'volume';

interface LeaderboardEntry {
  username: string;
  display_name: string;
  avatar: string;
  value: number;
  isMe: boolean;
  isPrivate?: boolean;
}

export default function Leaderboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MetricType>('workouts');
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    const [friends, me] = await Promise.all([
      socialDb.getStoredFriends(),
      socialDb.generateExportPayload()
    ]);

    const entries: LeaderboardEntry[] = [];
    
    // Add me
    if (me) {
      entries.push({
        username: me.username,
        display_name: 'You',
        avatar: me.avatar_path,
        value: getMetricValue(me, activeTab),
        isMe: true,
        isPrivate: getMetricValue(me, activeTab) === -1
      });
    }

    // Add friends
    friends.forEach(f => {
      entries.push({
        username: f.username,
        display_name: f.display_name,
        avatar: f.avatar_path,
        value: getMetricValue(f, activeTab),
        isMe: false,
        isPrivate: getMetricValue(f, activeTab) === -1
      });
    });

    // Sort: highest value first
    const sorted = entries.sort((a, b) => b.value - a.value);
    setData(sorted);
  };

  const getMetricValue = (p: ProfileExport, metric: MetricType) => {
    switch(metric) {
      case 'workouts': return p.stats.week_workouts || 0;
      case 'steps': return p.stats.week_steps_avg || 0;
      case 'streak': return p.stats.current_streak || 0;
      case 'volume': return p.stats.total_volume_kg || 0;
      default: return 0;
    }
  };

  const getUnit = (metric: MetricType) => {
    switch(metric) {
      case 'workouts': return ' sess';
      case 'steps': return ' steps';
      case 'streak': return ' days';
      case 'volume': return ' kg';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Friend Rankings</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabs}>
        <View style={styles.tabScrollWrapp}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              <Tab label="Workouts" active={activeTab === 'workouts'} onPress={() => setActiveTab('workouts')} />
              <Tab label="Avg Steps" active={activeTab === 'steps'} onPress={() => setActiveTab('steps')} />
              <Tab label="Streak" active={activeTab === 'streak'} onPress={() => setActiveTab('streak')} />
              <Tab label="All-time Volume" active={activeTab === 'volume'} onPress={() => setActiveTab('volume')} />
            </ScrollView>
        </View>
      </View>

      <FlatList 
        data={data}
        keyExtractor={item => item.username}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.rankItem, item.isMe && styles.meItem]}>
            <View style={styles.rankNumArea}>
                <Text style={[styles.rankNum, index === 0 && { color: Colors.dark.amber }]}>#{index + 1}</Text>
            </View>
            
            <Text style={styles.avatar}>{item.avatar}</Text>
            
            <View style={styles.info}>
               <Text style={[styles.name, item.isMe && { color: Colors.dark.lime }]}>{item.display_name}</Text>
               <Text style={styles.username}>@{item.username}</Text>
            </View>

            <View style={styles.valueArea}>
                <Text style={[styles.value, item.isMe && { color: Colors.dark.lime }]}>
                    {item.isPrivate ? '🔒' : Math.round(item.value) + getUnit(activeTab)}
                </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const Tab = ({ label, active, onPress }: any) => (
  <TouchableOpacity style={[styles.tab, active && styles.activeTab]} onPress={onPress}>
    <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  tabs: { borderBottomWidth: 1, borderBottomColor: '#111' },
  tabScrollWrapp: { paddingVertical: 10 },
  tabContent: { paddingHorizontal: 20, gap: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#111' },
  activeTab: { backgroundColor: Colors.dark.lime },
  tabText: { color: '#777', fontWeight: 'bold', fontSize: 13 },
  activeTabText: { color: '#000' },
  list: { padding: 20 },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 10 },
  meItem: { borderColor: Colors.dark.lime, borderLeftWidth: 4 },
  rankNumArea: { width: 40 },
  rankNum: { color: '#555', fontWeight: 'bold', fontSize: 16 },
  avatar: { fontSize: 32, marginRight: 16, width: 40, textAlign: 'center' },
  info: { flex: 1 },
  name: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  username: { color: '#555', fontSize: 11, textTransform: 'lowercase' },
  valueArea: { alignItems: 'flex-end', marginLeft: 12 },
  value: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});
