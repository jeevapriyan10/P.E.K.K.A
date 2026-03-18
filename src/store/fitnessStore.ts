// filepath: src/store/fitnessStore.ts
import { create } from 'zustand';

interface ActiveSet {
  id: string;
  set_number: number;
  weight: number;
  reps: number;
  done: boolean;
  is_pr?: boolean;
}

interface ActiveExercise {
  id: string;
  name: string;
  muscle_group_primary: string;
  notes: string;
  sets: ActiveSet[];
}

interface FitnessState {
  isWorkoutActive: boolean;
  activeWorkoutName: string;
  activeWorkoutStartTime: number | null;
  activeExercises: ActiveExercise[];
  startWorkout: (name: string) => void;
  addExercise: (exercise: any) => void;
  updateSet: (exId: string, setId: string, field: string, value: any) => void;
  addSet: (exId: string, templateSet?: ActiveSet) => void;
  removeSet: (exId: string, setId: string) => void;
  markSetDone: (exId: string, setId: string, done: boolean) => void;
  updateExerciseNotes: (exId: string, notes: string) => void;
  endWorkout: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useFitnessStore = create<FitnessState>((set) => ({
  isWorkoutActive: false,
  activeWorkoutName: '',
  activeWorkoutStartTime: null,
  activeExercises: [],
  
  startWorkout: (name) => set({ 
    isWorkoutActive: true, 
    activeWorkoutName: name, 
    activeWorkoutStartTime: Date.now(), 
    activeExercises: [] 
  }),
  
  addExercise: (exercise) => set((state) => ({
    activeExercises: [...state.activeExercises, {
      id: generateId(),
      name: exercise.name,
      muscle_group_primary: exercise.muscle_group_primary,
      notes: '',
      sets: [{ id: generateId(), set_number: 1, weight: 0, reps: 0, done: false }]
    }]
  })),

  addSet: (exId, templateSet) => set((state) => ({
    activeExercises: state.activeExercises.map(ex => {
      if (ex.id !== exId) return ex;
      const num = ex.sets.length + 1;
      return {
        ...ex,
        sets: [...ex.sets, { 
          id: generateId(), 
          set_number: num, 
          weight: templateSet ? templateSet.weight : 0, 
          reps: templateSet ? templateSet.reps : 0, 
          done: false 
        }]
      };
    })
  })),

  removeSet: (exId, setId) => set((state) => ({
    activeExercises: state.activeExercises.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
    })
  })),

  updateSet: (exId, setId, field, value) => set((state) => ({
    activeExercises: state.activeExercises.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
      };
    })
  })),

  markSetDone: (exId, setId, done) => set((state) => ({
    activeExercises: state.activeExercises.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, done } : s)
      };
    })
  })),
  
  updateExerciseNotes: (exId, notes) => set((state) => ({
    activeExercises: state.activeExercises.map(ex => ex.id === exId ? {...ex, notes} : ex)
  })),

  endWorkout: () => set({
    isWorkoutActive: false,
    activeWorkoutName: '',
    activeWorkoutStartTime: null,
    activeExercises: []
  })
}));
