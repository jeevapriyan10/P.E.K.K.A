// filepath: app/progress/body-fat-calculator.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { getDb } from '../../src/lib/database';
import { analyzeBodyFat } from '../../src/services/geminiService';

export default function BodyFatCalculatorScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'navy' | 'ai'>('navy');
  const [profile, setProfile] = useState<any>(null);

  // Navy Method States
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [navyResult, setNavyResult] = useState<any>(null);

  // AI Method States
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResult, setAIResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const db = await getDb();
      const user: any = await db.getFirstAsync('SELECT * FROM users ORDER BY id DESC LIMIT 1');
      setProfile(user);
    };
    fetchProfile();
  }, []);

  const calculateNavyResult = () => {
    if (!profile) return Alert.alert("Error", "User profile not found");
    if (!neck || !waist || (profile.sex === 'female' && !hip)) {
      return Alert.alert("Error", "Please fill all measurements");
    }

    const n = parseFloat(neck);
    const w = parseFloat(waist);
    const h = parseFloat(hip || '0');
    const height = profile.height_cm;

    let bf = 0;
    // Math.log10(x) = Math.log(x) / Math.log(10)
    const log10 = (x: number) => Math.log(x) / Math.log(10);

    if (profile.sex === 'male') {
      bf = 495 / (1.0324 - 0.19077 * log10(w - n) + 0.15456 * log10(height)) - 450;
    } else {
      bf = 495 / (1.29579 - 0.35004 * log10(w + h - n) + 0.22100 * log10(height)) - 450;
    }

    const category = getBFCategory(bf, profile.sex);
    const weight = profile.weight_kg;
    const fatMass = weight * (bf / 100);
    const leanMass = weight - fatMass;

    setNavyResult({
      bf: bf.toFixed(1),
      category,
      fatMass: fatMass.toFixed(1),
      leanMass: leanMass.toFixed(1)
    });
  };

  const getBFCategory = (bf: number, sex: string) => {
    if (sex === 'male') {
      if (bf < 6) return 'Essential Fat';
      if (bf < 14) return 'Athletes';
      if (bf < 18) return 'Fitness';
      if (bf < 25) return 'Average';
      return 'Obese';
    } else {
      if (bf < 14) return 'Essential Fat';
      if (bf < 21) return 'Athletes';
      if (bf < 25) return 'Fitness';
      if (bf < 32) return 'Average';
      return 'Obese';
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].uri);
      setLoadingAI(true);
      try {
        const res = await analyzeBodyFat(result.assets[0].uri);
        setAIResult(res);
      } catch (e) {
        Alert.alert("Error", "AI analysis failed");
      } finally {
        setLoadingAI(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backBtn}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>Body Fat %</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'navy' && styles.tabActive]} onPress={() => setTab('navy')}>
          <Text style={[styles.tabText, tab === 'navy' && styles.tabTextActive]}>Navy Method</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'ai' && styles.tabActive]} onPress={() => setTab('ai')}>
          <Text style={[styles.tabText, tab === 'ai' && styles.tabTextActive]}>AI Estimate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'navy' ? (
          <View style={styles.navySection}>
            <Text style={styles.sectionDesc}>The U.S. Navy Method uses body circumference measurements to estimate body fat.</Text>
            
            <View style={styles.unitToggle}>
                <TouchableOpacity onPress={() => setUnit('cm')} style={[styles.unitBtn, unit === 'cm' && styles.unitBtnActive]}><Text style={[styles.unitBtnTxt, unit === 'cm' && styles.unitBtnTxtActive]}>Metric (cm)</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setUnit('in')} style={[styles.unitBtn, unit === 'in' && styles.unitBtnActive]}><Text style={[styles.unitBtnTxt, unit === 'in' && styles.unitBtnTxtActive]}>Imperial (in)</Text></TouchableOpacity>
            </View>

            <View style={styles.inputCard}>
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Neck Circumference</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="0.0" placeholderTextColor={Colors.dark.muted} value={neck} onChangeText={setNeck} />
               </View>
               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Waist Circumference</Text>
                  <TextInput style={styles.input} keyboardType="numeric" placeholder="0.0" placeholderTextColor={Colors.dark.muted} value={waist} onChangeText={setWaist} />
               </View>
               {profile?.sex === 'female' && (
                 <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hip Circumference</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="0.0" placeholderTextColor={Colors.dark.muted} value={hip} onChangeText={setHip} />
                 </View>
               )}
               <TouchableOpacity style={styles.calcBtn} onPress={calculateNavyResult}>
                  <Text style={styles.calcBtnTxt}>Calculate</Text>
               </TouchableOpacity>
            </View>

            {navyResult && (
              <View style={styles.resultCard}>
                 <Text style={styles.resVal}>{navyResult.bf}%</Text>
                 <Text style={styles.resCat}>{navyResult.category}</Text>
                 <View style={styles.resGrid}>
                    <View style={styles.resItem}><Text style={styles.resLabel}>Lean Mass</Text><Text style={styles.resSubVal}>{navyResult.leanMass}kg</Text></View>
                    <View style={styles.resItem}><Text style={styles.resLabel}>Fat Mass</Text><Text style={styles.resSubVal}>{navyResult.fatMass}kg</Text></View>
                 </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.aiSection}>
            <Text style={styles.sectionDesc}>Upload a mirror selfie to get an AI-powered body fat estimation and category breakdown.</Text>
            
            {selectedImage ? (
               <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            ) : (
               <View style={styles.placeholderBox}>
                  <Text style={{ fontSize: 40 }}>👤</Text>
               </View>
            )}

            {loadingAI ? (
               <View style={styles.aiLoading}>
                  <ActivityIndicator color={Colors.dark.lime} size="large" />
                  <Text style={styles.loadingText}>AI Analysis in progress...</Text>
               </View>
            ) : aiResult ? (
               <View style={styles.resultCard}>
                  <Text style={styles.resVal}>{aiResult.minPct}% - {aiResult.maxPct}%</Text>
                  <Text style={styles.resCat}>{aiResult.category}</Text>
                  <Text style={styles.aiNotes}>{aiResult.notes}</Text>
                  <Text style={styles.disclaimer}>* AI estimates are for reference only. For accurate measurements, use professional scanners.</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={pickImage}>
                     <Text style={styles.retryBtnTxt}>Try Another Photo</Text>
                  </TouchableOpacity>
               </View>
            ) : (
               <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadBtnTxt}>Upload Photo</Text>
               </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  backBtn: { color: Colors.dark.dim, fontSize: 16 },
  title: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', padding: 16, gap: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.dark.bg2, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border },
  tabActive: { backgroundColor: Colors.dark.lime, borderColor: Colors.dark.lime },
  tabText: { color: Colors.dark.muted, fontWeight: 'bold' },
  tabTextActive: { color: Colors.dark.bg },
  scroll: { padding: 16 },
  sectionDesc: { color: Colors.dark.muted, fontSize: 14, lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  navySection: {},
  unitToggle: { flexDirection: 'row', backgroundColor: Colors.dark.bg2, borderRadius: 10, padding: 4, marginBottom: 24, alignSelf: 'center' },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  unitBtnActive: { backgroundColor: Colors.dark.bg3 },
  unitBtnTxt: { color: Colors.dark.muted, fontSize: 12, fontWeight: 'bold' },
  unitBtnTxtActive: { color: Colors.dark.lime },
  inputCard: { backgroundColor: Colors.dark.bg2, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  inputGroup: { marginBottom: 16 },
  label: { color: Colors.dark.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: Colors.dark.bg, color: Colors.dark.text, padding: 14, borderRadius: 12 },
  calcBtn: { backgroundColor: Colors.dark.lime, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  calcBtnTxt: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 },
  resultCard: { marginTop: 24, backgroundColor: Colors.dark.bg2, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.lime },
  resVal: { color: Colors.dark.text, fontSize: 40, fontWeight: '900' },
  resCat: { color: Colors.dark.lime, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  resGrid: { flexDirection: 'row', marginTop: 24, gap: 20 },
  resItem: { alignItems: 'center' },
  resLabel: { color: Colors.dark.muted, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  resSubVal: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  aiSection: { alignItems: 'center' },
  placeholderBox: { width: 150, height: 150, borderRadius: 75, backgroundColor: Colors.dark.bg2, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  previewImage: { width: 200, height: 260, borderRadius: 16, marginBottom: 24 },
  uploadBtn: { backgroundColor: Colors.dark.sky, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  uploadBtnTxt: { color: Colors.dark.bg, fontWeight: 'bold', fontSize: 16 },
  aiLoading: { alignItems: 'center', padding: 20 },
  loadingText: { color: Colors.dark.muted, marginTop: 12 },
  aiNotes: { color: Colors.dark.muted, fontSize: 13, marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
  disclaimer: { color: Colors.dark.rose, fontSize: 10, marginTop: 24, textAlign: 'center', opacity: 0.8 },
  retryBtn: { marginTop: 24, padding: 12 },
  retryBtnTxt: { color: Colors.dark.sky, fontWeight: 'bold' },
});
