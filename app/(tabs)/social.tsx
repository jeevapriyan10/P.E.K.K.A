// filepath: app/(tabs)/social.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb, ProfileExport } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

import { Avatar } from '../../src/components/ui/Avatar';

export default function SocialHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'battle' | 'groups' | 'profile'>('feed');
  const [friends, setFriends] = useState<ProfileExport[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileExport | null>(null);

  useFocusEffect(useCallback(() => {
    loadSocialData();
  }, []));

  const loadSocialData = async () => {
    const [f, me] = await Promise.all([
      socialDb.getStoredFriends(),
      socialDb.generateExportPayload()
    ]);
    setFriends(f || []);
    setMyProfile(me);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedSubScreen />;
      case 'battle':
        return <BattleSubScreen friends={friends} myProfile={myProfile} onRefresh={loadSocialData} />;
      case 'groups':
        return <GroupsSubScreen />;
      case 'profile':
        return <ProfileSubScreen myProfile={myProfile} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Hub</Text>
        <TouchableOpacity style={styles.qrBtn} onPress={() => router.push('/social/my-qr' as any)}>
          <MaterialCommunityIcons name="qrcode-scan" size={22} color={Colors.dark.lime} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['feed', 'profile', 'battle', 'groups'].map((tab: any) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

// SUB-SCREENS
import Feed from '../social/feed';
const FeedSubScreen = () => <Feed />;

const BattleSubScreen = ({ friends, myProfile, onRefresh }: any) => {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.meCard}>
         {myProfile ? (
           <View style={styles.meInner}>
             <Avatar source={myProfile.avatar_path} size={50} />
             <View style={[styles.meInfo, { marginLeft: 16 }]}>
               <Text style={styles.meName}>{myProfile.display_name}</Text>
               <Text style={styles.meUsername}>@{myProfile.username}</Text>
             </View>
             <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/social/profile-setup' as any)}>
               <MaterialCommunityIcons name="pencil-outline" size={20} color="#AAA" />
             </TouchableOpacity>
           </View>
         ) : (
           <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/social/profile-setup' as any)}>
              <MaterialCommunityIcons name="account-plus-outline" size={32} color={Colors.dark.lime} />
              <Text style={styles.setupText}>Set up your social profile</Text>
           </TouchableOpacity>
         )}
      </View>

      <TouchableOpacity style={styles.mainAction} onPress={() => router.push('/social/battle' as any)}>
         <View style={[styles.iconBox, { backgroundColor: Colors.dark.cyan + '20' }]}>
            <MaterialCommunityIcons name="sword-cross" size={32} color={Colors.dark.cyan} />
         </View>
         <View style={{ flex: 1 }}>
            <Text style={styles.actionMainTitle}>Stats Battle Arena</Text>
            <Text style={styles.actionSubTitle}>Challenge friends to a stats showdown</Text>
         </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Local Friends ({friends.length})</Text>
         <TouchableOpacity onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={18} color="#555" />
         </TouchableOpacity>
      </View>

      {friends.length > 0 ? (
         <View style={styles.friendList}>
            {friends.map((f: any) => (
              <View key={f.username} style={styles.friendItem}>
                 <Avatar source={f.avatar_path} size={40} />
                 <View style={[styles.friendInfo, { marginLeft: 16 }]}>
                    <Text style={styles.friendName}>{f.display_name}</Text>
                    <Text style={styles.friendSub}>@{f.username}</Text>
                 </View>
                 <View style={styles.friendStats}>
                    <MaterialCommunityIcons name="fire" size={16} color={Colors.dark.amber} />
                    <Text style={styles.friendStatText}>{f.stats.current_streak}</Text>
                 </View>
              </View>
            ))}
         </View>
      ) : (
         <View style={styles.emptyFriends}>
            <MaterialCommunityIcons name="account-search-outline" size={40} color="#222" />
            <Text style={styles.emptyText}>Scan a friend's QR code to compare stats offline.</Text>
         </View>
      )}
    </ScrollView>
  );
};

const GroupsSubScreen = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    socialDb.getMyGroups().then(setGroups);
  }, []));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <TouchableOpacity style={styles.mainAction} onPress={() => router.push('/social/groups' as any)}>
         <View style={[styles.iconBox, { backgroundColor: Colors.dark.lime + '20' }]}>
            <MaterialCommunityIcons name="account-group" size={32} color={Colors.dark.lime} />
         </View>
         <View style={{ flex: 1 }}>
            <Text style={styles.actionMainTitle}>Community Groups</Text>
            <Text style={styles.actionSubTitle}>Join or create shared goals</Text>
         </View>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
         <Text style={styles.sectionTitle}>Your Groups ({groups.length})</Text>
      </View>

      {groups.length > 0 ? (
        <View style={styles.friendList}>
          {groups.map(g => (
            <TouchableOpacity key={g.group_id} style={styles.friendItem} onPress={() => router.push({ pathname: '/social/groups/group-detail', params: { id: g.group_id } } as any)}>
               <Avatar source={g.icon} size={40} color={Colors.dark.cyan} />
               <View style={[styles.friendInfo, { marginLeft: 16 }]}>
                  <Text style={styles.friendName}>{g.name}</Text>
                  <Text style={styles.friendSub}>{g.current_members} members • {g.shared_goal_type}</Text>
               </View>
               <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyFriends}>
           <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const ProfileSubScreen = ({ myProfile }: any) => {
  const router = useRouter();
  const [myPosts, setMyPosts] = useState<any[]>([]);

  useFocusEffect(useCallback(() => {
    socialDb.getMyPosts().then(setMyPosts);
  }, []));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
       <View style={styles.meCard}>
          {myProfile ? (
            <View style={{ alignItems: 'center' }}>
               <Avatar source={myProfile.avatar_path} size={80} borderColor={Colors.dark.lime} />
               <View style={{ height: 16 }} />
               <Text style={styles.meName}>{myProfile.display_name}</Text>
               <Text style={styles.meUsername}>@{myProfile.username}</Text>
               <Text style={{ color: '#777', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>{myProfile.bio}</Text>
               
               <View style={styles.profileStatsRow}>
                  <View style={styles.pStatItem}><Text style={styles.pStatVal}>{myPosts.length}</Text><Text style={styles.pStatLabel}>Posts</Text></View>
                  <View style={styles.pStatItem}><Text style={styles.pStatVal}>{myProfile.stats.current_streak}</Text><Text style={styles.pStatLabel}>Streak</Text></View>
                  <View style={styles.pStatItem}><Text style={styles.pStatVal}>{myProfile.stats.achievements_count}</Text><Text style={styles.pStatLabel}>Medals</Text></View>
               </View>

               <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/social/profile-setup' as any)}>
                  <Text style={styles.editProfileText}>Edit Profile</Text>
               </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/social/profile-setup' as any)}>
               <Text style={styles.setupText}>Set up your social profile</Text>
            </TouchableOpacity>
          )}
       </View>

       <Text style={styles.sectionTitle}>My Posts</Text>
       <View style={styles.postsGrid}>
          {myPosts.length > 0 ? myPosts.map(p => (
            <TouchableOpacity key={p.id} style={styles.gridItem}>
               {p.media_path ? (
                 <Image source={{ uri: p.media_path }} style={styles.gridImg} />
               ) : (
                 <View style={styles.textPostThumb}>
                    <MaterialCommunityIcons name="format-quote-close" size={24} color="#333" />
                 </View>
               )}
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyText}>No posts yet.</Text>
          )}
       </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  qrBtn: { padding: 10, backgroundColor: '#111', borderRadius: 14 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 20 },
  tabItem: { paddingVertical: 8 },
  activeTabItem: { borderBottomWidth: 2, borderBottomColor: Colors.dark.lime },
  tabLabel: { color: '#555', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  activeTabLabel: { color: Colors.dark.lime },
  scroll: { padding: 20 },
  meCard: { backgroundColor: '#111', borderRadius: 24, padding: 24, marginBottom: 20 },
  meInner: { flexDirection: 'row', alignItems: 'center' },
  meAvatar: { fontSize: 40, marginRight: 16 },
  meInfo: { flex: 1 },
  meName: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  meUsername: { fontSize: 13, color: '#555' },
  editBtn: { padding: 8 },
  setupBtn: { padding: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 16 },
  setupText: { color: Colors.dark.lime, fontWeight: 'bold' },
  mainAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 20, borderRadius: 24, marginBottom: 24, gap: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actionMainTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  actionSubTitle: { color: '#555', fontSize: 12, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: '#555', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  friendList: { gap: 12 },
  friendItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', padding: 16, borderRadius: 20 },
  friendAvatar: { fontSize: 28, marginRight: 16 },
  friendInfo: { flex: 1 },
  friendName: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  friendSub: { color: '#555', fontSize: 12 },
  friendStats: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  friendStatText: { color: Colors.dark.amber, fontWeight: 'bold' },
  emptyFriends: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#333', textAlign: 'center' },
  profileStatsRow: { flexDirection: 'row', gap: 30, marginTop: 24, marginBottom: 24 },
  pStatItem: { alignItems: 'center' },
  pStatVal: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  pStatLabel: { color: '#555', fontSize: 11, textTransform: 'uppercase' },
  editProfileBtn: { backgroundColor: '#222', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  editProfileText: { color: '#FFF', fontWeight: 'bold' },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  gridItem: { width: '31%', aspectRatio: 1, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%' },
  textPostThumb: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
