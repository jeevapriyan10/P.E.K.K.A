// filepath: app/social/groups/index.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../../src/db/socialDb';
import { Colors } from '../../../src/constants/colors';

export default function GroupsHome() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    loadGroups();
  }, []));

  const loadGroups = async () => {
    setRefreshing(true);
    const myGroups = await socialDb.getMyGroups();
    setGroups(myGroups);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Community Groups</Text>
         <TouchableOpacity onPress={() => router.push('/social/groups/join-group' as any)}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color={Colors.dark.lime} />
         </TouchableOpacity>
      </View>

      <FlatList 
         data={groups}
         keyExtractor={item => item.group_id}
         contentContainerStyle={styles.list}
         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadGroups} tintColor={Colors.dark.lime} />}
         renderItem={({ item }) => (
           <TouchableOpacity 
             style={styles.groupCard} 
             onPress={() => router.push({ pathname: '/social/groups/group-detail', params: { id: item.group_id } } as any)}
           >
              <View style={styles.groupIconBox}>
                 <Text style={styles.groupIcon}>{item.icon}</Text>
              </View>
              <View style={styles.groupInfo}>
                 <Text style={styles.groupName}>{item.name}</Text>
                 <Text style={styles.groupMeta}>{item.current_members} members • {item.shared_goal_period}</Text>
                 <View style={styles.goalBadge}>
                    <Text style={styles.goalText}>{item.shared_goal_target} {item.shared_goal_type}</Text>
                 </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#333" />
           </TouchableOpacity>
         )}
         ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={80} color="#111" />
              <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
           </View>
         }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/social/groups/create-group' as any)}>
         <MaterialCommunityIcons name="plus" size={30} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  groupCard: { backgroundColor: '#111', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  groupIconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  groupIcon: { fontSize: 32 },
  groupInfo: { flex: 1 },
  groupName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  groupMeta: { color: '#555', fontSize: 13, marginTop: 2, marginBottom: 8 },
  goalBadge: { alignSelf: 'flex-start', backgroundColor: Colors.dark.lime + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  goalText: { color: Colors.dark.lime, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', paddingVertical: 100 },
  emptyText: { color: '#333', marginTop: 20, fontSize: 15 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.dark.lime, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 }
});
