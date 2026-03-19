// filepath: app/social/feed.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../src/db/socialDb';
import { PostCard } from '../../src/components/social/PostCard';
import { Colors } from '../../src/constants/colors';
import { Avatar } from '../../src/components/ui/Avatar';

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [postData, storyData] = await Promise.all([
        socialDb.getFeedPosts(),
        socialDb.getStories()
      ]);
      setPosts(postData);
      setStories(storyData);
    } catch (e) {
      console.error(e);
      setError('Failed to load feed. Pull down to retry.');
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  const renderStories = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.storiesContainer}
      contentContainerStyle={styles.storiesContent}
    >
      {stories.map((s, i) => (
        <TouchableOpacity 
          key={s.id || i} 
          style={styles.storyItem}
          onPress={() => s.id === 'me' ? router.push('/social/create-story' as any) : router.push({ pathname: '/social/story/[id]', params: { id: s.id } } as any)}
        >
          <View style={[styles.storyRing, !s.isSeen && { borderColor: Colors.dark.lime }]}>
            <Avatar source={s.avatar} size={64} />
            {s.id === 'me' && (
              <View style={styles.addStoryBadge}>
                <MaterialCommunityIcons name="plus" size={14} color="#FFF" />
              </View>
            )}
          </View>
          <Text style={styles.storyUser} numberOfLines={1}>{s.username}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VITACore</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/social/create-post' as any)}>
             <MaterialCommunityIcons name="plus-box-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/social/messages' as any)}>
             <MaterialCommunityIcons name="message-text-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderStories}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onRefresh={onRefresh}
            onReport={(id) => router.push({ pathname: '/social/report-post', params: { id } } as any)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.lime} />
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.dark.amber} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing to show</Text>
              <TouchableOpacity style={styles.createAction} onPress={() => router.push('/social/create-post' as any)}>
                <Text style={styles.createActionText}>Share your first progress</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 50 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerBtn: { padding: 4 }, storiesContainer: { borderBottomWidth: 0.5, borderBottomColor: '#222', paddingVertical: 10 },
  storiesContent: { paddingHorizontal: 12, gap: 15 },
  storyItem: { alignItems: 'center', width: 75 },
  storyRing: { padding: 3, borderRadius: 40, borderWidth: 2, borderColor: '#000' },
  addStoryBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.dark.cyan, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  storyUser: { color: '#FFF', fontSize: 11, marginTop: 4, textAlign: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 40 },
  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  createAction: { marginTop: 20, backgroundColor: Colors.dark.lime, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20 },
  createActionText: { color: '#000', fontWeight: 'bold' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, padding: 40, gap: 16 },
  errorText: { color: Colors.dark.amber, fontSize: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.dark.lime, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: '#000', fontWeight: 'bold' }
});
