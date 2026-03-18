// filepath: app/nutrition/custom-food.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { addCustomFood } from '../../src/db/nutritionDb';

export default function CustomFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [name, setName] = useState(params.name as string || '');
  const [cal, setCal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [fib, setFib] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Required", "Food name is required");
    await addCustomFood({
      name,
      barcode: params.barcode as string || '',
      calories: parseFloat(cal) || 0,
      protein: parseFloat(p) || 0,
      carbs: parseFloat(c) || 0,
      fat: parseFloat(f) || 0,
      fiber: parseFloat(fib) || 0
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Cancel</Text></TouchableOpacity>
         <Text style={styles.title}>Custom Food</Text>
         <TouchableOpacity onPress={handleSave}><Text style={styles.saveBtn}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
         <Text style={styles.instText}>Enter nutritional values per 100g</Text>

         <Text style={styles.label}>Food Name</Text>
         <TextInput style={styles.input} value={name} onChangeText={setName} />

         <View style={styles.row}>
            <View style={styles.col}>
               <Text style={styles.label}>Calories (100g)</Text>
               <TextInput style={styles.input} keyboardType="numeric" value={cal} onChangeText={setCal} />
            </View>
            <View style={styles.col}>
               <Text style={styles.label}>Protein (g)</Text>
               <TextInput style={styles.input} keyboardType="numeric" value={p} onChangeText={setP} />
            </View>
         </View>
         <View style={styles.row}>
            <View style={styles.col}>
               <Text style={styles.label}>Carbs (g)</Text>
               <TextInput style={styles.input} keyboardType="numeric" value={c} onChangeText={setC} />
            </View>
            <View style={styles.col}>
               <Text style={styles.label}>Fat (g)</Text>
               <TextInput style={styles.input} keyboardType="numeric" value={f} onChangeText={setF} />
            </View>
         </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: Colors.dark.border },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  saveBtn: { color: Colors.dark.lime, fontSize: 16, fontWeight: 'bold' },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  instText: { color: Colors.dark.muted, marginBottom: 20 },
  label: { color: Colors.dark.text, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: Colors.dark.bg2, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: 12, padding: 14, color: Colors.dark.text, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 }
});
