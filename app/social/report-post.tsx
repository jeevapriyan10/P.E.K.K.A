// filepath: app/social/report-post.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { socialDb } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

const REASONS = [
  'Inappropriate content',
  'Cyberbullying',
  'Dangerous advice',
  'Spam',
  'Off-topic'
];

export default function ReportPost() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    try {
      await socialDb.reportPost(Number(id), selectedReason);
      Alert.alert(
        "Report Submitted",
        "Thank you for your report. We have hidden this post from your feed locally.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert("Error", "Failed to submit report.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Report Post</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>Why are you reporting this post?</Text>
        <Text style={styles.description}>Your report is anonymous. Reporting a post will hide it from your feed immediately.</Text>

        <View style={styles.chipGrid}>
          {REASONS.map(reason => (
            <TouchableOpacity 
              key={reason} 
              style={[styles.chip, selectedReason === reason && styles.activeChip]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={[styles.chipText, selectedReason === reason && styles.activeChipText]}>{reason}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, !selectedReason && styles.disabledBtn]} 
          onPress={handleSubmit}
          disabled={!selectedReason}
        >
          <Text style={styles.submitBtnText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: 20 },
  subtitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  description: { color: '#555', fontSize: 14, lineHeight: 20, marginBottom: 30 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  chip: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#222' },
  activeChip: { backgroundColor: Colors.dark.lime, borderColor: Colors.dark.lime },
  chipText: { color: '#AAA', fontWeight: '500' },
  activeChipText: { color: '#000', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#E57373', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#333', opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
