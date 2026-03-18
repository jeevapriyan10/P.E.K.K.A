// filepath: app/social/feed.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../src/db/socialDb';
import { PostCard } from '../../src/components/social/PostCard';
import { Colors } from '../../src/constants/colors';

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await socialDb.getFeedPosts();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(useCallback(() => {
    loadPosts();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleReport = async (postId: number) => {
    router.push({ pathname: '/social/report-post', params: { id: postId } } as any);
  };

  const handleLike = async (postId: number, increment: boolean) => {
    await socialDb.toggleLike(postId, increment);
    // Reload state or optimistic update
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Feed</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/social/create-post' as any)}>
          <MaterialCommunityIcons name="plus-circle" size={28} color={Colors.dark.lime} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            onReport={handleReport} 
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.dark.lime} 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="earth-off" size={60} color="#222" />
            <Text style={styles.emptyTitle}>Your feed is quiet</Text>
            <Text style={styles.emptyText}>No posts yet. Be the first to share your fitness journey!</Text>
            <TouchableOpacity style={styles.createAction} onPress={() => router.push('/social/create-post' as any)}>
              <Text style={styles.createActionText}>Start Posting</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  createBtn: { padding: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 40 },
  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 24 },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  createAction: { marginTop: 32, backgroundColor: Colors.dark.lime, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
  createActionText: { color: '#000', fontWeight: 'bold' }
});
