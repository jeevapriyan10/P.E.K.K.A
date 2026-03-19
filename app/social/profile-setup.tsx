// filepath: app/social/profile-setup.tsx
// Trigger types
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { socialDb } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

import { Avatar } from '../../src/components/ui/Avatar';

const FITNESS_ICONS = [
  'arm-flex', 'run', 'bike', 'swim', 'yoga', 'food-apple', 'food-drumstick', 'leek', 
  'account', 'fire', 'trophy', 'weight-lifter', 'hiking', 'karate', 
  'basketball', 'soccer', 'jump-rope', 'medal', 'heart-pulse', 'lightning-bolt'
];

export default function ProfileSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar: FITNESS_ICONS[0],
    is_public: 1,
    share_workouts: 1,
    share_nutrition: 1,
    share_steps: 1,
    share_achievements: 1
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    const profile: any = await socialDb.getMyProfileSettings();
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar: profile.avatar_path || FITNESS_ICONS[0],
        is_public: profile.is_public ?? 1,
        share_workouts: profile.share_workouts ?? 1,
        share_nutrition: profile.share_nutrition ?? 1,
        share_steps: profile.share_steps ?? 1,
        share_achievements: profile.share_achievements ?? 1
      });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateField('avatar', result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      Alert.alert("Invalid Username", "3-20 characters. Letters, numbers, and underscores only.");
      return;
    }

    try {
      await socialDb.updateMyProfile({
        username: formData.username,
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_path: formData.avatar,
        is_public: formData.is_public ? 1 : 0,
        share_workouts: formData.share_workouts ? 1 : 0,
        share_nutrition: formData.share_nutrition ? 1 : 0,
        share_steps: formData.share_steps ? 1 : 0,
        share_achievements: formData.share_achievements ? 1 : 0
      });
      Alert.alert("Success", "Profile updated!");
      router.replace('/(tabs)/social');
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) {
        Alert.alert("Error", "Username already taken.");
      } else {
        console.error("Profile Setup Error: ", e);
        Alert.alert("Error", "Failed to save profile: " + (e.message || String(e)));
      }
    }
  };

  const updateField = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Setup</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar Picker */}
        <View style={styles.avatarSection}>
          <Avatar source={formData.avatar} size={100} borderColor={Colors.dark.lime} />
          
          <TouchableOpacity style={styles.pickPhotoBtn} onPress={pickImage}>
             <MaterialCommunityIcons name="image-plus" size={20} color={Colors.dark.lime} />
             <Text style={styles.pickPhotoText}>Upload Custom Photo</Text>
          </TouchableOpacity>

          <View style={styles.iconGrid}>
            {FITNESS_ICONS.map(icon => (
              <TouchableOpacity 
                key={icon} 
                style={[styles.iconBtn, formData.avatar === icon && styles.activeIcon]} 
                onPress={() => updateField('avatar', icon)}
              >
                <MaterialCommunityIcons name={icon as any} size={24} color={formData.avatar === icon ? Colors.dark.lime : '#444'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Section title="Identity">
          <Input label="Username (@)" value={formData.username} onChange={(v: string) => updateField('username', v)} placeholder="fitness_warrior" />
          <Input label="Display Name" value={formData.display_name} onChange={(v: string) => updateField('display_name', v)} placeholder="John Doe" />
          <Input label="Bio" value={formData.bio} onChange={(v: string) => updateField('bio', v)} placeholder="Crushing goals one rep at a time." multiline />
        </Section>

        <Section title="Privacy & Sharing">
          <View style={styles.privacyMsg}>
              <MaterialCommunityIcons name="shield-check" size={16} color={Colors.dark.lime} />
              <Text style={styles.privacyMsgText}>Profile data is stored only on your device. Friends see what you share when they scan your QR code.</Text>
          </View>
          
          <ToggleRow label="Public Profile" value={!!formData.is_public} onToggle={(v: boolean) => updateField('is_public', v)} />
          <View style={styles.divider} />
          <ToggleRow label="Share Workouts" value={!!formData.share_workouts} onToggle={(v: boolean) => updateField('share_workouts', v)} />
          <ToggleRow label="Share Nutrition (Calories)" value={!!formData.share_nutrition} onToggle={(v: boolean) => updateField('share_nutrition', v)} />
          <ToggleRow label="Share Daily Steps" value={!!formData.share_steps} onToggle={(v: boolean) => updateField('share_steps', v)} />
          <ToggleRow label="Share Achievements" value={!!formData.share_achievements} onToggle={(v: boolean) => updateField('share_achievements', v)} />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children }: any) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const Input = ({ label, value, onChange, placeholder, multiline }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput 
      style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]} 
      value={value} 
      onChangeText={onChange} 
      placeholder={placeholder}
      placeholderTextColor="#555"
      multiline={multiline}
    />
  </View>
);

const ToggleRow = ({ label, value, onToggle }: any) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch value={value} onValueChange={onToggle} trackColor={{ true: Colors.dark.lime }} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  saveText: { color: Colors.dark.lime, fontWeight: 'bold', fontSize: 16 },
  scroll: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  pickPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1A1A1A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 16, marginBottom: 24 },
  pickPhotoText: { color: Colors.dark.lime, fontWeight: 'bold', fontSize: 14 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  iconBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  activeIcon: { borderColor: Colors.dark.lime, backgroundColor: '#1A2E2A' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#555', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  card: { backgroundColor: '#111', borderRadius: 20, padding: 16 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 13, color: '#AAA', marginBottom: 8 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, color: '#FFF', fontSize: 15 },
  privacyMsg: { flexDirection: 'row', gap: 8, backgroundColor: '#1A2E2A', padding: 12, borderRadius: 12, marginBottom: 16 },
  privacyMsgText: { flex: 1, color: Colors.dark.lime, fontSize: 12, lineHeight: 18 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { color: '#FFF', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 8 }
});
