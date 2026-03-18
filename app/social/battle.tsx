// filepath: app/social/battle.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { socialDb, ProfileExport } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';
import { Avatar } from '../../src/components/ui/Avatar';

export default function StatsBattle() {
  const router = useRouter();
  const [friends, setFriends] = useState<ProfileExport[]>([]);
  const [myProfile, setMyProfile] = useState<ProfileExport | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<ProfileExport | null>(null);
  const arenaRef = React.useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [f, me] = await Promise.all([
      socialDb.getStoredFriends(),
      socialDb.generateExportPayload()
    ]);
    setFriends(f);
    setMyProfile(me);
  };

  const handleShareResult = async () => {
    try {
      const uri = await captureRef(arenaRef, { format: 'png', quality: 1.0 });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "Could not capture battle arena.");
    }
  };

  if (myProfile && !myProfile.is_public) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Battle Arena</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyCenter}>
          <MaterialCommunityIcons name="shield-lock" size={80} color={Colors.dark.amber} />
          <Text style={styles.emptyTitle}>Profile is Private</Text>
          <Text style={styles.emptyText}>You cannot battle stats while your profile is private. Enable "Public Profile" in settings to start competing.</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/settings' as any)}>
            <Text style={styles.scanBtnText}>Adjust Privacy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!friends.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stats Battle</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyCenter}>
          <MaterialCommunityIcons name="account-group-outline" size={80} color="#333" />
          <Text style={styles.emptyTitle}>No Friends Yet</Text>
          <Text style={styles.emptyText}>Add friends by scanning their QR code to start battling stats!</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/social/scan-friend' as any)}>
            <Text style={styles.scanBtnText}>Scan Friend QR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedFriend && myProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedFriend(null)}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Battle Arena</Text>
          <TouchableOpacity onPress={handleShareResult}>
            <MaterialCommunityIcons name="share-variant" size={24} color={Colors.dark.lime} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.arenaScroll} showsVerticalScrollIndicator={false}>
          <View ref={arenaRef} style={{ backgroundColor: '#000', paddingVertical: 10 }}>
            <View style={styles.versusCard}>
              <View style={styles.fighter}>
                <Avatar source={myProfile.avatar_path} size={70} borderColor={Colors.dark.lime} />
                <Text style={styles.fighterName}>You</Text>
              </View>
              <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>
              <View style={styles.fighter}>
                <Avatar source={selectedFriend.avatar_path} size={70} borderColor={Colors.dark.cyan} />
                <Text style={styles.fighterName}>{selectedFriend.display_name}</Text>
              </View>
            </View>

            {!selectedFriend.is_public ? (
              <View style={styles.friendPrivateBox}>
                <MaterialCommunityIcons name="lock" size={24} color="#777" />
                <Text style={styles.friendPrivateText}>This friend's profile is currently private.</Text>
              </View>
            ) : (
              <View style={styles.metricsContainer}>
                <BattleMetric
                  label="Week Workouts"
                  myValue={myProfile.stats.week_workouts}
                  friendValue={selectedFriend.stats.week_workouts}
                  icon="arm-flex"
                />
                <BattleMetric
                  label="Current Streak"
                  myValue={myProfile.stats.current_streak}
                  friendValue={selectedFriend.stats.current_streak}
                  icon="fire"
                  unit="d"
                />
                <BattleMetric
                  label="Full Volume"
                  myValue={myProfile.stats.total_volume_kg}
                  friendValue={selectedFriend.stats.total_volume_kg}
                  icon="weight-lifter"
                  unit="kg"
                />
                <BattleMetric
                  label="Avg Daily Steps"
                  myValue={myProfile.stats.week_steps_avg}
                  friendValue={selectedFriend.stats.week_steps_avg}
                  icon="walk"
                />
                <BattleMetric
                  label="Weekly Cals (Avg)"
                  myValue={myProfile.stats.week_calories_avg}
                  friendValue={selectedFriend.stats.week_calories_avg}
                  icon="food-apple"
                  privacyCheck
                />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={[styles.badgeBase, { backgroundColor: Colors.dark.lime + '20' }]}>
              <MaterialCommunityIcons name="trophy-variant" size={16} color={Colors.dark.lime} />
              <Text style={{ color: Colors.dark.lime, fontWeight: 'bold', fontSize: 12 }}>Winner takes crown</Text>
            </View>
            <TouchableOpacity style={styles.rematchBtn} onPress={() => Alert.alert("Rematch!", "Share your latest QR to update your stats for a rematch.")}>
              <Text style={styles.rematchBtnText}>Request Rematch</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Opponent</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={friends}
        keyExtractor={item => item.username}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.friendItem} onPress={() => setSelectedFriend(item)}>
            <Avatar source={item.avatar_path} size={45} />
            <View style={[styles.friendInfo, { marginLeft: 16 }]}>
              <Text style={styles.friendNameMain}>{item.display_name}</Text>
              <Text style={styles.friendSub}>@{item.username} • Last synced recently</Text>
            </View>
            <MaterialCommunityIcons name="sword-cross" size={24} color={Colors.dark.lime} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const BattleMetric = ({ label, myValue, friendValue, icon, unit = '', privacyCheck = false }: any) => {
  const isPrivate = privacyCheck && (friendValue === -1 || myValue === -1);
  const myNum = Number(myValue);
  const frNum = Number(friendValue);

  const myWins = myNum > frNum;
  const friendWins = frNum > myNum;

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLabelArea}>
        <MaterialCommunityIcons name={icon} size={16} color={Colors.dark.muted} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>

      <View style={styles.compArea}>
        <View style={[styles.valBox, myWins && styles.winnerBox, friendWins && styles.loserBox]}>
          {myValue === -1 ? (
             <MaterialCommunityIcons name="lock" size={16} color="#444" />
          ) : (
            <Text style={[styles.valText, myWins && styles.winnerText, friendWins && styles.loserText]}>
              {myNum + unit}
            </Text>
          )}
        </View>

        <View style={[styles.valBox, friendWins && styles.winnerBox, myWins && styles.loserBox]}>
          {friendValue === -1 ? (
            <MaterialCommunityIcons name="lock" size={16} color="#444" />
          ) : (
            <Text style={[styles.valText, friendWins && styles.winnerText, myWins && styles.loserText]}>
              {frNum + unit}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 24 },
  emptyText: { color: '#777', textAlign: 'center', marginTop: 12, marginBottom: 32, lineHeight: 22 },
  scanBtn: { backgroundColor: Colors.dark.lime, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 16 },
  scanBtnText: { color: '#000', fontWeight: 'bold' },
  list: { padding: 20 },
  friendItem: { backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12 },
  friendAvatar: { fontSize: 32, marginRight: 16 },
  friendInfo: { flex: 1 },
  friendNameMain: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  friendSub: { color: '#555', fontSize: 12, marginTop: 2 },
  arenaScroll: { padding: 20 },
  versusCard: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#111', padding: 30, borderRadius: 32, marginBottom: 30 },
  fighter: { alignItems: 'center', gap: 12 },
  fighterAvatar: { fontSize: 60 },
  fighterName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  vsCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#333' },
  vsText: { color: Colors.dark.lime, fontWeight: 'bold', fontStyle: 'italic' },
  metricsContainer: { gap: 16 },
  metricRow: { backgroundColor: '#111', borderRadius: 20, padding: 16, gap: 12 },
  metricLabelArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricLabel: { color: '#777', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase' },
  friendPrivateBox: { backgroundColor: '#111', padding: 30, borderRadius: 24, alignItems: 'center', gap: 12, marginTop: 20 },
  friendPrivateText: { color: '#777', fontSize: 14, textAlign: 'center' },
  compArea: { flexDirection: 'row', gap: 12 },
  valBox: { flex: 1, height: 45, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  valText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  winnerBox: { backgroundColor: Colors.dark.lime + '40', borderWidth: 1, borderColor: Colors.dark.lime },
  loserBox: { backgroundColor: '#3B1F23', borderWidth: 1, borderColor: '#7E2D33' },
  winnerText: { color: Colors.dark.lime },
  loserText: { color: '#E57373' },
  footer: { marginTop: 40, alignItems: 'center', gap: 16 },
  badgeBase: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  rematchBtn: { width: '100%', padding: 18, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', borderRadius: 16, alignItems: 'center' },
  rematchBtnText: { color: '#AAA', fontWeight: 'bold' }
});
