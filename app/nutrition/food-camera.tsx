// filepath: app/nutrition/food-camera.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { analyzeFoodImage } from '../../src/services/geminiService';

export default function FoodCameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) return <View style={styles.center}><ActivityIndicator color={Colors.dark.lime}/></View>;
  if (!permission.granted) return <View style={styles.center}><Text style={{color: 'white'}}>No camera access</Text></View>;

  const takePic = async () => {
    if (cameraRef.current && !loading) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        const results = await analyzeFoodImage(photo.uri);
        
        router.replace({
           pathname: '/nutrition/food-recognition-result',
           params: { results: JSON.stringify(results) }
        });
      } catch (e: any) {
        alert("Failed to analyze image: " + e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>✕</Text></TouchableOpacity>
        </View>

        <View style={styles.bottom}>
          {loading ? (
             <View style={styles.loadingBox}>
                <ActivityIndicator color={Colors.dark.lime} size="large" />
                <Text style={styles.loadingTxt}>Analyzing Food...</Text>
             </View>
          ) : (
             <TouchableOpacity style={styles.captureBtn} onPress={takePic}>
               <View style={styles.captureInner} />
             </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.bg },
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  overlay: { flex: 1, justifyContent: 'space-between' },
  top: { padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backTxt: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  bottom: { padding: 40, alignItems: 'center' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.dark.lime },
  loadingBox: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 16, alignItems: 'center' },
  loadingTxt: { color: Colors.dark.lime, marginTop: 12, fontWeight: 'bold' }
});
