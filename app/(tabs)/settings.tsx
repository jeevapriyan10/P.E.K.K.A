// filepath: app/(tabs)/settings.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../../src/providers/DatabaseProvider';
import { Colors } from '../../src/constants/colors';
import { useFocusEffect } from 'expo-router';
import { notificationService } from '../../src/services/notificationService';

export default function SettingsScreen() {
  const { db, isReady } = useDatabase();
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderate',
    goal: 'maintenance'
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

  const theme = Colors.dark;

  const loadProfile = async () => {
    if (!db || !isReady) return;
    try {
      const user: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      if (user) {
        setFormData({
          id: user.id,
          name: user.name || '',
          age: user.age?.toString() || '',
          gender: user.gender || 'male',
          height_cm: user.height_cm?.toString() || '',
          weight_kg: user.weight_kg?.toString() || '',
          activity_level: user.activity_level || 'moderate',
          goal: user.goal || 'maintenance'
        });
      }
    } catch (e) {
      console.warn('Failed to load user', e);
    }
  };

  useFocusEffect(useCallback(() => { loadProfile(); }, [isReady]));

  const saveProfile = async () => {
    if (!db || !formData.id) return;
    try {
      await db.runAsync(
        'UPDATE users SET name=?, age=?, gender=?, height_cm=?, weight_kg=?, activity_level=?, goal=? WHERE id=?',
        [
          formData.name, 
          parseInt(formData.age), 
          formData.gender, 
          parseFloat(formData.height_cm), 
          parseFloat(formData.weight_kg), 
          formData.activity_level, 
          formData.goal, 
          formData.id
        ]
      );
      Alert.alert("Success", "Profile updated. Your TDEE goals will be updated on the dashboard.");
    } catch (e) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleNotifToggle = async (key: keyof typeof notifs, value: boolean) => {
    setNotifs(prev => ({ ...prev, [key]: value }));
    // In a real app, we'd persist these to DB or AsyncStorage
    updateNotifications({ ...notifs, [key]: value });
  };

  const updateNotifications = async (currentNotifs: typeof notifs) => {
    await notificationService.cancelAllNotifications();
    const hasPermission = await notificationService.requestPermissions();
    
    if (!hasPermission) return;

    if (currentNotifs.meals) {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
        };
        await notificationService.scheduleMealReminder('Breakfast', parseTime(currentNotifs.breakfastTime));
        await notificationService.scheduleMealReminder('Lunch', parseTime(currentNotifs.lunchTime));
        await notificationService.scheduleMealReminder('Dinner', parseTime(currentNotifs.dinnerTime));
    }

    if (currentNotifs.workout) {
        const [h, m] = currentNotifs.workoutTime.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        await notificationService.scheduleWorkoutReminder(d);
    }

    if (currentNotifs.water) {
        await notificationService.scheduleWaterReminder();
    }

    if (currentNotifs.aiReport) {
        await notificationService.scheduleWeeklyReport();
    }
  };

  const updateField = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Personal Details" theme={theme}>
          <Input label="Name" value={formData.name} onChange={(v: string) => updateField('name', v)} theme={theme} icon="account" />
          <Input label="Age" value={formData.age} onChange={(v: string) => updateField('age', v)} theme={theme} icon="calendar-range" keyboard="numeric" />
          <View style={styles.row}>
             <Input label="Weight (kg)" value={formData.weight_kg} onChange={(v: string) => updateField('weight_kg', v)} theme={theme} icon="scale-bathroom" keyboard="numeric" style={{flex: 1}} />
             <Input label="Height (cm)" value={formData.height_cm} onChange={(v: string) => updateField('height_cm', v)} theme={theme} icon="human-male-height" keyboard="numeric" style={{flex: 1}} />
          </View>
        </Section>

        <Section title="Goals & Activity" theme={theme}>
           <Picker label="Gender" value={formData.gender} options={['male', 'female', 'other']} onSelect={(v: string) => updateField('gender', v)} theme={theme} />
           <Picker label="Goal" value={formData.goal} options={['lose', 'maintenance', 'gain']} onSelect={(v: string) => updateField('goal', v)} theme={theme} />
           <Picker label="Activity" value={formData.activity_level} options={['sedentary', 'light', 'moderate', 'active', 'very_active']} onSelect={(v: string) => updateField('activity_level', v)} theme={theme} />
        </Section>

        <Section title="Notifications" theme={theme}>
           <ToggleRow icon="food" label="Meal Reminders" value={notifs.meals} onToggle={(v: boolean) => handleNotifToggle('meals', v)} theme={theme} />
           {notifs.meals && (
             <View style={styles.timePickerContainer}>
                <TimeInput label="Breakfast" value={notifs.breakfastTime} onChange={(v: string) => setNotifs(p=>({...p, breakfastTime: v}))} theme={theme} />
                <TimeInput label="Lunch" value={notifs.lunchTime} onChange={(v: string) => setNotifs(p=>({...p, lunchTime: v}))} theme={theme} />
                <TimeInput label="Dinner" value={notifs.dinnerTime} onChange={(v: string) => setNotifs(p=>({...p, dinnerTime: v}))} theme={theme} />
             </View>
           )}
           
           <ToggleRow icon="dumbbell" label="Workout Reminders" value={notifs.workout} onToggle={(v: boolean) => handleNotifToggle('workout', v)} theme={theme} />
           {notifs.workout && (
             <TimeInput label="Scheduled Time" value={notifs.workoutTime} onChange={(v: string) => setNotifs(p=>({...p, workoutTime: v}))} theme={theme} />
           )}

           <ToggleRow icon="water" label="Water Reminders" value={notifs.water} onToggle={(v: boolean) => handleNotifToggle('water', v)} theme={theme} />
           <ToggleRow icon="robot" label="AI Weekly Report" value={notifs.aiReport} onToggle={(v: boolean) => handleNotifToggle('aiReport', v)} theme={theme} />
           <ToggleRow icon="medal" label="Achievements" value={notifs.achievements} onToggle={(v: boolean) => handleNotifToggle('achievements', v)} theme={theme} />
        </Section>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.dark.cyan }]} onPress={saveProfile}>
           <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children, theme }: any) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.muted }]}>{title}</Text>
    <View style={[styles.sectionCard, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
      {children}
    </View>
  </View>
);

const Input = ({ label, value, onChange, theme, icon, keyboard, style }: any) => (
  <View style={[{ marginBottom: 16 }, style]}>
    <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    <View style={[styles.inputContainer, { backgroundColor: theme.bg3, borderColor: theme.border }]}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.muted} />
      <TextInput 
        style={[styles.input, { color: theme.text }]} 
        value={value} 
        onChangeText={onChange} 
        keyboardType={keyboard || 'default'}
      />
    </View>
  </View>
);

