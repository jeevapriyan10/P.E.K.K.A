// filepath: app/social/groups/create-group.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { socialDb } from '../../../src/db/socialDb';
import { Colors } from '../../../src/constants/colors';

import { Avatar } from '../../../src/components/ui/Avatar';

const GROUP_ICONS = [
  'trophy', 'fire', 'arm-flex', 'weight-lifter', 'run', 'bike', 'swim', 
  'yoga', 'food-apple', 'food-drumstick', 'hiking', 'karate', 'basketball', 
  'soccer', 'jump-rope', 'medal', 'heart-pulse', 'lightning-bolt', 'sword-cross', 'shield-check'
];

export default function CreateGroup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: GROUP_ICONS[0],
    goalType: 'steps',
    goalTarget: '100000',
    period: 'weekly'
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) return Alert.alert("Error", "Please enter a group name.");
    
    try {
      const myProfile: any = await socialDb.getMyProfileSettings();
      if (!myProfile) return Alert.alert("Error", "Please set up your profile first.");

      const groupId = Crypto.randomUUID();
      await socialDb.createGroup({
        group_id: groupId,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        creator: myProfile.username,
        goalType: formData.goalType,
        goalTarget: Number(formData.goalTarget),
        period: formData.period
      });

      router.replace({ pathname: '/social/groups/group-detail', params: { id: groupId } } as any);
    } catch (e) {
      Alert.alert("Error", "Failed to create group.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>New Group</Text>
         <TouchableOpacity onPress={handleCreate}>
            <Text style={styles.createBtn}>Create</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
         <View style={styles.iconSelection}>
            <Avatar source={formData.icon} size={100} color={Colors.dark.cyan} />
            <View style={{ height: 20 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconList}>
               {GROUP_ICONS.map(icon => (
                 <TouchableOpacity 
                   key={icon} 
                   style={[styles.iconBtn, formData.icon === icon && styles.activeIcon]} 
                   onPress={() => setFormData({ ...formData, icon })}
                 >
                    <MaterialCommunityIcons name={icon as any} size={24} color={formData.icon === icon ? Colors.dark.lime : '#444'} />
                 </TouchableOpacity>
               ))}
            </ScrollView>
         </View>

         <View style={styles.section}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput 
               style={styles.input} 
               value={formData.name} 
               onChangeText={v => setFormData({ ...formData, name: v })} 
               placeholder="e.g. Morning Runners" 
               placeholderTextColor="#333" 
            />
            
            <Text style={styles.label}>Description</Text>
            <TextInput 
               style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
               value={formData.description} 
               onChangeText={v => setFormData({ ...formData, description: v })} 
               placeholder="What is this group about?" 
               placeholderTextColor="#333" 
               multiline
            />
         </View>

         <View style={styles.section}>
            <Text style={styles.label}>Shared Goal</Text>
            <View style={styles.typeRow}>
               {['steps', 'workouts', 'calories', 'streak_days'].map(type => (
                 <TouchableOpacity 
                   key={type} 
                   style={[styles.typeChip, formData.goalType === type && styles.activeChip]} 
                   onPress={() => setFormData({ ...formData, goalType: type })}
                 >
                    <Text style={[styles.chipText, formData.goalType === type && styles.activeChipText]}>
                       {type.replace('_', ' ')}
                    </Text>
                 </TouchableOpacity>
               ))}
            </View>

            <View style={styles.targetRow}>
               <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Collective Target</Text>
                  <TextInput 
                     style={styles.input} 
                     value={formData.goalTarget} 
                     onChangeText={v => setFormData({ ...formData, goalTarget: v })} 
                     keyboardType="numeric"
                     placeholder="e.g. 70000" 
                     placeholderTextColor="#333" 
                  />
               </View>
               <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Period</Text>
                  <View style={styles.periodRow}>
                     {['weekly', 'monthly'].map(p => (
                       <TouchableOpacity 
                         key={p} 
                         style={[styles.periodChip, formData.period === p && styles.activeChip]} 
                         onPress={() => setFormData({ ...formData, period: p })}
                       >
                          <Text style={[styles.chipText, formData.period === p && styles.activeChipText]}>{p}</Text>
                       </TouchableOpacity>
                     ))}
                  </View>
               </View>
            </View>
         </View>

         <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color={Colors.dark.lime} />
            <Text style={styles.infoText}>
               Groups are local snapshots. When friends scan your Group QR, they join on their devices. Progress updates when you scan their profiles.
            </Text>
         </View>

         <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  createBtn: { color: Colors.dark.lime, fontWeight: 'bold', fontSize: 16 },
  scroll: { padding: 20 },
  iconSelection: { alignItems: 'center', marginBottom: 30 },
  iconList: { gap: 12, paddingHorizontal: 10 },
  iconBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  activeIcon: { borderColor: Colors.dark.lime, backgroundColor: '#1A2E2A' },
  section: { marginBottom: 30 },
  label: { color: '#555', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  input: { backgroundColor: '#111', borderRadius: 16, padding: 18, color: '#FFF', fontSize: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeChip: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  activeChip: { backgroundColor: Colors.dark.lime },
  chipText: { color: '#AAA', fontWeight: 'bold', textTransform: 'capitalize' },
  activeChipText: { color: '#000' },
  targetRow: { flexDirection: 'row', gap: 15 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: { flex: 1, backgroundColor: '#111', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  infoBox: { backgroundColor: '#0B110D', padding: 20, borderRadius: 24, flexDirection: 'row', gap: 16, alignItems: 'center' },
  infoText: { flex: 1, color: '#4CAF50', fontSize: 12, lineHeight: 18, opacity: 0.8 }
});
