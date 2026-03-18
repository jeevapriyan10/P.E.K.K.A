// filepath: app/fitness/cardio-log.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';

const cardioTypes = [
  { name: 'Running', met: 8.0, icon: 'run' },
  { name: 'Cycling', met: 6.0, icon: 'bike' },
  { name: 'Swimming', met: 7.0, icon: 'swim' },
  { name: 'Walking', met: 3.5, icon: 'walk' },
  { name: 'HIIT', met: 10.0, icon: 'lightning-bolt' },
  { name: 'Elliptical', met: 5.0, icon: 'jump-rope' },
];

export default function CardioLogScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(cardioTypes[0]);
  const [duration, setDuration] = useState('30');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [userWeight, setUserWeight] = useState(75);

  useEffect(() => {
    const fetchWeight = async () => {
        const db = await getDb();
        const user: any = await db.getFirstAsync('SELECT weight_kg FROM users ORDER BY id DESC LIMIT 1');
        if (user?.weight_kg) setUserWeight(user.weight_kg);
    };
    fetchWeight();
  }, []);

  const calculateCalories = () => {
    const mins = parseFloat(duration) || 0;
    const cals = selectedType.met * userWeight * (mins / 60);
    return Math.round(cals);
  };

  const handleSave = async () => {
    try {
      const db = await getDb();
      await db.runAsync(
        'INSERT INTO cardio_sessions (date, type, duration_minutes, distance_km, calories_burned, intensity, notes, logged_at) VALUES (date("now"), ?, ?, ?, ?, ?, ?, datetime("now"))',
        [selectedType.name, parseInt(duration), parseFloat(distance) || 0, calculateCalories(), 'Medium', notes]
      );
      Alert.alert("Success", "Cardio session logged!");
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save cardio session");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="close" size={24} color={Colors.dark.text} /></TouchableOpacity>
        <Text style={styles.title}>Log Activity</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={styles.saveBtnTxt}>Log</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>SELECT ACTIVITY</Text>
        <View style={styles.grid}>
          {cardioTypes.map(type => (
            <TouchableOpacity 
              key={type.name} 
              style={[styles.typeCard, selectedType.name === type.name && styles.typeCardActive]}
              onPress={() => setSelectedType(type)}
            >
              <MaterialCommunityIcons 
                name={type.icon as any} 
                size={28} 
                color={selectedType.name === type.name ? Colors.dark.cyan : Colors.dark.muted} 
              />
              <Text style={[styles.typeName, selectedType.name === type.name && styles.typeNameActive]}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DURATION (MIN)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={duration} 
                onChangeText={setDuration} 
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>DISTANCE (KM)</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                placeholder="Optional" 
                placeholderTextColor={Colors.dark.dim}
                value={distance} 
                onChangeText={setDistance} 
              />
            </View>
          </View>

          <View style={styles.burnCard}>
            <MaterialCommunityIcons name="fire" size={24} color={Colors.dark.amber} />
            <View>
              <Text style={styles.burnVal}>{calculateCalories()} KCAL</Text>
              <Text style={styles.burnLbl}>ESTIMATED ENERGY BURNED</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>NOTES</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              multiline 
              placeholder="How was your session?" 
              placeholderTextColor={Colors.dark.dim}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', backgroundColor: Colors.dark.bg2 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  saveBtn: { backgroundColor: Colors.dark.cyan, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
  saveBtnTxt: { color: Colors.dark.bg, fontWeight: 'bold' },
  scroll: { padding: 20, gap: 24 },
  sectionTitle: { color: Colors.dark.muted, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: { width: '47%', backgroundColor: Colors.dark.bg2, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border, gap: 8 },
  typeCardActive: { borderColor: Colors.dark.cyan, backgroundColor: 'rgba(50,200,250,0.05)' },
  typeName: { color: Colors.dark.muted, fontSize: 12, fontWeight: 'bold' },
  typeNameActive: { color: Colors.dark.cyan },
  form: { gap: 24 },
  row: { flexDirection: 'row', gap: 16 },
  field: { flex: 1, gap: 8 },
  label: { color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold' },
  input: { backgroundColor: Colors.dark.bg2, color: Colors.dark.text, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  burnCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.amber },
  burnVal: { color: Colors.dark.amber, fontSize: 24, fontWeight: 'bold' },
  burnLbl: { color: Colors.dark.muted, fontSize: 9, fontWeight: 'bold' }
});
