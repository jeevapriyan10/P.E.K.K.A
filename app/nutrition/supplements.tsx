import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';
import { useNutritionStore } from '../../src/store/nutritionStore';

export default function SupplementsScreen() {
  const router = useRouter();
  const currentDate = useNutritionStore(s => s.currentDate);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTime, setNewTime] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadSupplements = async () => {
    try {
      const db = await getDb();
      const logs: any[] = await db.getAllAsync('SELECT * FROM supplements_log WHERE date = ? ORDER BY time_taken ASC', [currentDate]);
      setSupplements(logs);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(useCallback(() => { loadSupplements(); }, [currentDate]));

  const saveSupplement = async () => {
    if (!newName.trim()) return Alert.alert("Error", "Please enter a supplement name");
    try {
      const db = await getDb();
      if (editingId) {
        await db.runAsync(
          'UPDATE supplements_log SET name = ?, dosage = ?, time_taken = ? WHERE id = ?',
          [newName, newDosage, newTime, editingId]
        );
      } else {
        await db.runAsync(
          'INSERT INTO supplements_log (date, name, dosage, time_taken, taken, logged_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [currentDate, newName, newDosage, newTime, 0]
        );
      }
      closeModal();
      loadSupplements();
    } catch (e) {
      Alert.alert("Error", "Failed to save supplement");
    }
  };

  const toggleTaken = async (id: number, currentStatus: number) => {
    try {
      const db = await getDb();
      await db.runAsync('UPDATE supplements_log SET taken = ? WHERE id = ?', [currentStatus ? 0 : 1, id]);
      loadSupplements();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSupplement = async (id: number) => {
    try {
      const db = await getDb();
      await db.runAsync('DELETE FROM supplements_log WHERE id = ?', [id]);
      loadSupplements();
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (sup?: any) => {
    if (sup) {
      setEditingId(sup.id);
      setNewName(sup.name);
      setNewDosage(sup.dosage);
      setNewTime(sup.time_taken);
    } else {
      setEditingId(null);
      setNewName('');
      setNewDosage('');
      setNewTime('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setNewName('');
    setNewDosage('');
    setNewTime('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" /></TouchableOpacity>
        <Text style={styles.title}>Supplements</Text>
        <View style={{width: 28}} />
      </View>

      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      <FlatList
        data={supplements}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No supplements logged for this date.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, item.taken && styles.cardTaken]}>
            <TouchableOpacity style={styles.checkBtn} onPress={() => toggleTaken(item.id, item.taken)}>
               <MaterialCommunityIcons name={item.taken ? "check-circle" : "circle-outline"} size={28} color={item.taken ? Colors.dark.lime : Colors.dark.muted} />
            </TouchableOpacity>
            
            <View style={styles.info}>
              <Text style={[styles.name, item.taken && styles.textTaken]}>{item.name}</Text>
              <Text style={styles.details}>
                {item.dosage ? `${item.dosage} • ` : ''}{item.time_taken || 'Anytime'}
              </Text>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
               <MaterialCommunityIcons name="pencil" size={20} color={Colors.dark.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => deleteSupplement(item.id)}>
               <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.dark.rose} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <MaterialCommunityIcons name="plus" size={30} color={Colors.dark.bg} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Supplement' : 'Add Supplement'}</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Name (e.g. Whey Protein, Creatine)" 
                placeholderTextColor={Colors.dark.muted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={styles.row}>
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder="Dosage (e.g. 5g, 1 pill)" 
                  placeholderTextColor={Colors.dark.muted}
                  value={newDosage}
                  onChangeText={setNewDosage}
                />
                <View style={{width: 12}} />
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder="Time (e.g. Morning)" 
                  placeholderTextColor={Colors.dark.muted}
                  value={newTime}
                  onChangeText={setNewTime}
                />
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={closeModal} style={styles.btnCancel}><Text style={styles.btnTxt}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={saveSupplement} style={styles.btnSave}><Text style={[styles.btnTxt, { color: Colors.dark.bg }]}>Save</Text></TouchableOpacity>
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
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  dateHeader: { paddingHorizontal: 20, paddingBottom: 16, alignItems: 'center' },
  dateText: { color: Colors.dark.muted, fontSize: 14, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.bg2, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cardTaken: { opacity: 0.7, borderColor: Colors.dark.bg3 },
  checkBtn: { marginRight: 16 },
  info: { flex: 1 },
  name: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  textTaken: { textDecorationLine: 'line-through', color: Colors.dark.muted },
  details: { color: Colors.dark.muted, fontSize: 12, marginTop: 4 },
  actionBtn: { padding: 8, marginLeft: 4 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 40 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.dark.lime, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.dark.bg2, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { color: Colors.dark.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: Colors.dark.bg, color: Colors.dark.text, padding: 16, borderRadius: 12, marginBottom: 16 },
  row: { flexDirection: 'row' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: Colors.dark.bg3, borderRadius: 12 },
  btnSave: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: Colors.dark.lime, borderRadius: 12 },
  btnTxt: { color: Colors.dark.text, fontWeight: 'bold' },
});
