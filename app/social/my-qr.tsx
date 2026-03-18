// filepath: app/social/my-qr.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { QRCode } from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { socialDb, ProfileExport } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

export default function MyQRCode() {
  const router = useRouter();
  const [payload, setPayload] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const qrRef = useRef<any>(null);

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    const data = await socialDb.generateExportPayload();
    if (!data) {
      Alert.alert("Profile Required", "Set up your profile before sharing.");
      router.replace('/social/profile-setup');
      return;
    }

    // Simple base64 encoding (btoa is not in RN, so we use a robust method or just JSON for simplicity)
    // Here we encode it as a Base64 string to keep it compact and slightly obfuscated
    const json = JSON.stringify(data);
    const base64 = btoa_custom(json);
    setPayload(base64);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(qrRef, { format: 'png', quality: 1.0 });
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Error", "Could not share QR code.");
    }
  };

  // Basic Base64 implementation for RN
  const btoa_custom = (input: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input;
    let output = '';
    for (
      let block = 0, charCode, i = 0, map = chars;
      str.charAt(i | 0) || (map = '=', i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4));
      if (charCode > 0xff) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = (block << 8) | charCode;
    }
    return output;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile QR</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.qrCard}>
          <View ref={qrRef} style={styles.qrWrapper}>
            {payload ? (
              <QRCode 
                value={payload} 
                size={230} 
                color="#FFF" 
                backgroundColor="#000" 
                logo={require('../../assets/icon.png')}
                logoSize={50}
                logoBackgroundColor="transparent"
              />
            ) : (
              <View style={{ height: 230, justifyContent: 'center' }}><Text style={{ color: '#555' }}>Generating...</Text></View>
            )}
          </View>

          <Text style={styles.username}>Scan to connect</Text>
          <View style={styles.syncBox}>
             <MaterialCommunityIcons name="clock-outline" size={14} color="#777" />
             <Text style={styles.syncText}>Last updated: {lastUpdated}</Text>
          </View>
        </View>

        <View style={styles.actions}>
           <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.dark.lime }]} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#000" />
              <Text style={styles.btnText}>Share as Image</Text>
           </TouchableOpacity>

           <TouchableOpacity style={[styles.btn, { backgroundColor: '#1A1A1A' }]} onPress={generateQR}>
              <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
              <Text style={[styles.btnText, { color: '#FFF' }]}>Refresh Stats</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
           <Text style={styles.infoTitle}>Privacy Disclaimer</Text>
           <Text style={styles.infoText}>
              This QR code contains a snapshot of your local data. Only the stats you selected for sharing are included in the payload. Profile data is stored ONLY on your respective devices.
           </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  scroll: { padding: 20, alignItems: 'center' },
  qrCard: { backgroundColor: '#111', borderRadius: 32, padding: 32, alignItems: 'center', width: '100%', marginBottom: 30 },
  qrWrapper: { padding: 20, backgroundColor: '#000', borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  username: { fontSize: 18, color: '#FFF', fontWeight: 'bold', marginTop: 24 },
  syncBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  syncText: { color: '#777', fontSize: 13 },
  actions: { width: '100%', gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 10 },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  infoCard: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, marginTop: 40, width: '100%' },
  infoTitle: { color: Colors.dark.lime, fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  infoText: { color: '#AAA', fontSize: 13, lineHeight: 20 }
});
