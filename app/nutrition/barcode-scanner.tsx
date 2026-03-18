// filepath: app/nutrition/barcode-scanner.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { fetchFoodByBarcode } from '../../src/services/openFoodFactsService';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) return <View style={styles.center}><ActivityIndicator color={Colors.dark.lime}/></View>;
  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={{color: Colors.dark.text, marginBottom: 20}}>No camera access</Text>
      <TouchableOpacity onPress={requestPermission} style={styles.btn}><Text style={styles.btnTxt}>Grant Permission</Text></TouchableOpacity>
    </View>
  );

  const handleScan = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    const offResult = await fetchFoodByBarcode(result.data);
    setLoading(false);

    if (offResult) {
       router.replace({
         pathname: '/nutrition/food-detail',
         params: {
            name: offResult.name,
            calories: offResult.calories_per_100g.toString(),
            protein: offResult.protein_per_100g.toString(),
            carbs: offResult.carbs_per_100g.toString(),
            fat: offResult.fat_per_100g.toString(),
            fiber: offResult.fiber_per_100g.toString()
         }
       });
    } else {
       // navigate custom food with barcode prefilled
       router.replace({
         pathname: '/nutrition/custom-food',
         params: { barcode: result.data, name: 'Unknown Product' }
       });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.bg }}>
      <CameraView 
        style={StyleSheet.absoluteFill} 
        barcodeScannerSettings={{ barcodeTypes: ['ean8','ean13','qr','code128','upce'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backCirc}><Text style={styles.backTxt}>✕</Text></TouchableOpacity>
        </View>
        <View style={styles.viewfinder}>
           <View style={styles.frame} />
        </View>
        <View style={styles.footer}>
           {loading ? <ActivityIndicator color={Colors.dark.lime} size="large" /> : <Text style={styles.helperText}>Align barcode within frame</Text>}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.bg },
  btn: { backgroundColor: Colors.dark.lime, padding: 12, borderRadius: 8 },
  btnTxt: { color: Colors.dark.bg, fontWeight: 'bold' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { padding: 20, alignItems: 'flex-start' },
  backCirc: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 250, height: 150, borderWidth: 2, borderColor: Colors.dark.lime, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  footer: { padding: 40, alignItems: 'center' },
  helperText: { color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' }
});
