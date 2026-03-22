// filepath: app/social/profile.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';
import { Avatar } from '../../src/components/ui/Avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [savedPostsCount, setSavedPostsCount] = useState(0);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, []));

  const loadProfile = async () => {
    try {
      const [profile, posts] = await Promise.all([
        socialDb.getMyProfileSettings(),
        socialDb.getMyPosts()
      ]);
      setMyProfile(profile);
      setMyPosts(posts);

      // Load saved posts count
      const saved = await socialDb.getSavedPosts();
      setSavedPostsCount(saved.length);
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.meCard}>
        {myProfile ? (
          <View style={{ alignItems: 'center' }}>
            <Avatar source={myProfile.avatar_path} size={80} borderColor={Colors.dark.lime} />
            <View style={{ height: 16 }} />
            <Text style={styles.meName}>{myProfile.display_name}</Text>
            <Text style={styles.meUsername}>@{myProfile.username}</Text>
            <Text style={styles.bio}>{myProfile.bio}</Text>

            <View style={styles.profileStatsRow}>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>{myPosts.length}</Text>
                <Text style={styles.pStatLabel}>Posts</Text>
              </View>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>{myProfile.stats.current_streak}</Text>
                <Text style={styles.pStatLabel}>Streak</Text>
              </View>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>{myProfile.stats.achievements_count}</Text>
                <Text style={styles.pStatLabel}>Medals</Text>
              </View>
            </View>

            <View style={styles.statsRow2}>
              <View style={styles.stat2Item}>
                <MaterialCommunityIcons name="fire" size={16} color={Colors.dark.amber} />
                <Text style={styles.stat2Val}>{myProfile.stats.week_calories_avg} kcal</Text>
              </View>
              <View style={styles.stat2Item}>
                <MaterialCommunityIcons name="walk" size={16} color={Colors.dark.cyan} />
                <Text style={styles.stat2Val}>{myProfile.stats.week_steps_avg.toLocaleString()} steps</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/settings' as any)}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/settings' as any)}>
            <Text style={styles.setupText}>Set up your social profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Saved Posts Quick Access */}
      <TouchableOpacity style={styles.savedCard} onPress={() => router.push('/social/saved-posts' as any)}>
        <View style={styles.savedInfo}>
          <MaterialCommunityIcons name="bookmark" size={24} color={Colors.dark.amber} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.savedTitle}>Saved Posts</Text>
            <Text style={styles.savedCount}>{savedPostsCount} items</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark.muted} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>My Posts</Text>
      <View style={styles.postsGrid}>
        {myPosts.length > 0 ? myPosts.map(p => (
          <TouchableOpacity key={p.id} style={styles.gridItem}>
            {p.media_path ? (
              <Image source={{ uri: p.media_path }} style={styles.gridImg} />
            ) : (
              <View style={styles.textPostThumb}>
                <MaterialCommunityIcons name="format-quote-close" size={24} color="#333" />
              </View>
            )}
          </TouchableOpacity>
        )) : (
          <Text style={styles.emptyText}>No posts yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 24, backgroundColor: '#000', flexGrow: 1 },
  meCard: { backgroundColor: '#111', borderRadius: 24, padding: 24, gap: 12 },
  meName: { fontSize: 20, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  meUsername: { fontSize: 14, color: '#555', textAlign: 'center' },
  bio: { color: '#AAA', textAlign: 'center', marginTop: 8, paddingHorizontal: 20, lineHeight: 20 },
  profileStatsRow: { flexDirection: 'row', gap: 30, marginTop: 24, justifyContent: 'center' },
  pStatItem: { alignItems: 'center' },
  pStatVal: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  pStatLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', marginTop: 4 },
  statsRow2: { flexDirection: 'row', gap: 20, marginTop: 16, justifyContent: 'center' },
  stat2Item: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stat2Val: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  editProfileBtn: { backgroundColor: '#222', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  editProfileText: { color: '#FFF', fontWeight: 'bold' },
  setupBtn: { padding: 30, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 16 },
  setupText: { color: Colors.dark.lime, fontWeight: 'bold' },
  savedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', padding: 16, borderRadius: 16, marginTop: 12 },
  savedInfo: { flexDirection: 'row', alignItems: 'center' },
  savedTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  savedCount: { color: '#888', fontSize: 12, marginTop: 2 },
  sectionTitle: { color: '#555', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%', aspectRatio: 1, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%' },
  textPostThumb: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  emptyText: { color: '#777', textAlign: 'center', width: '100%', marginTop: 20 }
});
