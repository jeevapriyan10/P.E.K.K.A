// filepath: app/fitness/active-workout.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useFitnessStore } from '../../src/store/fitnessStore';
import { getPersonalRecords, saveWorkoutSession, updatePersonalRecord, searchExercises } from '../../src/db/fitnessDb';
import { checkAchievements } from '../../src/utils/checkAchievements';
import { useAchievements } from '../../src/providers/AchievementProvider';
import { getDb } from '../../src/lib/database';
import RestTimer from '../../src/components/fitness/RestTimer';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { activeWorkoutName, activeWorkoutStartTime, activeExercises, startWorkout, endWorkout, addSet, updateSet, markSetDone, updateExerciseNotes, addExercise } = useFitnessStore();
  const { showAchievement } = useAchievements();
  useKeepAwake();

  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!activeWorkoutStartTime);
  const [restModal, setRestModal] = useState({ visible: false, seconds: 90 });
  const [completeModal, setCompleteModal] = useState(false);
  const [rpe, setRpe] = useState(7);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const db = await getDb();
      const user = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      setUserProfile(user);
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!activeWorkoutStartTime || isPaused) return;
    const intv = setInterval(() => {
      const ms = Date.now() - activeWorkoutStartTime;
      setTimer(Math.floor(ms / 1000));
    }, 1000);
    return () => clearInterval(intv);
  }, [activeWorkoutStartTime, isPaused]);

  // Template handling
  const applyTemplate = async (type: string) => {
    let name = "Custom Workout";
    let exercises: any[] = [];
    
    if (type === 'chest') {
      name = "Chest & Shoulders";
      exercises = await searchExercises('Chest');
      exercises = exercises.slice(0, 3).concat((await searchExercises('Shoulders')).slice(0, 2));
    } else if (type === 'legs') {
      name = "Leg Day";
      exercises = await searchExercises('Legs');
      exercises = exercises.slice(0, 4);
    } else if (type === 'back') {
      name = "Back & Biceps";
      exercises = await searchExercises('Back');
      exercises = exercises.slice(0, 3).concat((await searchExercises('Arms')).slice(0, 2));
    }

    Alert.alert("Start Workout", `Start ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Start Timer", onPress: () => {
        startWorkout(name);
        exercises.forEach(ex => addExercise(ex));
        setShowTemplates(false);
      }}
    ]);
  };

  const handleFinish = async () => {
    // Calorie Calculation: MET * weight * time(hr)
    // resistance training MET is usually 3.5 to 6. Adjust based on RPE.
    const weight = userProfile?.weight_kg || 75;
    const timeHr = timer / 3600;
    const intensityFactor = 3.5 + (rpe / 10) * 3.5; // Scale MET 3.5 to 7.0
    const caloriesBurned = Math.round(intensityFactor * weight * timeHr);

    let vol = 0;
    activeExercises.forEach(ex => {
      ex.sets.forEach(s => { if (s.done) vol += (s.weight * s.reps); });
    });

    const sessionId = await saveWorkoutSession(
      { 
        name: activeWorkoutName, 
        duration_minutes: Math.round(timer / 60), 
        total_volume: vol, 
        calories_burned: caloriesBurned,
        notes: '', 
        rpe_score: rpe 
      },
      activeExercises.map(ex => ({ ...ex, sets: ex.sets.filter(s => s.done) }))
    );

    checkAchievements(showAchievement);
    endWorkout();
    deactivateKeepAwake();
    setCompleteModal(false);
    router.replace(`/fitness/workout-summary?id=${sessionId}`);
  };

  if (showTemplates) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="close" size={24} color={Colors.dark.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>New Session</Text>
          <View style={{width: 24}} />
        </View>
        <ScrollView contentContainerStyle={styles.templateScroll}>
          <Text style={styles.sectionTitle}>Quick Templates</Text>
          <View style={styles.templateGrid}>
             {[
               {id: 'chest', label: 'Chest/Shoulder', icon: 'account-child'},
               {id: 'legs', label: 'Leg Day', icon: 'run'},
               {id: 'back', label: 'Back/Arms', icon: 'backburger'},
               {id: 'full', label: 'Full Body', icon: 'human'},
               {id: 'custom', label: 'Blank Session', icon: 'plus-circle-outline'}
             ].map(t => (
               <TouchableOpacity key={t.id} style={styles.templateCard} onPress={() => t.id === 'custom' ? (startWorkout('Custom Workout'), setShowTemplates(false)) : applyTemplate(t.id)}>
                 <MaterialCommunityIcons name={t.icon as any} size={32} color={Colors.dark.cyan} />
                 <Text style={styles.templateLabel}>{t.label}</Text>
               </TouchableOpacity>
             ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const msString = `${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.activeLabel}>ACTIVE WORKOUT</Text>
          <Text style={styles.activeName}>{activeWorkoutName}</Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={() => setCompleteModal(true)}>
          <Text style={styles.finishTxt}>Finish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerBar}>
        <MaterialCommunityIcons name="clock-outline" size={18} color={Colors.dark.sky} />
        <Text style={styles.timer}>{msString}</Text>
        <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
          <MaterialCommunityIcons name={isPaused ? "play" : "pause"} size={20} color={Colors.dark.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeExercises.map((ex) => (
          <View key={ex.id} style={styles.workoutCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMuscle}>{ex.muscle_group_primary}</Text>
              </View>
              <TouchableOpacity><MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.dark.muted}/></TouchableOpacity>
            </View>
            
            <View style={styles.rowHeader}>
              <Text style={[styles.rhCell, {width: 40}]}>SET</Text>
              <Text style={styles.rhCell}>KG</Text>
              <Text style={styles.rhCell}>REPS</Text>
              <Text style={[styles.rhCell, {width: 40}]}></Text>
            </View>

            {ex.sets.map((set) => (
              <View key={set.id} style={[styles.setRow, set.done && styles.setRowDone]}>
                <Text style={styles.setNum}>{set.set_number}</Text>
                <TextInput 
                   style={styles.setInp} 
                   keyboardType="numeric" 
                   defaultValue={set.weight ? set.weight.toString() : ""}
                   onEndEditing={(e) => updateSet(ex.id, set.id, 'weight', parseFloat(e.nativeEvent.text) || 0)}
                   editable={!set.done}
                />
                <TextInput 
                   style={styles.setInp} 
                   keyboardType="numeric" 
                   defaultValue={set.reps ? set.reps.toString() : ""}
                   onEndEditing={(e) => updateSet(ex.id, set.id, 'reps', parseFloat(e.nativeEvent.text) || 0)}
                   editable={!set.done}
                />
                <TouchableOpacity style={[styles.chkBtn, set.done && styles.chkBtnDone]} onPress={() => markSetDone(ex.id, set.id, !set.done)}>
                    <MaterialCommunityIcons name={set.done ? "check" : "circle-outline"} size={20} color={set.done ? Colors.dark.bg : Colors.dark.muted} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSet} onPress={() => addSet(ex.id, ex.sets[ex.sets.length-1])}>
              <Text style={styles.addSetTxt}>+ ADD SET</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/fitness/exercise-search')}>
        <MaterialCommunityIcons name="plus" size={24} color={Colors.dark.bg} />
        <Text style={styles.fabTxt}>Add Exercise</Text>
      </TouchableOpacity>

      <RestTimer 
        visible={restModal.visible} 
        durationSeconds={restModal.seconds} 
        onDismiss={() => setRestModal({visible: false, seconds: 0})} 
      />

      <Modal visible={completeModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.contentModal}>
             <Text style={styles.modTitle}>Workout Complete</Text>
             <Text style={styles.modSub}>Rate your effort (RPE)</Text>
             
             <View style={styles.rpeRow}>
               {[1,2,3,4,5,6,7,8,9,10].map(v => (
                 <TouchableOpacity key={v} style={[styles.rpeBox, rpe === v && styles.rpeSelected]} onPress={() => setRpe(v)}>
                   <Text style={[styles.rpeTxt, rpe === v && {color: Colors.dark.bg}]}>{v}</Text>
                 </TouchableOpacity>
               ))}
             </View>

             <View style={styles.modalActions}>
               <TouchableOpacity onPress={() => setCompleteModal(false)} style={styles.cancelLink}><Text style={styles.cancelLinkTxt}>Resume</Text></TouchableOpacity>
               <TouchableOpacity onPress={handleFinish} style={styles.finishFinalBtn}><Text style={styles.finishFinalTxt}>Complete Workout</Text></TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.dark.bg2, borderBottomWidth: 1, borderColor: Colors.dark.border },
  headerTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  activeLabel: { color: Colors.dark.cyan, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  activeName: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  finishBtn: { backgroundColor: Colors.dark.cyan, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  finishTxt: { color: Colors.dark.bg, fontWeight: 'bold' },
  timerBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.dark.bg3 },
  timer: { color: Colors.dark.sky, fontWeight: 'bold', fontSize: 16, flex: 1 },
  templateScroll: { padding: 16, gap: 20 },
  sectionTitle: { color: Colors.dark.text, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard: { width: '47%', backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 20, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  templateLabel: { color: Colors.dark.text, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scroll: { padding: 16, gap: 16, paddingBottom: 120 },
  workoutCard: { backgroundColor: Colors.dark.bg2, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  exName: { color: Colors.dark.text, fontSize: 17, fontWeight: 'bold' },
  exMuscle: { color: Colors.dark.muted, fontSize: 12, marginTop: 2 },
  rowHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 8 },
  rhCell: { flex: 1, color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: Colors.dark.border2 },
  setRowDone: { opacity: 0.5, backgroundColor: 'rgba(50,200,250,0.05)' },
  setNum: { color: Colors.dark.muted, width: 40, textAlign: 'center', fontWeight: 'bold' },
  setInp: { flex: 1, height: 35, color: Colors.dark.text, textAlign: 'center', backgroundColor: Colors.dark.bg3, borderRadius: 8, marginHorizontal: 4 },
  chkBtn: { width: 40, height: 35, borderRadius: 8, backgroundColor: Colors.dark.bg3, alignItems: 'center', justifyContent: 'center' },
  chkBtnDone: { backgroundColor: Colors.dark.cyan },
  addSet: { padding: 12, marginTop: 12, alignItems: 'center' },
  addSetTxt: { color: Colors.dark.cyan, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  fab: { position: 'absolute', bottom: 30, right: 30, left: 30, flexDirection: 'row', backgroundColor: Colors.dark.cyan, padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fabTxt: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  contentModal: { backgroundColor: Colors.dark.bg2, padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modTitle: { color: Colors.dark.text, fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  modSub: { color: Colors.dark.muted, textAlign: 'center', marginTop: 8, marginBottom: 30 },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 },
  rpeBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.dark.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  rpeSelected: { backgroundColor: Colors.dark.cyan, borderColor: Colors.dark.cyan },
  rpeTxt: { color: Colors.dark.text, fontWeight: 'bold', fontSize: 18 },
  modalActions: { gap: 12 },
  finishFinalBtn: { backgroundColor: Colors.dark.cyan, padding: 18, borderRadius: 16, alignItems: 'center' },
  finishFinalTxt: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 },
  cancelLink: { padding: 12, alignItems: 'center' },
  cancelLinkTxt: { color: Colors.dark.muted, fontWeight: '600' }
});
