// filepath: app/social/explore.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { socialDb } from '../../src/db/socialDb';

type Category = 'all' | 'workout' | 'nutrition' | 'progress';

export default function ExploreScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category>('all');
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    if (!isReady) return;
    setLoading(true);
    try {
      const all = await socialDb.getFeedPosts();
      // Filter: only public posts that are AI approved
      const filtered = all.filter((p: any) => p.is_public === 1 && p.ai_approved === 1);
      setPosts(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadPosts();
  }, [isReady]));

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'workout', label: 'Gym' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'progress', label: 'Progress' }
  ];

  const displayed = selectedCat === 'all' ? posts : posts.filter(p => p.category === selectedCat);

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.gridItem} onPress={() => router.push({ pathname: '/social/post-detail', params: { id: item.id } } as any)}>
      {item.media_path ? (
        <Image source={{ uri: item.media_path }} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, { backgroundColor: Colors.dark.bg3, alignItems: 'center', justifyContent: 'center' }]}>
          <MaterialCommunityIcons name="text-box-outline" size={32} color={Colors.dark.muted} />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.likesRow}>
          <MaterialCommunityIcons name="heart" size={12} color="#FFF" />
          <Text style={styles.likesCount}>{item.likes_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.tabs}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, selectedCat === cat.key && styles.activeTab]}
            onPress={() => setSelectedCat(cat.key)}
          >
            <Text style={[styles.tabText, selectedCat === cat.key && styles.activeTabText]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><Text style={styles.loading}>Loading...</Text></View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}><Text style={styles.empty}>No posts in this category yet</Text></View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id.toString()}
          renderItem={renderGridItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  tabs: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#111' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.dark.bg2 },
  activeTab: { backgroundColor: Colors.dark.cyan },
  tabText: { color: Colors.dark.muted, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: Colors.dark.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: 6, gap: 6 },
  row: { gap: 6 },
  gridItem: { flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.dark.bg2 },
  gridImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 8 },
  likesRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, gap: 4 },
  likesCount: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  loading: { color: Colors.dark.muted },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }
});
