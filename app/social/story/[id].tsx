import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../../src/db/socialDb';
import { Avatar } from '../../../src/components/ui/Avatar';

const { width, height } = Dimensions.get('window');

export default function StoryViewer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const loadStories = async () => {
    const db = await (require('../../../src/lib/database').getDb());
    const me: any = await socialDb.getMyProfileSettings();
    const target = id === 'me' ? me?.username : id;
    const rows = await db.getAllAsync(`
      SELECT st.*, sp.avatar_path
      FROM stories st
      JOIN social_profile sp ON st.author_username = sp.username
      WHERE st.author_username = ?
      ORDER BY st.created_at ASC
    `, [target]);
    setStories(rows);

    // Mark all of this author's current batch as viewed (simple: mark all stories from this author)
    if (me && target !== me.username) {
      // Mark each story as viewed
      for (const row of rows) {
        await socialDb.markStoryViewed(row.id);
      }
    }
  };

  useEffect(() => { loadStories(); }, []);

  const next = () => {
    if (currentIdx < stories.length - 1) setCurrentIdx(currentIdx + 1);
    else router.back();
  };

  if (stories.length === 0) return null;

  const current = stories[currentIdx];

  return (
    <View style={styles.container}>
      <Image source={{ uri: current.media_path }} style={styles.image} resizeMode="cover" />
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.progressRow}>
             {stories.map((_, i) => (
               <View key={i} style={[styles.progressBar, i <= currentIdx && styles.progressActive]} />
             ))}
          </View>
          <View style={styles.userRow}>
            <Avatar source={current.avatar_path} size={32} />
            <Text style={styles.username}>{current.author_username}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.close}>
              <MaterialCommunityIcons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity style={styles.tapRight} onPress={next} />
        {current.text_content && (
           <View style={styles.captionContainer}>
              <Text style={styles.caption}>{current.text_content}</Text>
           </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width, height },
  overlay: { ...StyleSheet.absoluteFillObject },
  header: { padding: 10 },
  progressRow: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  progressBar: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  progressActive: { backgroundColor: '#FFF' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  username: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  close: { marginLeft: 'auto' },
  tapRight: { position: 'absolute', top: 100, bottom: 100, right: 0, width: width * 0.5 },
  captionContainer: { position: 'absolute', bottom: 50, left: 20, right: 20, alignItems: 'center' },
  caption: { color: '#FFF', fontSize: 18, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 }
});
