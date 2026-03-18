// filepath: app/social/groups/group-leaderboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../../src/db/socialDb';
import { groupContribution } from '../../../src/utils/groupContribution';
import { Colors } from '../../../src/constants/colors';
import { Avatar } from '../../../src/components/ui/Avatar';

export default function GroupLeaderboard() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [id]));

  const loadData = async () => {
    setLoading(true);
    const [data, profile] = await Promise.all([
      socialDb.getGroupDetail(id as string),
      socialDb.getMyProfileSettings()
    ]);
    if (data.group) {
      setGroup(data.group);
      setMembers(data.members.sort((a: any, b: any) => b.last_contribution - a.last_contribution));
      setMyProfile(profile);
    }
    setLoading(false);
  };

  const syncMyStats = async () => {
    setLoading(true);
    const contribution = await groupContribution.calculate(
      group.shared_goal_type as any, 
      group.goal_period as any
    );
    await socialDb.updateMemberContribution(id as string, myProfile.username, contribution);
    await loadData();
    setLoading(false);
  };

  if (loading && !group) return <View style={styles.container}><ActivityIndicator color={Colors.dark.lime} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Group Rankings</Text>
         <View style={{ width: 28 }} />
      </View>

       <View style={styles.groupHeader}>
          <Avatar source={group?.icon} size={40} color={Colors.dark.cyan} />
         <View style={styles.groupHeaderInfo}>
            <Text style={styles.groupName}>{group?.name}</Text>
            <Text style={styles.groupTarget}>{group?.shared_goal_target.toLocaleString()} {group?.shared_goal_type} ({group?.goal_period})</Text>
         </View>
      </View>

      <FlatList 
         data={members}
         keyExtractor={(item: any) => item.username}
         contentContainerStyle={styles.list}
         renderItem={({ item, index }: { item: any, index: number }) => {
            const isMe = item.username === myProfile?.username;
            const rank = index + 1;
            
            return (
              <View style={[styles.memberCard, isMe && styles.meCard]}>
                 <View style={styles.rankBox}>
                    {rank === 1 ? (
                       <MaterialCommunityIcons name="crown" size={24} color={Colors.dark.amber} />
                    ) : (
                       <Text style={styles.rankNum}>{rank}</Text>
                    )}
                 </View>
                                  <Avatar source={item.avatar} size={40} />

                 <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, isMe && styles.meText]}>
                       {isMe ? 'You (Me)' : item.display_name}
                    </Text>
                    <Text style={styles.memberSync}>Synced: {new Date(item.last_synced_at).toLocaleDateString()}</Text>
                 </View>

                 <View style={styles.contributionBox}>
                    <Text style={[styles.contributionVal, isMe && styles.meText]}>
                       {Math.floor(item.last_contribution).toLocaleString()}
                    </Text>
                    <Text style={styles.contributionLabel}>{group?.shared_goal_type}</Text>
                 </View>
              </View>
            );
         }}
      />

      <View style={styles.footer}>
         <TouchableOpacity style={styles.syncBtn} onPress={syncMyStats}>
            <MaterialCommunityIcons name="refresh" size={20} color="#000" />
            <Text style={styles.syncBtnText}>Update My Stats</Text>
         </TouchableOpacity>
         <Text style={styles.footerNote}>Contributions are snapshots from when members last shared their QR codes.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  groupHeader: { flexDirection: 'row', padding: 20, backgroundColor: '#111', marginHorizontal: 20, borderRadius: 24, alignItems: 'center', gap: 16, marginBottom: 20 },
  groupIcon: { fontSize: 32 },
  groupHeaderInfo: { flex: 1 },
  groupName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  groupTarget: { color: Colors.dark.muted, fontSize: 12, marginTop: 4, textTransform: 'uppercase' },
  list: { padding: 20 },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
  meCard: { borderColor: Colors.dark.lime, backgroundColor: Colors.dark.lime + '10' },
  rankBox: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankNum: { color: '#555', fontSize: 16, fontWeight: 'bold' },
  avatarBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarEmoji: { fontSize: 24 },
  memberInfo: { flex: 1 },
  memberName: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  memberSync: { color: '#555', fontSize: 11, marginTop: 2 },
  meText: { color: Colors.dark.lime },
  contributionBox: { alignItems: 'flex-end' },
  contributionVal: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  contributionLabel: { color: '#555', fontSize: 10, textTransform: 'uppercase' },
  footer: { padding: 30, alignItems: 'center', gap: 16 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.dark.lime, paddingHorizontal: 30, paddingVertical: 18, borderRadius: 20, width: '100%', justifyContent: 'center' },
  syncBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  footerNote: { color: '#333', fontSize: 11, textAlign: 'center', lineHeight: 18 }
});
