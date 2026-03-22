// filepath: app/social/messages/[id].tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { Avatar } from '../../../src/components/ui/Avatar';
import { useDatabase } from '../../../src/providers/DatabaseProvider';
import { socialDb } from '../../../src/db/socialDb';
import { getDb } from '../../../src/lib/database';

type Message = {
  id: number;
  conversation_id: number;
  sender_username: string;
  text: string;
  is_read: number;
  created_at: string;
  isMe?: boolean;
};

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isReady } = useDatabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [contactName, setContactName] = useState('');
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const flatRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    if (isReady && id) loadChat(Number(id));
  }, [isReady, id]);

  const loadChat = async (conversationId: number) => {
    try {
      const profile: any = await socialDb.getMyProfileSettings();
      if (!profile) return;

      // Get conversation details by id (manual query because no dedicated method)
      const db = await getDb();
      const conv: any = await db.getFirstAsync('SELECT * FROM conversations WHERE id = ?', [conversationId]);
      if (!conv) return;

      const otherUsername = conv.participant1_username === profile.username ? conv.participant2_username : conv.participant1_username;
      const otherProfile: any = await db.getFirstAsync('SELECT display_name, avatar_path FROM social_profile WHERE username = ?', [otherUsername]);
      setContactName(otherProfile?.display_name || otherUsername);
      setOtherAvatar(otherProfile?.avatar_path || null);

      const msgs = await socialDb.getMessages(conversationId);
      const enriched = msgs.map(m => ({ ...m, isMe: m.sender_username === profile.username }));
      setMessages(enriched);
    } catch (e) {
      console.error('Failed to load chat:', e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !id) return;
    try {
      await socialDb.sendMessage(Number(id), input.trim());
      setInput('');
      // Reload after brief delay
      setTimeout(() => loadChat(Number(id)), 300);
    } catch (e) {
      console.error('Failed to send:', e);
    }
  };

  const renderMsg = ({ item }: { item: Message }) => (
    <View style={[styles.msgBubble, item.isMe ? styles.meBubble : styles.theirBubble]}>
      {!item.isMe && (
        <Avatar source={null} size={24} style={{ marginRight: 8 }} />
      )}
      <Text style={[styles.msgText, item.isMe && styles.meText]}>{item.text}</Text>
      <Text style={styles.msgTime}>{item.time}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Avatar source={otherAvatar} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contactName}</Text>
          <Text style={styles.headerStatus}>Tap to view profile</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderMsg}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Say hello!</Text>}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={Colors.dark.muted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, input.trim() ? styles.sendBtnActive : null]} onPress={sendMessage}>
          <MaterialCommunityIcons name="send" size={20} color={input.trim() ? Colors.dark.bg : Colors.dark.muted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#111', gap: 12 },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerStatus: { color: Colors.dark.cyan, fontSize: 12 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  meBubble: { backgroundColor: Colors.dark.cyan, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: Colors.dark.bg2, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { color: '#FFF', fontSize: 15, lineHeight: 20 },
  meText: { color: Colors.dark.bg },
  msgTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#111' },
  input: { flex: 1, backgroundColor: Colors.dark.bg2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#FFF', maxHeight: 100, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.bg2, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: Colors.dark.cyan }
});