const ToggleRow = ({ icon, label, value, onToggle, theme }: any) => (
    <View style={styles.toggleRow}>
        <View style={styles.row}>
            <MaterialCommunityIcons name={icon} size={20} color={theme.muted} />
            <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
        </View>
        <Switch value={value} onValueChange={onToggle} />
    </View>
);

const TimeInput = ({ label, value, onChange, theme }: any) => (
    <View style={styles.timeInputRow}>
        <Text style={[styles.timeInputLabel, { color: theme.muted }]}>{label}</Text>
        <TextInput 
            style={[styles.timeInput, { color: theme.text, backgroundColor: theme.bg3, borderColor: theme.border }]} 
            value={value}
            onChangeText={onChange}
            placeholder="HH:MM"
            placeholderTextColor={theme.muted}
            maxLength={5}
        />
    </View>
);

const Picker = ({ label, value, options, onSelect, theme }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    <View style={styles.pickerRow}>
      {options.map((opt: string) => (
        <TouchableOpacity 
          key={opt} 
          style={[
            styles.optBtn, 
            { backgroundColor: theme.bg3, borderColor: theme.border },
            value === opt && { backgroundColor: Colors.dark.cyan, borderColor: Colors.dark.cyan }
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.optText, { color: theme.text }, value === opt && { color: '#000' }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  scroll: { padding: 20, gap: 24, paddingBottom: 60 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  sectionCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  optText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  saveBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  timePickerContainer: { paddingLeft: 32, marginBottom: 12, gap: 8 },
  timeInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeInputLabel: { fontSize: 13 },
  timeInput: { width: 70, textAlign: 'center', padding: 6, borderRadius: 8, borderWidth: 1, fontSize: 14, fontWeight: 'bold' }
});
