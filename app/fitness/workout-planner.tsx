// filepath: app/fitness/workout-planner.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { searchExercises, getPersonalRecords } from '../../src/db/fitnessDb';
import { useFitnessStore } from '../../src/store/fitnessStore';

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'
];

export default function WorkoutPlanner() {
  const router = useRouter();
  const { prepareWorkout, addExercise } = useFitnessStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [exercises, setExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [prMap, setPrMap] = useState<Record<string, { weight: number; reps: number }>>({});

  // Load exercises on mount
  useEffect(() => {
    loadExercises();
  }, []);

  // Filter when query or muscleFilter changes
  useEffect(() => {
    filterExercises();
  }, [searchQuery, muscleFilter, exercises]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      // Load all exercises
      const all = await searchExercises('', 'All');
      setExercises(all);

      // Load PRs for all exercises
      const prs: Record<string, { weight: number; reps: number }> = {};
      await Promise.all(all.map(async (ex) => {
        const pr = await getPersonalRecords(ex.name);
        if ((pr.max_weight || 0) > 0 || (pr.max_reps || 0) > 0) {
          prs[ex.name] = { weight: pr.max_weight || 0, reps: pr.max_reps || 0 };
        }
      }));
      setPrMap(prs);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = useCallback(() => {
    let filtered = exercises;

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        (ex.muscle_group_primary && ex.muscle_group_primary.toLowerCase().includes(query))
      );
    }

    if (muscleFilter !== 'All') {
      filtered = filtered.filter(ex => ex.muscle_group_primary === muscleFilter);
    }

    setFilteredExercises(filtered);
  }, [searchQuery, muscleFilter, exercises]);

  const toggleExercise = (exercise: any) => {
    const isSelected = selectedExercises.find(ex => ex.name === exercise.name);
    if (isSelected) {
      setSelectedExercises(prev => prev.filter(ex => ex.name !== exercise.name));
    } else {
      setSelectedExercises(prev => [...prev, exercise]);
    }
  };

  const isSelected = (name: string) => {
    return selectedExercises.find(ex => ex.name === name) !== undefined;
  };

  const getPRBadge = (name: string) => {
    const pr = prMap[name];
    if (!pr || (pr.weight === 0 && pr.reps === 0)) return null;
    return (
      <View style={styles.prBadge}>
        <Text style={styles.prBadgeText}>PR: {pr.weight}kg × {pr.reps}</Text>
      </View>
    );
  };

  const handleStartWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises', 'Please select at least one exercise.');
      return;
    }

    Alert.alert(
      'Prepare Workout',
      `Prepare ${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: () => {
            // Prepare workout in store (no auto-start)
            prepareWorkout(`Custom Workout - ${new Date().toLocaleDateString()}`);

            // Add all selected exercises
            selectedExercises.forEach(ex => {
              addExercise(ex);
            });

            // Navigate to active workout
            router.replace('/fitness/active-workout');
          }
        }
      ]
    );
  };

  const renderExerciseItem = ({ item }: { item: any }) => {
    const selected = isSelected(item.name);

    return (
      <TouchableOpacity
        style={[styles.exerciseCard, selected && styles.exerciseCardSelected]}
        onPress={() => toggleExercise(item)}
      >
        <View style={styles.exerciseHeader}>
          <Text style={[styles.exerciseName, selected && styles.exerciseNameSelected]}>
            {item.name}
          </Text>
          {selected && (
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.dark.lime} />
          )}
        </View>

        <View style={styles.exerciseMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="human-male-male" size={14} color={Colors.dark.muted} />
            <Text style={styles.metaText}>{item.muscle_group_primary || 'Uncategorized'}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="dumbbell" size={14} color={Colors.dark.muted} />
            <Text style={styles.metaText}>{item.category || 'Strength'}</Text>
          </View>
        </View>

        {getPRBadge(item.name)}

        <View style={styles.equipmentRow}>
          <Text style={styles.equipmentText}>Equipment: {item.equipment || 'None'}</Text>
        </View>

        {item.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  useFocusEffect(
    useCallback(() => {
      // Reset selection when screen comes into focus
      setSelectedExercises([]);
      setSearchQuery('');
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Exercises</Text>
        <TouchableOpacity
          style={[styles.addBtn, selectedExercises.length === 0 && styles.addBtnDisabled]}
          onPress={handleStartWorkout}
          disabled={selectedExercises.length === 0}
        >
          <Text style={styles.addBtnText}>
            {selectedExercises.length > 0 ? `Start (${selectedExercises.length})` : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.dark.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={Colors.dark.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={Colors.dark.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Muscle Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {MUSCLE_GROUPS.map(group => (
          <TouchableOpacity
            key={group}
            style={[styles.filterChip, muscleFilter === group && styles.filterChipActive]}
            onPress={() => setMuscleFilter(group)}
          >
            <Text style={[
              styles.filterChipText,
              muscleFilter === group && styles.filterChipTextActive
            ]}>
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.lime} />
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={item => item.id.toString()}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={Colors.dark.bg3} />
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySub}>Try a different search or filter</Text>
            </View>
          }
        />
      )}

      {/* Selected Count Bar */}
      {selectedExercises.length > 0 && (
        <View style={styles.selectedBar}>
          <Text style={styles.selectedText}>
            {selectedExercises.length} exercise{selectedExercises.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border
  },
  headerTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: Colors.dark.lime,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  addBtnDisabled: {
    backgroundColor: Colors.dark.bg3
  },
  addBtnText: {
    color: Colors.dark.bg,
    fontWeight: 'bold',
    fontSize: 14
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.bg2,
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    paddingVertical: 12,
    fontSize: 16
  },

  filterScroll: {
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginRight: 8
  },
  filterChipActive: {
    backgroundColor: Colors.dark.limebg,
    borderColor: Colors.dark.lime
  },
  filterChipText: {
    color: Colors.dark.muted,
    fontSize: 13,
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: Colors.dark.lime
  },

  list: {
    padding: 12,
    paddingBottom: 100
  },
  resultCount: {
    color: Colors.dark.muted,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12
  },
  emptyText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600'
  },
  emptySub: {
    color: Colors.dark.muted,
    fontSize: 14
  },

  exerciseCard: {
    backgroundColor: Colors.dark.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border
  },
  exerciseCardSelected: {
    borderColor: Colors.dark.lime,
    backgroundColor: Colors.dark.limebg + '20'
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8
  },
  exerciseNameSelected: {
    color: Colors.dark.lime
  },

  exerciseMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metaText: {
    color: Colors.dark.muted,
    fontSize: 12
  },

  prBadge: {
    backgroundColor: Colors.dark.amber + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8
  },
  prBadgeText: {
    color: Colors.dark.amber,
    fontSize: 11,
    fontWeight: 'bold'
  },

  equipmentRow: {
    marginTop: 4
  },
  equipmentText: {
    color: Colors.dark.dim,
    fontSize: 12
  },

  descriptionText: {
    color: Colors.dark.muted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  selectedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.lime,
    padding: 16,
    alignItems: 'center'
  },
  selectedText: {
    color: Colors.dark.bg,
    fontWeight: 'bold',
    fontSize: 16
  }
});
