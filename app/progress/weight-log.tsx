// filepath: app/progress/weight-log.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';
import WeightChart from '../../src/components/progress/WeightChart';

export default function WeightLogScreen() {
  const router = useRouter();
  const [weights, setWeights] = useState<any[]>([]);
  const [goalWeight, setGoalWeight] = useState(70);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');

  const loadData = async () => {
    try {
      const db = await getDb();
      const logs: any[] = await db.getAllAsync('SELECT * FROM weight_logs ORDER BY date DESC');
      setWeights(logs);

      const user: any = await db.getFirstAsync('SELECT weight_kg, goal FROM users ORDER BY id DESC LIMIT 1');
      if (user) {
         // This is a simplified goal weight extraction
         // In a real app we might have a goal_weight field
         setGoalWeight(user.weight_kg); 
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleSave = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w)) return Alert.alert("Error", "Please enter a valid weight");

    try {
      const db = await getDb();
      const today = new Date().toISOString().split('T')[0];
      
      // Check if entry for today exists
      const exists: any = await db.getFirstAsync('SELECT id FROM weight_logs WHERE date = ?', [today]);
      if (exists) {
        await db.runAsync('UPDATE weight_logs SET weight_kg = ?, note = ?, logged_at = datetime("now") WHERE id = ?', [w, newNote, exists.id]);
      } else {
        await db.runAsync('INSERT INTO weight_logs (date, weight_kg, note, logged_at) VALUES (?, ?, ?, datetime("now"))', [today, w, newNote]);
      }

      setModalVisible(false);
      setNewWeight('');
      setNewNote('');
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to save weight");
    }
  };

  const getDelta = (item: any, index: number) => {
    if (index === weights.length - 1) return null;
    const prev = weights[index + 1].weight_kg;
    const diff = item.weight_kg - prev;
    return diff;
  };

  const weeklyAvg = weights.slice(0, 7).reduce((acc, curr) => acc + curr.weight_kg, 0) / Math.min(weights.length, 7);

  // Linear Regression & Goal Projection
  const getGoalProjection = () => {
    if (weights.length < 2) return "Need more data";
    
    // Use up to last 30 entries for trend
    const sorted = [...weights].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30);
    
    // y = mx + b
    const n = sorted.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    sorted.forEach((w, i) => {
      sumX += i;
      sumY += w.weight_kg;
      sumXY += i * w.weight_kg;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (Math.abs(slope) < 0.001) return "Trend is flat";
    
    // Check if moving towards goal
    const currentWeight = sorted[sorted.length - 1].weight_kg;
    if (currentWeight === goalWeight) return "Goal reached!";
    if ((slope > 0 && goalWeight < currentWeight) || (slope < 0 && goalWeight > currentWeight)) {
        return "Moving away from goal";
    }

    // Days to reach goal
    const daysToGoal = (goalWeight - currentWeight) / slope;
    if (daysToGoal > 365) return "Over a year";
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Math.ceil(daysToGoal));
    
    return targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const chartData = [...weights].reverse().map(w => ({
    value: w.weight_kg,
    label: w.date.split('-').slice(1).join('/'),
    date: w.date
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>Weight Log</Text>
        <View style={{width: 40}} />
      </View>

      <FlatList
        data={weights}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.avgCard}>
              <Text style={styles.avgLabel}>7-Day Average</Text>
              <Text style={styles.avgVal}>{weights.length > 0 ? weeklyAvg.toFixed(1) : '--'} <Text style={styles.unit}>kg</Text></Text>
            </View>

            <View style={styles.chartSection}>
               <WeightChart data={chartData} goalWeight={goalWeight} />
            </View>

            <View style={styles.projectionCard}>
               <View>
                 <Text style={styles.projTitle}>Goal Projection</Text>
                 <Text style={styles.projSub}>Target: {goalWeight} kg</Text>
               </View>
               <View style={styles.projRight}>
                 <Text style={styles.projVal}>{getGoalProjection()}</Text>
                 <Text style={styles.projEst}>Estimated Date</Text>
               </View>
            </View>
            
            <Text style={styles.historyTitle}>History</Text>
          </View>
        }
        keyExtractor={item => item.id.toString()}
        renderItem={({ item, index }) => {
          const delta = getDelta(item, index);
          return (
            <View style={styles.row}>
              <View>
                <Text style={styles.rowDate}>{item.date}</Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowWeight}>{item.weight_kg.toFixed(1)} kg</Text>
                {delta !== null && (
                  <Text style={[styles.delta, { color: delta > 0 ? Colors.dark.rose : Colors.dark.lime }]}>
                    {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Weight</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0.0 kg" 
                placeholderTextColor={Colors.dark.muted}
                keyboardType="numeric"
                value={newWeight}
                onChangeText={setNewWeight}
                autoFocus
              />
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                placeholder="Note (optional)" 
                placeholderTextColor={Colors.dark.muted}
                multiline
                value={newNote}
                onChangeText={setNewNote}
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancel}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.btnSave}><Text style={[styles.btnTxt, { color: Colors.dark.bg }]}>Save</Text></TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16, paddingBottom: 100 },
  listHeader: { gap: 24, marginBottom: 24 },
  avgCard: { backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  avgLabel: { color: Colors.dark.muted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  avgVal: { color: Colors.dark.text, fontSize: 32, fontWeight: 'bold' },
  unit: { fontSize: 16, color: Colors.dark.muted },
  chartSection: {},
  projectionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dark.limebg, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.lime },
  projTitle: { color: Colors.dark.lime, fontSize: 14, fontWeight: 'bold' },
  projSub: { color: Colors.dark.text, fontSize: 12, marginTop: 4 },
  projRight: { alignItems: 'flex-end' },
  projVal: { color: Colors.dark.lime, fontSize: 16, fontWeight: '900' },
  projEst: { color: Colors.dark.text, fontSize: 10, textTransform: 'uppercase', marginTop: 4 },
  historyTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: Colors.dark.border2 },
  rowDate: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  rowNote: { color: Colors.dark.muted, fontSize: 12, marginTop: 4 },
  rowRight: { alignItems: 'flex-end' },
  rowWeight: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  delta: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.dark.lime, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabTxt: { fontSize: 30, color: Colors.dark.bg, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.dark.bg2, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: Colors.dark.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: Colors.dark.bg, color: Colors.dark.text, padding: 16, borderRadius: 12, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: Colors.dark.bg3, borderRadius: 12 },
  btnSave: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: Colors.dark.lime, borderRadius: 12 },
  btnTxt: { color: Colors.dark.text, fontWeight: 'bold' },
});
