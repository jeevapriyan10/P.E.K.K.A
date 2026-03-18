import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/ui/Avatar';
import { Colors } from '../../src/constants/colors';

const MOCK_MESSAGES = [
  { id: '1', name: 'Jeeva', lastMsg: 'Nice workout yesterday! 🔥', time: '2m', avatar: '🦁', unread: true },
  { id: '2', name: 'Alex', lastMsg: 'Sent a workout summary', time: '1h', avatar: '🏋️', unread: false },
  { id: '3', name: 'Sophie', lastMsg: 'Let\'s crushed the group goal!', time: '3h', avatar: '🏃‍♀️', unread: false },
];

export default function MessagingScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newBtn}>
          <MaterialCommunityIcons name="square-edit-outline" size={24} color="#FFF" />
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
        data={MOCK_MESSAGES}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.msgItem}>
            <Avatar source={item.avatar} size={50} />
            <View style={styles.msgInfo}>
              <Text style={styles.msgName}>{item.name}</Text>
              <Text style={[styles.msgText, item.unread && styles.unreadText]} numberOfLines={1}>
                {item.lastMsg}
              </Text>
            </View>
            <View style={styles.msgMeta}>
              <Text style={styles.msgTime}>{item.time}</Text>
              {item.unread && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        )}
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
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.cyan, marginTop: 8 }
});
