// filepath: src/components/social/StoriesBar.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { StoryRing } from './StoryRing';
import { socialDb, ProfileExport } from '../../db/socialDb';

interface Story {
  id: string;
  username: string;
  avatar: string | null;
  isSeen: boolean;
  isMe?: boolean;
}

export default function StoriesBar() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const storyData = await socialDb.getStories();
      // Add "me" story at the beginning
      const myProfile = await socialDb.getMyProfileSettings();
      const meStory: Story = {
        id: 'me',
        username: 'Your Story',
        avatar: myProfile?.avatar_path || null,
        isSeen: false,
        isMe: true
      };
      setStories([meStory, ...storyData]);
    } catch (e) {
      console.error('Failed to load stories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (story: Story) => {
    if (story.isMe) {
      router.push('/social/create-story' as any);
    } else {
      router.push({ pathname: '/social/story/[id]', params: { id: story.id } } as any);
    }
  };

  if (loading) {
    return null; // Or a loading indicator
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {stories.map((s, i) => (
          <TouchableOpacity key={s.id || i} style={styles.item} onPress={() => handlePress(s)}>
            <StoryRing
              uri={s.avatar}
              size={64}
              isSeen={s.isSeen}
              isMe={s.isMe}
            />
            <Text style={styles.username} numberOfLines={1}>{s.username}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
    paddingVertical: 10,
    backgroundColor: '#000'
  },
  content: {
    paddingHorizontal: 12,
    gap: 15
  },
  item: {
    alignItems: 'center',
    width: 75
  },
  username: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center'
  }
});
