// filepath: app/onboarding.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useDatabase } from '../src/providers/DatabaseProvider';
import { StorageKeys } from '../src/constants/storageKeys';
import { Colors } from '../src/constants/colors';

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const router = useRouter();
  const { db, isReady } = useDatabase();
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Male');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [goal, setGoal] = useState('Lose Fat');
  const [activity, setActivity] = useState('Light');

  const onNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const onBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onFinish = async () => {
    if (!isReady || !db) return;
    try {
      const h = parseFloat(height) || 0;
      const w = parseFloat(weight) || 0;
      const a = parseInt(age, 10) || 0;

      await db.runAsync(
        'INSERT INTO users (name, age, sex, height_cm, weight_kg, goal, activity_level, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
        [name, a, sex, h, w, goal, activity]
      );
      
      // Initialize social profile too for "Common Profile"
      const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random()*1000);
      await db.runAsync(
        'INSERT INTO social_profile (username, display_name, bio, avatar_path, is_public, created_at) VALUES (?, ?, ?, ?, 1, datetime("now"))',
        [username, name, `Fitness enthusiast since ${new Date().getFullYear()}`, 'arm-flex']
      );

      await AsyncStorage.setItem(StorageKeys.ONBOARDING_COMPLETE, '1');
      router.replace('/(tabs)');
    } catch (e) {
      console.warn("Error inserting user config", e);
    }
  };

  const renderChips = (options: string[], selected: string, onSelect: (val: string) => void) => {
    return (
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <TouchableOpacity 
            key={opt}
            style={[styles.chip, selected === opt && styles.chipSelected]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, selected === opt && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!isReady) {
     return <View style={styles.container}><Text style={{color: '#fff'}}>Initializing Database...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to P.E.K.K.A</Text>
          <View style={styles.dots}>
            {[...Array(TOTAL_STEPS)].map((_, i) => (
              <View key={i} style={[styles.dot, step >= i + 1 && styles.activeDot]} />
            ))}
          </View>
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.label}>What is your name?</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={Colors.dark.muted} />
            
            <Text style={styles.label}>What is your age?</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" placeholderTextColor={Colors.dark.muted} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.label}>Biological Sex</Text>
            {renderChips(['Male', 'Female', 'Other'], sex, setSex)}
            
            <Text style={styles.label}>Height ({heightUnit})</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex: 1}]} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="175" placeholderTextColor={Colors.dark.muted} />
              <TouchableOpacity style={styles.unitToggle} onPress={() => setHeightUnit(h => h === 'cm' ? 'ft' : 'cm')}>
                <Text style={styles.unitText}>{heightUnit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.label}>Current Weight ({weightUnit})</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex: 1}]} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="70" placeholderTextColor={Colors.dark.muted} />
              <TouchableOpacity style={styles.unitToggle} onPress={() => setWeightUnit(w => w === 'kg' ? 'lbs' : 'kg')}>
                <Text style={styles.unitText}>{weightUnit}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Goal Weight ({weightUnit})</Text>
            <TextInput style={styles.input} value={goalWeight} onChangeText={setGoalWeight} keyboardType="numeric" placeholder="65" placeholderTextColor={Colors.dark.muted} />
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.label}>Primary Goal</Text>
            {renderChips(['Lose Fat', 'Build Muscle', 'Maintain', 'Get Fitter'], goal, setGoal)}
            
            <Text style={styles.label}>Activity Level</Text>
            {renderChips(['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'], activity, setActivity)}
          </View>
        )}

        <View style={styles.footer}>
          {step > 1 ? (
             <TouchableOpacity style={styles.btnSecondary} onPress={onBack}>
               <Text style={styles.btnSecondaryText}>Back</Text>
             </TouchableOpacity>
          ) : <View style={{width: 80}} />}
          
          <TouchableOpacity style={styles.btnPrimary} onPress={step === TOTAL_STEPS ? onFinish : onNext}>
             <Text style={styles.btnPrimaryText}>{step === TOTAL_STEPS ? 'Finish' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  scroll: { padding: 24, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 16 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.bg4 },
  activeDot: { backgroundColor: Colors.dark.lime, width: 24 },
  card: { gap: 16 },
  label: { fontSize: 16, color: Colors.dark.text, fontWeight: '600', marginTop: 8 },
  input: { backgroundColor: Colors.dark.bg2, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 12, padding: 16, color: Colors.dark.text, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  unitToggle: { backgroundColor: Colors.dark.bg3, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border },
  unitText: { color: Colors.dark.lime, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.dark.bg3, borderWidth: 1, borderColor: Colors.dark.border },
  chipSelected: { backgroundColor: Colors.dark.limebg, borderColor: Colors.dark.lime },
  chipText: { color: Colors.dark.muted, fontWeight: '600' },
  chipTextSelected: { color: Colors.dark.lime },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  btnPrimary: { backgroundColor: Colors.dark.lime, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 },
  btnPrimaryText: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { backgroundColor: Colors.dark.bg3, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 24 },
  btnSecondaryText: { color: Colors.dark.text, fontWeight: 'bold', fontSize: 16 }
});
