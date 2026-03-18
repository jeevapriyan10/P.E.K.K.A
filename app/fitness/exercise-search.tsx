// filepath: app/fitness/exercise-search.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { searchExercises } from '../../src/db/fitnessDb';
import { useFitnessStore } from '../../src/store/fitnessStore';

export default function ExerciseSearchScreen() {
  const router = useRouter();
  const { addExercise } = useFitnessStore();
  
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [results, setResults] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout|null>(null);

  const groups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body', 'Glutes'];

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const res = await searchExercises(query, filter);
      setResults(res);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, filter]);

  const select = (ex: any) => {
    addExercise(ex);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Close</Text></TouchableOpacity>
         <Text style={styles.title}>Add Exercise</Text>
         <View style={{width: 40}} />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search by name..."
          placeholderTextColor={Colors.dark.muted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      <View style={styles.filterWrap}>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={groups}
          keyExtractor={grp => grp}
          renderItem={({item}) => (
            <TouchableOpacity 
              style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterTxt, filter === item && styles.filterTxtActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList 
        data={results}
        keyExtractor={i => i.id.toString()}
        renderItem={({item}) => (
           <TouchableOpacity style={styles.card} onPress={() => select(item)}>
             <Text style={styles.name}>{item.name}</Text>
             <Text style={styles.sub}>{item.muscle_group_primary} • {item.equipment}</Text>
           </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises found.</Text>}
        contentContainerStyle={{paddingBottom: 60}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  searchBar: { paddingHorizontal: 16, paddingBottom: 12 },
  input: { backgroundColor: Colors.dark.bg2, borderRadius: 12, padding: 14, color: Colors.dark.text, borderColor: Colors.dark.border, borderWidth: 1 },
  filterWrap: { paddingBottom: 12, borderBottomWidth: 1, borderColor: Colors.dark.border2 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: Colors.dark.bg3 },
  filterBtnActive: { backgroundColor: Colors.dark.cyan },
  filterTxt: { color: Colors.dark.muted, fontWeight: 'bold' },
  filterTxtActive: { color: Colors.dark.bg },
  card: { padding: 16, borderBottomWidth: 1, borderColor: Colors.dark.border2 },
  name: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  sub: { color: Colors.dark.dim, fontSize: 12, marginTop: 4 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }
});
