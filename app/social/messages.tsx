import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/ui/Avatar';
import { Colors } from '../../src/constants/colors';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { socialDb } from '../../src/db/socialDb';

interface Conversation {
  id: number;
  participant1_username: string;
  participant2_username: string;
  last_message_at: string;
  created_at: string;
  other_display_name: string;
  other_avatar: string;
  unread_count: number;
}

export default function MessagingScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    if (isReady) loadConversations();
  }, [isReady]));

  const loadConversations = async () => {
    try {
      const convs = await socialDb.getConversations();
      setConversations(convs as Conversation[]);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return past.toLocaleDateString();
  };

  const filtered = conversations.filter(c =>
    c.other_display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newBtn}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#555" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.msgItem} onPress={() => router.push(`/social/messages/${item.id}`)}>
            <Avatar source={item.other_avatar} size={50} />
            <View style={styles.msgInfo}>
              <Text style={styles.msgName}>{item.other_display_name}</Text>
              <Text style={[styles.msgText, item.unread_count > 0 && styles.unreadText]} numberOfLines={1}>
                {item.last_message || 'No messages yet'}
              </Text>
            </View>
            <View style={styles.msgMeta}>
              <Text style={styles.msgTime}>{getTimeAgo(item.last_message_at)}</Text>
              {item.unread_count > 0 && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No conversations yet. Start by posting or commenting!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 4 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', flex: 1, marginLeft: 20 },
  newBtn: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', margin: 16, paddingHorizontal: 16, borderRadius: 12, height: 44 },
  searchInput: { flex: 1, color: '#FFF', marginLeft: 10, fontSize: 16 },
  msgItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  msgInfo: { flex: 1, marginLeft: 16 },
  msgName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  msgText: { color: '#888', fontSize: 14, marginTop: 4 },
  unreadText: { color: '#FFF', fontWeight: 'bold' },
  msgMeta: { alignItems: 'flex-end', marginLeft: 10 },
  msgTime: { color: '#555', fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.cyan, marginTop: 8 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }
});
