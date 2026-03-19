import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { Colors } from '../../src/constants/colors';
import { useFocusEffect } from 'expo-router';
import { notificationService } from '../../src/services/notificationService';
import { socialDb } from '../../src/db/socialDb';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const FITNESS_ICONS = ['arm-flex', 'run', 'bike', 'swim', 'yoga', 'food-apple', 'fire', 'trophy', 'weight-lifter', 'heart-pulse'];

export default function SettingsScreen() {
  const { db, isReady } = useDatabase();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'goals'>('profile');
  
  const [profileData, setProfileData] = useState({
    userId: null,
    name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderate',
    goal: 'maintenance',
    username: '',
    bio: '',
    avatar: FITNESS_ICONS[0],
    is_public: true,
    share_workouts: true,
    share_nutrition: true,
    share_steps: true,
    share_achievements: true
  });

  const [notifs, setNotifs] = useState({
    meals: true,
    workout: true,
    water: true,
    aiReport: true,
    achievements: true,
    breakfastTime: '08:00',
    lunchTime: '13:00',
    dinnerTime: '19:00',
    workoutTime: '17:30'
  });

  const loadAllData = async () => {
    if (!db || !isReady) return;
    try {
      const user: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      const social: any = await socialDb.getMyProfileSettings();
      
      if (user) {
        setProfileData(prev => ({
          ...prev,
          userId: user.id,
          name: user.name || '',
          age: user.age?.toString() || '',
          gender: user.sex || 'male',
          height_cm: user.height_cm?.toString() || '',
          weight_kg: user.weight_kg?.toString() || '',
          activity_level: user.activity_level || 'moderate',
          goal: user.goal || 'maintenance',
          ...(social ? {
            username: social.username || '',
            bio: social.bio || '',
            avatar: social.avatar_path || FITNESS_ICONS[0],
            is_public: social.is_public === 1,
            share_workouts: social.share_workouts === 1,
            share_nutrition: social.share_nutrition === 1,
            share_steps: social.share_steps === 1,
            share_achievements: social.share_achievements === 1
          } : {})
        }));
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
  };

  useFocusEffect(useCallback(() => { loadAllData(); }, [isReady]));

  const saveEverything = async () => {
    if (!db || !profileData.userId) return;

    // Validation
    const ageNum = profileData.age ? parseInt(profileData.age, 10) : null;
    const heightNum = profileData.height_cm ? parseFloat(profileData.height_cm) : null;
    const weightNum = profileData.weight_kg ? parseFloat(profileData.weight_kg) : null;

    if (profileData.name.trim().length === 0) {
      Alert.alert("Validation Error", "Please enter your name");
      return;
    }
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert("Validation Error", "Please enter a valid age (1-120)");
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      Alert.alert("Validation Error", "Please enter a valid height");
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert("Validation Error", "Please enter a valid weight");
      return;
    }

    try {
      // Update Users Table
      await db.runAsync(
        'UPDATE users SET name=?, age=?, sex=?, height_cm=?, weight_kg=?, activity_level=?, goal=?, updated_at=datetime("now") WHERE id=?',
        [profileData.name.trim(), ageNum, profileData.gender, heightNum, weightNum, profileData.activity_level, profileData.goal, profileData.userId]
      );

      // Update Social Profile Table
      await socialDb.updateMyProfile({
        username: profileData.username,
        display_name: profileData.name,
        bio: profileData.bio,
        avatar_path: profileData.avatar,
        is_public: profileData.is_public ? 1 : 0,
        share_workouts: profileData.share_workouts ? 1 : 0,
        share_nutrition: profileData.share_nutrition ? 1 : 0,
        share_steps: profileData.share_steps ? 1 : 0,
        share_achievements: profileData.share_achievements ? 1 : 0
      });

      // Update Notifications
      await updateNotifications(notifs);

      Alert.alert("Success", "Profile and Settings updated!");
    } catch (e) {
      Alert.alert("Error", "Failed to save: " + e);
    }
  };

  const updateNotifications = async (currentNotifs: typeof notifs) => {
    if (Constants.appOwnership === 'expo') {
        console.warn('Remote notifications might not work in Expo Go. Use development builds for full push support.');
    }

    try {
      await notificationService.cancelAllNotifications();
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) return;

      if (currentNotifs.meals) {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            const d = new Date();
            d.setHours(h || 0, m || 0, 0, 0);
            return d;
        };
        await notificationService.scheduleMealReminder('Breakfast', parseTime(currentNotifs.breakfastTime));
        await notificationService.scheduleMealReminder('Lunch', parseTime(currentNotifs.lunchTime));
        await notificationService.scheduleMealReminder('Dinner', parseTime(currentNotifs.dinnerTime));
      }

      if (currentNotifs.workout) {
        const [h, m] = currentNotifs.workoutTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h || 0, m || 0, 0, 0);
        await notificationService.scheduleWorkoutReminder(d);
      }

      if (currentNotifs.water) await notificationService.scheduleWaterReminder();
      if (currentNotifs.aiReport) await notificationService.scheduleWeeklyReport();
    } catch(err) {}
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileData(prev => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const renderProfile = () => (
    <View style={styles.section}>
      <View style={styles.avatarPicker}>
         <View style={styles.avatarWrapper}>
            {profileData.avatar.startsWith('http') || profileData.avatar.startsWith('/') || profileData.avatar.includes('file://') ? (
               <Image source={{ uri: profileData.avatar }} style={styles.avatarImg} />
            ) : (
               <View style={[styles.avatarImg, { backgroundColor: Colors.dark.bg3, justifyContent: 'center', alignItems: 'center' }]}>
                  <MaterialCommunityIcons name={profileData.avatar as any} size={40} color={Colors.dark.lime} />
               </View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage}>
               <MaterialCommunityIcons name="camera" size={16} color="#000" />
            </TouchableOpacity>
         </View>
         <View style={styles.iconSelection}>
            {FITNESS_ICONS.map(icon => (
               <TouchableOpacity key={icon} onPress={() => setProfileData(p=>({...p, avatar: icon}))} style={[styles.iconChoice, profileData.avatar === icon && styles.activeIconChoice]}>
                  <MaterialCommunityIcons name={icon as any} size={20} color={profileData.avatar === icon ? Colors.dark.lime : '#555'} />
               </TouchableOpacity>
            ))}
         </View>
      </View>

      <SectionTitle title="Social Identity" />
      <View style={styles.card}>
         <InputRow label="Username" value={profileData.username} onChange={(v: string) => setProfileData(p=>({...p, username: v}))} icon="at" />
         <InputRow label="Display Name" value={profileData.name} onChange={(v: string) => setProfileData(p=>({...p, name: v}))} icon="account-outline" />
         <InputRow label="Bio" value={profileData.bio} onChange={(v: string) => setProfileData(p=>({...p, bio: v}))} icon="text" multiline />
      </View>

      <SectionTitle title="Physical Performance" />
      <View style={styles.card}>
         <View style={styles.row}>
            <InputRow label="Age" value={profileData.age} onChange={(v: string) => setProfileData(p=>({...p, age: v}))} icon="cake-variant" keyboard="numeric" style={{flex: 1}} />
            <PickerRow label="Sex" value={profileData.gender} options={['male', 'female', 'other']} onSelect={(v: string) => setProfileData(p=>({...p, gender: v}))} style={{flex: 1}} />
         </View>
         <View style={styles.row}>
            <InputRow label="Weight (kg)" value={profileData.weight_kg} onChange={(v: string) => setProfileData(p=>({...p, weight_kg: v}))} icon="scale-bathroom" keyboard="numeric" style={{flex: 1}} />
            <InputRow label="Height (cm)" value={profileData.height_cm} onChange={(v: string) => setProfileData(p=>({...p, height_cm: v}))} icon="human-male-height" keyboard="numeric" style={{flex: 1}} />
         </View>
      </View>
    </View>
  );

  const renderGoals = () => (
     <View style={styles.section}>
        <SectionTitle title="Primary Objective" />
        <View style={styles.card}>
          <PickerRow label="Goal" value={profileData.goal} options={['lose', 'maintenance', 'gain']} onSelect={(v: string) => setProfileData(p=>({...p, goal: v}))} />
        </View>

        <SectionTitle title="Activity Multiplier" />
        <View style={styles.card}>
          <PickerRow label="Level" value={profileData.activity_level} options={['sedentary', 'light', 'moderate', 'active', 'very_active']} onSelect={(v: string) => setProfileData(p=>({...p, activity_level: v}))} />
        </View>

        <SectionTitle title="Privacy & Sharing" />
        <View style={styles.card}>
           <ToggleItem label="Public Profile" value={profileData.is_public} onToggle={(v: boolean) => setProfileData(p=>({...p, is_public: v}))} icon="eye-outline" />
           <View style={styles.divider} />
           <ToggleItem label="Share Workouts" value={profileData.share_workouts} onToggle={(v: boolean) => setProfileData(p=>({...p, share_workouts: v}))} icon="dumbbell" />
           <ToggleItem label="Share Nutrition" value={profileData.share_nutrition} onToggle={(v: boolean) => setProfileData(p=>({...p, share_nutrition: v}))} icon="food-apple-outline" />
           <ToggleItem label="Share Steps" value={profileData.share_steps} onToggle={(v: boolean) => setProfileData(p=>({...p, share_steps: v}))} icon="shoe-print" />
           <ToggleItem label="Share Achievements" value={profileData.share_achievements} onToggle={(v: boolean) => setProfileData(p=>({...p, share_achievements: v}))} icon="medal-outline" />
        </View>
     </View>
  );

  const renderNotifications = () => (
     <View style={styles.section}>
        <SectionTitle title="Smart Reminders" />
        <View style={styles.card}>
           <ToggleItem label="Meal Reminders" value={notifs.meals} onToggle={(v: boolean) => setNotifs(p=>({...p, meals: v}))} icon="food" />
           {notifs.meals && (
              <View style={styles.nestedInputs}>
                 <TimeInput label="Breakfast" value={notifs.breakfastTime} onChange={(v: string)=>setNotifs(p=>({...p, breakfastTime: v}))} />
                 <TimeInput label="Lunch" value={notifs.lunchTime} onChange={(v: string)=>setNotifs(p=>({...p, lunchTime: v}))} />
                 <TimeInput label="Dinner" value={notifs.dinnerTime} onChange={(v: string)=>setNotifs(p=>({...p, dinnerTime: v}))} />
              </View>
           )}
           <View style={styles.divider} />
           <ToggleItem label="Workout Reminder" value={notifs.workout} onToggle={(v: boolean) => setNotifs(p=>({...p, workout: v}))} icon="arm-flex-outline" />
           {notifs.workout && (
             <View style={styles.nestedInputs}>
                <TimeInput label="Daily Time" value={notifs.workoutTime} onChange={(v: string)=>setNotifs(p=>({...p, workoutTime: v}))} />
             </View>
           )}
           <View style={styles.divider} />
           <ToggleItem label="Drink Water (Every 2.5h)" value={notifs.water} onToggle={(v: boolean) => setNotifs(p=>({...p, water: v}))} icon="water-outline" />
        </View>
     </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={saveEverything}>
           <Text style={styles.saveBtnTxt}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
         {['profile', 'goals', 'notifications'].map((t) => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t as any)} style={[styles.tab, activeTab === t && styles.activeTab]}>
               <Text style={[styles.tabTxt, activeTab === t && styles.activeTabTxt]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
         ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
         {activeTab === 'profile' && renderProfile()}
         {activeTab === 'goals' && renderGoals()}
         {activeTab === 'notifications' && renderNotifications()}
         
         <TouchableOpacity style={styles.logoutBtn} onPress={() => Alert.alert("Beta Version", "Logout is disabled in this build.")}>
            <Text style={styles.logoutTxt}>Version 1.0.4 Pre-Release</Text>
         </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const SectionTitle = ({ title }: { title: string }) => <Text style={styles.sectionHeader}>{title}</Text>;

const InputRow = ({ label, value, onChange, icon, keyboard, multiline, style }: any) => (
   <View style={[styles.inputGroup, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, multiline && { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
         <MaterialCommunityIcons name={icon} size={18} color="#555" style={{marginRight: 10}} />
         <TextInput 
           style={styles.input} 
           value={value} 
           onChangeText={onChange} 
           placeholder={`Enter ${label.toLowerCase()}`}
           placeholderTextColor="#444"
           keyboardType={keyboard || 'default'}
           multiline={multiline}
         />
      </View>
   </View>
);

const PickerRow = ({ label, value, options, onSelect, style }: any) => (
   <View style={[styles.inputGroup, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.picker}>
         {options.map((opt: string) => (
            <TouchableOpacity key={opt} onPress={() => onSelect(opt)} style={[styles.pickerOpt, value === opt && styles.pickerActive]}>
               <Text style={[styles.pickerTxt, value === opt && styles.pickerActiveTxt]}>{opt}</Text>
            </TouchableOpacity>
         ))}
      </View>
   </View>
);

const ToggleItem = ({ label, value, onToggle, icon }: any) => (
   <View style={styles.toggleItem}>
      <View style={styles.row}>
         <MaterialCommunityIcons name={icon} size={20} color={Colors.dark.muted} style={{marginRight: 12}} />
         <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: Colors.dark.lime }} />
   </View>
);

const TimeInput = ({ label, value, onChange }: any) => (
   <View style={styles.timeInput}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput style={styles.timeBox} value={value} onChangeText={onChange} maxLength={5} placeholder="00:00" placeholderTextColor="#555" />
   </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  saveBtn: { backgroundColor: Colors.dark.lime, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  saveBtnTxt: { color: '#000', fontWeight: 'bold' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#111' },
  activeTab: { backgroundColor: Colors.dark.limebg },
  tabTxt: { color: '#555', fontWeight: 'bold' },
  activeTabTxt: { color: Colors.dark.lime },
  scroll: { padding: 20, paddingBottom: 60 },
  section: { gap: 20 },
  sectionHeader: { color: '#555', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#111', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#222' },
  avatarPicker: { alignItems: 'center', gap: 16 },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', borderWidth: 3, borderColor: Colors.dark.lime },
  avatarImg: { width: '100%', height: '100%' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.dark.lime, padding: 6, borderRadius: 12 },
  iconSelection: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  iconChoice: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  activeIconChoice: { borderColor: Colors.dark.lime, backgroundColor: '#1A2E2A' },
  inputGroup: { marginBottom: 16 },
  label: { color: '#777', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 16, height: 50, borderRadius: 16 },
  input: { flex: 1, color: '#FFF', fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pickerOpt: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222' },
  pickerActive: { backgroundColor: Colors.dark.lime, borderColor: Colors.dark.lime },
  pickerTxt: { color: '#777', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  pickerActiveTxt: { color: '#000' },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleLabel: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 10 },
  nestedInputs: { paddingLeft: 36, gap: 10, marginTop: 10, marginBottom: 16 },
  timeInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeLabel: { color: '#777', fontSize: 13 },
  timeBox: { backgroundColor: '#1A1A1A', color: '#FFF', width: 60, textAlign: 'center', padding: 6, borderRadius: 8, fontWeight: 'bold' },
  logoutBtn: { alignItems: 'center', marginTop: 40 },
  logoutTxt: { color: '#333', fontSize: 12, fontWeight: 'bold' }
});
