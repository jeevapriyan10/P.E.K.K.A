// filepath: app/social/post-detail.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { socialDb } from '../../src/db/socialDb';
import { PostCard } from '../../src/components/social/PostCard';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (id) {
        // Fetch post by id - assuming a function exists or we can get from feed
        const feedPosts = await socialDb.getFeedPosts();
        const found = feedPosts.find(p => p.id === Number(id));
        setPost(found || null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return <View style={[styles.container, styles.center]}><Text style={{color: Colors.dark.text}}>Loading...</Text></View>;
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{color: Colors.dark.text}}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PostCard
          post={post}
          onRefresh={() => {}}
          onReport={(pid) => router.push({ pathname: '/social/report-post', params: { id: pid } } as any)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backLink: { marginTop: 16, padding: 8 },
  backText: { color: Colors.dark.cyan, fontWeight: 'bold' }
});
