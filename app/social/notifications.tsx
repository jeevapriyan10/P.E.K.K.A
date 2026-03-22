// filepath: app/social/notifications.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Avatar } from '../../src/components/ui/Avatar';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { socialDb } from '../../src/db/socialDb';

type Notification = {
  id: number;
  type: string;
  actor_username: string;
  actor_avatar: string | null;
  reference_id?: number;
  created_at: string;
  is_read: number;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useFocusEffect(useCallback(() => {
    if (isReady) loadNotifications();
  }, [isReady]));

  const loadNotifications = async () => {
    try {
      const notifs = await socialDb.getUserNotifications();
      setNotifications(notifs as Notification[]);
    } catch (e) {
      console.error('Failed to load notifications:', e);
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

  const getNotificationText = (type: string, referenceId?: number): string => {
    switch (type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'mention': return 'mentioned you in a comment';
      default: return 'performed an action';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return { name: 'heart', color: Colors.dark.rose };
      case 'comment': return { name: 'comment', color: Colors.dark.sky };
      case 'follow': return { name: 'account-plus', color: Colors.dark.cyan };
      case 'mention': return { name: 'at', color: Colors.dark.lime };
      default: return { name: 'bell', color: Colors.dark.amber };
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = getIcon(item.type);

    return (
      <TouchableOpacity style={styles.item}>
        <Avatar source={item.actor_avatar} size={40} />
        <View style={[styles.iconBox, { backgroundColor: icon.color + '20', marginLeft: 12 }]}>
          <MaterialCommunityIcons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.text}>
            <Text style={styles.user}>{item.actor_username}</Text> {getNotificationText(item.type, item.reference_id)}
          </Text>
          <Text style={styles.time}>{getTimeAgo(item.created_at)}</Text>
        </View>
        {item.is_read === 0 ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { padding: 16, gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 16, gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  text: { color: '#FFF', fontSize: 14, lineHeight: 18 },
  user: { fontWeight: 'bold' },
  time: { color: '#777', fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.cyan, marginLeft: 8 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }
});
