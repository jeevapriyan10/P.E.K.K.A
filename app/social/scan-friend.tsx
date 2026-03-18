// filepath: app/social/scan-friend.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb, ProfileExport } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';
import { Avatar } from '../../src/components/ui/Avatar';

export default function ScanFriend() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [friendData, setFriendData] = useState<ProfileExport | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    try {
      const decoded = atob_custom(result.data);
      const profile: ProfileExport = JSON.parse(decoded);
      
      // Basic validation
      if (profile.version !== '1.0' || !profile.username) {
        throw new Error('Invalid P.E.K.K.A QR code version or format.');
      }
      
      setFriendData(profile);
    } catch (e) {
      Alert.alert("Invalid QR", "This QR code is not a valid P.E.K.K.A profile.", [{ text: "Try Again", onPress: () => setScanned(false) }]);
    }
  };

  const confirmFriend = async () => {
    if (!friendData) return;
    try {
      await socialDb.upsertFriendProfile(friendData);
      Alert.alert("Success", `@${friendData.username} has been added to your local social hub!`, [
        { text: "View Friends", onPress: () => router.replace('/(tabs)/social') }
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not save friend profile.");
    }
  };

  // Base64 decoder helper
  const atob_custom = (input: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = String(input).replace(/[=]+$/, '');
    if (str.length % 4 === 1) throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    let output = '';
    let bc = 0, bs = 0, buffer, i = 0;
    while (buffer = str.charAt(i++)) {
      buffer = chars.indexOf(buffer);
      if (~buffer) {
        bs = bc % 4 ? bs * 64 + buffer : buffer;
        if (bc++ % 4) {
          output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }
    return output;
  };

  if (!permission) return <View style={styles.darkBg} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="camera-off" size={60} color="#333" />
        <Text style={styles.msgText}>Grant camera access to scan physical profiles.</Text>
        <TouchableOpacity style={styles.pBtn} onPress={requestPermission}>
          <Text style={styles.pBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Physical Profile</Text>
            <View style={{ width: 28 }} />
          </View>
          
          <View style={styles.maskContainer}>
            <View style={styles.maskFrame} />
          </View>

          <Text style={styles.guideText}>Center the friend's QR to scan</Text>
        </View>
      </CameraView>

      <Modal visible={!!friendData} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <Avatar source={friendData?.avatar_path || ''} size={100} borderColor={Colors.dark.lime} />
                <View style={{ height: 16 }} />
                <Text style={styles.friendName}>{friendData?.display_name}</Text>
                <Text style={styles.friendUsername}>@{friendData?.username}</Text>
               
               <View style={styles.statsPreview}>
                 <StatRow icon="arm-flex" label="Workouts" value={friendData?.stats.total_workouts.toString() || '0'} unit="" />
                 <StatRow 
                   icon="fire" 
                   label="Cals Avg" 
                   value={friendData?.stats.week_calories_avg === -1 ? <MaterialCommunityIcons name="lock" size={14} color="#666" /> : (friendData?.stats.week_calories_avg.toString() || '0')} 
                   unit="" 
                 />
                 <StatRow icon="lightning-bolt" label="Streak" value={friendData?.stats.current_streak.toString() || '0'} unit="d" />
               </View>

               <TouchableOpacity style={styles.addBtn} onPress={confirmFriend}>
                  <Text style={styles.addBtnText}>Connect Locally</Text>
               </TouchableOpacity>

               <TouchableOpacity style={styles.cancelBtn} onPress={() => { setFriendData(null); setScanned(false); }}>
                  <Text style={styles.cancelBtnText}>Discard</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const StatRow = ({ icon, label, value, unit }: any) => (
  <View style={styles.statBox}>
     <MaterialCommunityIcons name={icon} size={18} color={Colors.dark.lime} />
     <Text style={styles.statValue}>{value}{unit}</Text>
     <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  maskContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  maskFrame: { width: 250, height: 250, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: Colors.dark.lime },
  guideText: { color: '#DDD', fontSize: 14, textAlign: 'center', marginBottom: 60, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#111', borderRadius: 32, padding: 30, alignItems: 'center' },
  avatarBig: { fontSize: 80, marginBottom: 12 },
  friendName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  friendUsername: { fontSize: 16, color: Colors.dark.muted, marginBottom: 24 },
  statsPreview: { flexDirection: 'row', gap: 12, marginBottom: 30, width: '100%' },
  statBox: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#666', textTransform: 'uppercase' },
  addBtn: { backgroundColor: Colors.dark.lime, width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { width: '100%', padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#555', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 40 },
  msgText: { color: '#777', fontSize: 16, textAlign: 'center', marginTop: 12, marginBottom: 24 },
  pBtn: { backgroundColor: '#111', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  pBtnText: { color: Colors.dark.lime, fontWeight: 'bold' },
  darkBg: { flex: 1, backgroundColor: '#000' }
});
