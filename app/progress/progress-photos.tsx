// filepath: app/progress/progress-photos.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';

// @ts-ignore
const PHOTO_DIR = FileSystem.documentDirectory + 'progress_photos/';

export default function ProgressPhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);

  const ensureDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    }
  };

  const loadPhotos = async () => {
    await ensureDir();
    const db = await getDb();
    const rows: any[] = await db.getAllAsync('SELECT * FROM progress_photos ORDER BY date DESC');
    setPhotos(rows);
  };

  useFocusEffect(useCallback(() => { loadPhotos(); }, []));

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const uri = result.assets[0].uri;
        const filename = `${Date.now()}.jpg`;
        const dest = PHOTO_DIR + filename;
        
        await FileSystem.copyAsync({ from: uri, to: dest });
        
        const db = await getDb();
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch current weight to attach
        const user: any = await db.getFirstAsync('SELECT weight_kg FROM users ORDER BY id DESC LIMIT 1');
        const weight = user?.weight_kg || 0;

        await db.runAsync(
          'INSERT INTO progress_photos (date, photo_path, weight_kg, created_at) VALUES (?, ?, ?, datetime("now"))',
          [today, filename, weight]
        );
        
        loadPhotos();
      } catch (e) {
        Alert.alert("Error", "Failed to save photo");
      }
    }
  };

  const deletePhoto = async (id: number, filename: string) => {
     Alert.alert("Delete", "Are you sure?", [
       { text: "Cancel" },
       { text: "Delete", style: 'destructive', onPress: async () => {
           const db = await getDb();
           await db.runAsync('DELETE FROM progress_photos WHERE id = ?', [id]);
           try {
   // @ts-ignore
           await FileSystem.deleteAsync(PHOTO_DIR + filename, { idempotent: true });
           } catch(e){}
           setSelectedPhoto(null);
           loadPhotos();
       }}
     ]);
  };

  const toggleCompare = (id: number) => {
    if (compareSelection.includes(id)) {
      setCompareSelection(compareSelection.filter(i => i !== id));
    } else {
      if (compareSelection.length < 2) {
        setCompareSelection([...compareSelection, id]);
      }
    }
  };

  const renderPhotoItem = ({ item }: { item: any }) => {
    const isSelected = compareSelection.includes(item.id);
    return (
      <TouchableOpacity 
        style={[styles.photoCard, isSelected && styles.photoCardSelected]} 
        onPress={() => compareMode ? toggleCompare(item.id) : setSelectedPhoto(item)}
      >
        <Image source={{ uri: PHOTO_DIR + item.photo_path }} style={styles.photo} />
        <View style={styles.photoInfo}>
           <Text style={styles.photoDate}>{item.date}</Text>
           <Text style={styles.photoWeight}>{item.weight_kg}kg</Text>
        </View>
        {compareMode && (
          <View style={[styles.selectDot, isSelected && styles.selectDotActive]}>
             {isSelected && <Text style={{color: '#000', fontSize: 10, fontWeight: 'bold'}}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const leftPhoto = photos.find(p => p.id === compareSelection[0]);
  const rightPhoto = photos.find(p => p.id === compareSelection[1]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>Progress Photos</Text>
        <TouchableOpacity onPress={() => {setCompareMode(!compareMode); setCompareSelection([]);}}>
           <Text style={[styles.compareBtn, compareMode && {color: Colors.dark.lime}]}>{compareMode ? 'Cancel' : 'Compare'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={photos}
        renderItem={renderPhotoItem}
        numColumns={2}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.empty}>No photos yet. Start your journey!</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={addPhoto}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      {/* Full Screen Viewer */}
      <Modal visible={!!selectedPhoto} animationType="fade" transparent>
         <View style={styles.viewerOverlay}>
            <TouchableOpacity style={styles.closeViewer} onPress={() => setSelectedPhoto(null)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            {selectedPhoto && (
               <View style={styles.viewerContent}>
                  <Image source={{ uri: PHOTO_DIR + selectedPhoto.photo_path }} style={styles.fullPhoto} resizeMode="contain" />
                  <View style={styles.viewerFooter}>
                     <Text style={styles.vDate}>{selectedPhoto.date}</Text>
                     <Text style={styles.vWeight}>{selectedPhoto.weight_kg}kg</Text>
                     <TouchableOpacity style={styles.vDelete} onPress={() => deletePhoto(selectedPhoto.id, selectedPhoto.photo_path)}>
                        <Text style={{color: Colors.dark.rose}}>Delete Photo</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            )}
         </View>
      </Modal>

      {/* Compare View */}
      {compareMode && compareSelection.length === 2 && (
        <Modal visible animationType="slide">
           <SafeAreaView style={styles.compareWrapper}>
              <View style={styles.compareHeader}>
                 <TouchableOpacity onPress={() => setCompareSelection([])}><Text style={styles.closeTxt}>Back</Text></TouchableOpacity>
                 <Text style={styles.title}>Comparison</Text>
                 <View style={{width: 40}} />
              </View>
              <View style={styles.compareGrid}>
                 <View style={styles.compCol}>
                    <Text style={styles.compLabel}>PAST</Text>
                    <Image source={{ uri: PHOTO_DIR + leftPhoto?.photo_path }} style={styles.compImage} />
                    <Text style={styles.compMeta}>{leftPhoto?.date}</Text>
                    <Text style={styles.compWeight}>{leftPhoto?.weight_kg}kg</Text>
                 </View>
                 <View style={styles.compCol}>
                    <Text style={styles.compLabel}>LATEST</Text>
                    <Image source={{ uri: PHOTO_DIR + rightPhoto?.photo_path }} style={styles.compImage} />
                    <Text style={styles.compMeta}>{rightPhoto?.date}</Text>
                    <Text style={styles.compWeight}>{rightPhoto?.weight_kg}kg</Text>
                 </View>
              </View>
              <Text style={styles.diffText}>
                 Difference: {( (rightPhoto?.weight_kg || 0) - (leftPhoto?.weight_kg || 0) ).toFixed(1)}kg
              </Text>
           </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  compareBtn: { color: Colors.dark.sky, fontWeight: 'bold' },
  grid: { padding: 8 },
  photoCard: { flex: 1, margin: 8, backgroundColor: Colors.dark.bg2, borderRadius: 12, overflow: 'hidden' },
  photoCardSelected: { borderWidth: 2, borderColor: Colors.dark.lime },
  photo: { width: '100%', height: 200 },
  photoInfo: { padding: 8 },
  photoDate: { color: Colors.dark.text, fontSize: 11, fontWeight: 'bold' },
  photoWeight: { color: Colors.dark.muted, fontSize: 10, marginTop: 2 },
  empty: { color: Colors.dark.muted, textAlign: 'center', marginTop: 100 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.dark.sky, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabTxt: { fontSize: 30, color: Colors.dark.bg, fontWeight: 'bold' },
  selectDot: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: '#fff' },
  selectDotActive: { backgroundColor: Colors.dark.lime, borderColor: Colors.dark.lime, justifyContent: 'center', alignItems: 'center' },
  viewerOverlay: { flex: 1, backgroundColor: '#000' },
  closeViewer: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  closeTxt: { color: '#fff', fontSize: 24 },
  viewerContent: { flex: 1, justifyContent: 'center' },
  fullPhoto: { width: '100%', height: '70%' },
  viewerFooter: { padding: 30, alignItems: 'center' },
  vDate: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  vWeight: { color: Colors.dark.lime, fontSize: 16, marginTop: 4 },
  vDelete: { marginTop: 40 },
  compareWrapper: { flex: 1, backgroundColor: Colors.dark.bg },
  compareHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', borderBottomWidth: 1, borderColor: Colors.dark.border },
  compareGrid: { flexDirection: 'row', flex: 1, padding: 16, gap: 12 },
  compCol: { flex: 1, alignItems: 'center' },
  compLabel: { color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold', marginBottom: 12 },
  compImage: { width: '100%', height: '70%', borderRadius: 12 },
  compMeta: { color: Colors.dark.text, fontSize: 14, fontWeight: 'bold', marginTop: 12 },
  compWeight: { color: Colors.dark.sky, fontSize: 16, marginTop: 4 },
  diffText: { textAlign: 'center', color: Colors.dark.lime, fontSize: 18, fontWeight: 'bold', padding: 20, backgroundColor: Colors.dark.bg2 }
});
