// filepath: app/social/saved-posts.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { socialDb } from '../../src/db/socialDb';
import { PostCard } from '../../src/components/social/PostCard';

export default function SavedPostsScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const loadSavedPosts = useCallback(async () => {
    if (!isReady) return;
    try {
      const saved = await socialDb.getSavedPosts();
      setPosts(saved);
      setIsEmpty(saved.length === 0);
    } catch (e) {
      console.error('Failed to load saved posts:', e);
    }
  }, [isReady]);

  useEffect(() => {
    loadSavedPosts();
  }, [loadSavedPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedPosts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.cyan} />}
      >
        {!isReady ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : isEmpty ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bookmark-outline" size={64} color={Colors.dark.border} />
            <Text style={styles.empty}>No saved posts yet</Text>
            <Text style={styles.emptySub}>Save posts to see them here</Text>
          </View>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onRefresh={loadSavedPosts} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.dark.bg2, borderBottomWidth: 1, borderColor: Colors.dark.border },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  empty: { color: Colors.dark.muted, fontSize: 16, textAlign: 'center' },
  emptySub: { color: Colors.dark.dim, fontSize: 14, textAlign: 'center' }
});
