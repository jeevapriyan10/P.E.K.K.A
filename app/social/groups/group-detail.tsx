// filepath: app/social/groups/group-detail.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, withRepeat } from 'react-native-reanimated';
import { socialDb } from '../../../src/db/socialDb';
import { groupContribution } from '../../../src/utils/groupContribution';
import { Colors } from '../../../src/constants/colors';
import { ProgressRing } from '../../../src/components/ProgressRing';
import { Confetti } from '../../../src/components/Confetti';
import { Avatar } from '../../../src/components/ui/Avatar';

export default function GroupDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [myContribution, setMyContribution] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const detailRef = useRef<any>(null);
  const [activeConfetti, setActiveConfetti] = useState(false);

  useFocusEffect(useCallback(() => {
    loadAll();
  }, [id]));

  const loadAll = async () => {
    const [data, profile] = await Promise.all([
      socialDb.getGroupDetail(id as string),
      socialDb.getMyProfileSettings()
    ]);
    if (!data.group) return router.back();
    
    setGroup(data.group);
    setMembers(data.members);
    setMyProfile(profile);

    // Calculate own contribution
    const contribution = await groupContribution.calculate(
      data.group.shared_goal_type as any, 
      data.group.goal_period as any
    );
    setMyContribution(contribution);
    
    // Update local DB for own contribution
    await socialDb.updateMemberContribution(id as string, (profile as any).username, contribution);
    
    // Refresh members list after update
    const refreshed = await socialDb.getGroupDetail(id as string);
    setMembers(refreshed.members);

    // Check milestones
    checkMilestones(contribution, data.group, data.members.length);
  };

  const checkMilestones = (contribution: number, g: any, mCount: number) => {
    const fairShare = g.shared_goal_target / Math.max(mCount, 1);
    const pct = contribution / fairShare;
    // Cross 50% or 100% of fair share
    if (pct >= 0.5 && pct < 0.51) triggerConfetti();
    if (pct >= 1.0 && pct < 1.01) triggerConfetti();
  };

  const triggerConfetti = () => {
    setActiveConfetti(true);
    setTimeout(() => setActiveConfetti(false), 5000);
  };

  const handleShareProgress = async () => {
    try {
      const uri = await captureRef(detailRef, { format: 'png', quality: 1.0 });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "Could not capture group progress.");
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group?",
      "You will no longer track this goal collaboratively. This action only removes the group from your local device.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave", 
          style: "destructive", 
          onPress: async () => {
            await socialDb.leaveGroup(id as string);
            router.back();
          } 
        }
      ]
    );
  };

  if (!group || !myProfile) return <View style={styles.container} />;

  const collectiveProgress = members.reduce((acc: number, m: any) => acc + (m.last_contribution || 0), 0);
  const mainProgressPct = Math.min(collectiveProgress / group.shared_goal_target, 1);
  const fairShare = group.shared_goal_target / members.length;
  const myProgressPct = Math.min(myContribution / fairShare, 1);

  const groupQRData = JSON.stringify({
    version: '1.0',
    group_id: group.group_id,
    name: group.name,
    description: group.description,
    icon: group.icon,
    creator_username: group.creator_username,
    goal_type: group.shared_goal_type,
    goal_target: group.shared_goal_target,
    goal_period: group.goal_period,
    created_at: group.created_at
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
         </TouchableOpacity>
         <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
         <TouchableOpacity onLongPress={handleLeaveGroup} onPress={() => setShowQR(true)}>
            <MaterialCommunityIcons name="account-plus-outline" size={24} color={Colors.dark.lime} />
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} ref={detailRef} showsVerticalScrollIndicator={false}>
         {/* Icon & Name */}
         <View style={styles.iconHeader}>
            <Avatar source={group.icon} size={80} color={Colors.dark.cyan} />
            <View style={{ height: 16 }} />
            <Text style={styles.groupGoal}>{group.shared_goal_period} {group.shared_goal_type} Goal</Text>
         </View>

         {/* Collective Ring */}
         <View style={styles.ringSection}>
            <ProgressRing 
               progress={mainProgressPct} 
               size={240} 
               strokeWidth={18} 
               color={Colors.dark.lime} 
               backgroundColor="#111"
            >
               <Text style={styles.progressVal}>{Math.floor(mainProgressPct * 100)}%</Text>
               <Text style={styles.progressLabel}>Group Goal</Text>
            </ProgressRing>

            <View style={styles.sideRing}>
               <ProgressRing 
                  progress={myProgressPct} 
                  size={100} 
                  strokeWidth={8} 
                  color={Colors.dark.cyan} 
                  backgroundColor="#111"
               >
                  <Text style={styles.myPctText}>{Math.floor(myProgressPct * 100)}%</Text>
               </ProgressRing>
               <Text style={styles.myRingLabel}>Your Share</Text>
            </View>
         </View>

         <View style={styles.statsSummary}>
            <View style={styles.statBox}>
               <Text style={styles.statTitle}>Total Progress</Text>
               <Text style={styles.statMain}>{Math.floor(collectiveProgress).toLocaleString()}</Text>
               <Text style={styles.statSub}>of {group.shared_goal_target.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
               <Text style={styles.statTitle}>Members</Text>
               <Text style={styles.statMain}>{members.length}</Text>
               <Text style={styles.statSub}>offline synced</Text>
            </View>
         </View>

         {/* Members List */}
         <Text style={styles.sectionTitle}>Members & Contributions</Text>
         {members.sort((a: any, b: any) => b.last_contribution - a.last_contribution).map((m: any, idx: number) => (
           <View key={m.username} style={styles.memberItem}>
              <Avatar source={m.avatar} size={44} />
              <View style={styles.memberInfo}>
                 <View style={styles.nameRow}>
                    <Text style={styles.memberName}>{m.username === myProfile.username ? 'You' : m.display_name}</Text>
                    {idx === 0 && <MaterialCommunityIcons name="crown" size={16} color={Colors.dark.amber} />}
                 </View>
                 <Text style={styles.memberSynced}>Synced: {m.last_synced_at ? new Date(m.last_synced_at).toLocaleTimeString() : 'Never'}</Text>
                 
                 {/* Member Achievements Row */}
                 {m.achievements && m.achievements.length > 0 && (
                   <View style={styles.achievementRow}>
                      {m.achievements.slice(0, 3).map((a: any) => (
                        <View key={a.key} style={styles.miniBadge}>
                           <MaterialCommunityIcons name="medal" size={10} color={Colors.dark.lime} />
                           <Text style={styles.miniBadgeText} numberOfLines={1}>{a.title}</Text>
                        </View>
                      ))}
                      {m.achievements.length > 3 && (
                        <Text style={styles.moreBadges}>+{m.achievements.length - 3}</Text>
                      )}
                   </View>
                 )}
              </View>
              <View style={styles.memberContribution}>
                 <Text style={styles.contributionValue}>{Math.floor(m.last_contribution)}</Text>
                 <Text style={styles.contributionUnit}>{group.shared_goal_type}</Text>
              </View>
           </View>
         ))}

         <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShareProgress}>
               <MaterialCommunityIcons name="share-variant" size={20} color={Colors.dark.lime} />
               <Text style={styles.actionBtnText}>Share Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/social/groups/group-leaderboard', params: { id: group.group_id } } as any)}>
               <MaterialCommunityIcons name="trophy-outline" size={20} color={Colors.dark.amber} />
               <Text style={styles.actionBtnText}>Leaderboard</Text>
            </TouchableOpacity>
         </View>

         <TouchableOpacity style={styles.refreshBtn} onPress={loadAll}>
            <MaterialCommunityIcons name="refresh" size={18} color="#555" />
            <Text style={styles.refreshText}>Update My Contribution</Text>
         </TouchableOpacity>

         <View style={{ height: 40 }} />
      </ScrollView>

      {/* Group Join QR Modal */}
      <Modal visible={showQR} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
               <TouchableOpacity style={styles.closeModal} onPress={() => setShowQR(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#FFF" />
               </TouchableOpacity>
               <Text style={styles.qrTitle}>Invite to {group.name}</Text>
               <Text style={styles.qrSub}>Show this QR code to your friends. They can scan it from their 'Join Group' screen to start tracking this goal with you locally.</Text>
               
               <View style={styles.qrContainer}>
                  <QRCode value={groupQRData} size={250} backgroundColor="#FFF" color="#000" />
               </View>

               <Text style={styles.qrDisclaimer}>
                  Contribution privacy: Your personal daily stats are NOT sent. Only group info is shared. Peer progress syncs when you re-scan each other's Profile QRs.
               </Text>
            </View>
         </View>
      </Modal>

      <Confetti active={activeConfetti} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  scroll: { padding: 20 },
  iconHeader: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 32, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconText: { fontSize: 40 },
  groupGoal: { color: Colors.dark.lime, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12, letterSpacing: 2 },
  ringSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: -30 },
  progressVal: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  progressLabel: { color: '#555', fontSize: 13, textTransform: 'uppercase', marginTop: 4 },
  sideRing: { alignItems: 'center', marginTop: 100 },
  myPctText: { color: Colors.dark.cyan, fontSize: 18, fontWeight: 'bold' },
  myRingLabel: { color: '#555', fontSize: 11, textTransform: 'uppercase', marginTop: 8 },
  statsSummary: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 24, padding: 24, marginBottom: 40, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statTitle: { color: '#555', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' },
  statMain: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  statSub: { color: '#333', fontSize: 12 },
  divider: { width: 1, height: 40, backgroundColor: '#222' },
  sectionTitle: { color: '#777', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1 },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, marginBottom: 12 },
  memberAvatarBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  memberAvatarEmoji: { fontSize: 24 },
  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  memberSynced: { color: '#555', fontSize: 11, marginTop: 2 },
  memberContribution: { alignItems: 'flex-end' },
  contributionValue: { color: Colors.dark.lime, fontSize: 16, fontWeight: 'bold' },
  contributionUnit: { color: '#555', fontSize: 10, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111', height: 50, borderRadius: 16 },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 20 },
  refreshText: { color: '#555', fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#111', borderRadius: 32, padding: 30, alignItems: 'center' },
  closeModal: { alignSelf: 'flex-end', padding: 10 },
  qrTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  qrSub: { color: '#555', fontSize: 14, textAlign: 'center', marginBottom: 30 },
  qrContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 30 },
  qrDisclaimer: { color: '#333', fontSize: 11, textAlign: 'center', lineHeight: 18 },
  achievementRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#222', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniBadgeText: { color: Colors.dark.lime, fontSize: 9, fontWeight: 'bold' },
  moreBadges: { color: '#444', fontSize: 10, fontWeight: 'bold' }
});
