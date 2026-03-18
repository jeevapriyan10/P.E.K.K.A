// filepath: app/social/groups/join-group.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../../src/db/socialDb';
import { Colors } from '../../../src/constants/colors';

export default function JoinGroup() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [groupData, setGroupData] = useState<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    try {
      const parsed = JSON.parse(data);
      if (parsed.version === '1.0' && parsed.group_id) {
        setScanned(true);
        setGroupData(parsed);
      }
    } catch (e) {
      // Not a group QR
    }
  };

  const handleJoin = async () => {
    try {
      await socialDb.joinGroup({
        group_id: groupData.group_id,
        name: groupData.name,
        description: groupData.description,
        icon: groupData.icon,
        creator: groupData.creator_username,
        goalType: groupData.goal_type,
        goalTarget: groupData.goal_target,
        period: groupData.goal_period
      });
      router.replace({ pathname: '/social/groups/group-detail', params: { id: groupData.group_id } } as any);
    } catch (e) {
      Alert.alert("Error", "Failed to join group.");
      setScanned(false);
      setGroupData(null);
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera access required to join groups.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}><Text style={styles.btnText}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <SafeAreaView style={styles.overlay}>
           <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                 <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Scan Group QR</Text>
              <View style={{ width: 28 }} />
           </View>

           <View style={styles.scanContainer}>
              <View style={styles.scannerFrame} />
              <Text style={styles.guideText}>Point camera at group invite QR</Text>
           </View>
        </SafeAreaView>
      </CameraView>

      <Modal visible={!!groupData} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
               <View style={styles.groupIconBox}>
                  <Text style={styles.groupIcon}>{groupData?.icon}</Text>
               </View>
               <Text style={styles.groupName}>{groupData?.name}</Text>
               <Text style={styles.groupCreator}>By @{groupData?.creator_username}</Text>
               
               <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>Shared Goal</Text>
                  <Text style={styles.goalText}>{groupData?.goal_target.toLocaleString()} {groupData?.goal_type}</Text>
                  <Text style={styles.goalPeriod}>{groupData?.goal_period} limit</Text>
               </View>

               <Text style={styles.description}>{groupData?.description}</Text>

               <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setScanned(false); setGroupData(null); }}>
                     <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
                     <Text style={styles.joinText}>Join Group</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </View>
  );
}

// Re-importing Safe because of Camera component nesting
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 250, height: 250, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.dark.lime, borderRadius: 24, marginBottom: 30 },
  guideText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#111', borderRadius: 32, padding: 30, alignItems: 'center' },
  groupIconBox: { width: 80, height: 80, borderRadius: 32, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  groupIcon: { fontSize: 40 },
  groupName: { color: '#FFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  groupCreator: { color: '#555', fontSize: 13, marginTop: 4, marginBottom: 24 },
  goalInfo: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 24, width: '100%', alignItems: 'center', marginBottom: 24 },
  goalTitle: { color: '#555', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  goalText: { color: Colors.dark.lime, fontSize: 24, fontWeight: 'bold' },
  goalPeriod: { color: '#333', fontSize: 12, textTransform: 'uppercase', marginTop: 4 },
  description: { color: '#777', textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 30 },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, height: 56, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#777', fontWeight: 'bold' },
  joinBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: Colors.dark.lime, alignItems: 'center', justifyContent: 'center' },
  joinText: { color: '#000', fontWeight: 'bold' },
  errorText: { color: '#E53935', marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: Colors.dark.lime, padding: 15, borderRadius: 12 },
  btnText: { color: '#000', fontWeight: 'bold' }
});
