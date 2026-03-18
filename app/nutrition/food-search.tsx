// filepath: app/nutrition/food-search.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { searchFoodDatabase } from '../../src/db/nutritionDb';

export default function FoodSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (query.trim().length > 1) {
        const res = await searchFoodDatabase(query);
        setResults(res);
      } else {
        setResults([]);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const navToDetail = (item: any) => {
    router.push({
      pathname: '/nutrition/food-detail',
      params: { 
        name: item.name, 
        calories: item.calories_per_100g.toString(),
        protein: item.protein_per_100g.toString(),
        carbs: item.carbs_per_100g.toString(),
        fat: item.fat_per_100g.toString(),
        fiber: (item.fiber_per_100g || 0).toString()
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>Search Food</Text>
        <TouchableOpacity onPress={() => router.push('/nutrition/barcode-scanner')}><Text style={styles.scanBtn}>📷 Scan</Text></TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search foods..."
          placeholderTextColor={Colors.dark.muted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={i => i.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navToDetail(item)}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.brand}>{item.source === 'system' ? 'Common Food' : item.source}</Text>
            </View>
            <View style={styles.macros}>
              <Text style={styles.macroText}>{Math.round(item.calories_per_100g)} kcal</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Type to search database</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/nutrition/custom-food')}>
        <Text style={styles.fabText}>+ Custom Food</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  scanBtn: { color: Colors.dark.lime, fontSize: 16, fontWeight: 'bold' },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  searchBar: { paddingHorizontal: 16, paddingBottom: 16 },
  input: { backgroundColor: Colors.dark.bg2, borderRadius: 12, padding: 14, color: Colors.dark.text, borderColor: Colors.dark.border, borderWidth: 1 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 },
  card: { padding: 16, borderBottomWidth: 1, borderColor: Colors.dark.border2, flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  brand: { color: Colors.dark.muted, fontSize: 12, marginTop: 4 },
  macros: { justifyContent: 'center' },
  macroText: { color: Colors.dark.lime, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: Colors.dark.lime, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
  fabText: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 }
});
