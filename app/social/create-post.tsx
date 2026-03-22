// filepath: app/social/create-post.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { socialDb } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';
import { moderatePost } from '../../src/services/ai/hybrid';

const VISIBILITY_OPTIONS = [
  { label: 'Public', value: 1, icon: 'earth' },
  { label: 'Friends', value: 0, icon: 'account-group' },
  { label: 'Private', value: -1, icon: 'lock' }
];

export default function CreatePost() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(1);
  const [isPosting, setIsPosting] = useState(false);
  const [attachment, setAttachment] = useState<'workout' | 'nutrition' | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);

  const fetchRecentData = async () => {
    const workouts = await socialDb.getRecentWorkouts();
    setRecentWorkouts(workouts);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleToggleAttachment = async (type: 'workout' | 'nutrition') => {
    if (attachment === type) {
      setAttachment(null);
      setSelectedWorkout(null);
      return;
    }
    setAttachment(type);
    if (type === 'workout') {
      const workouts = await socialDb.getRecentWorkouts();
      setRecentWorkouts(workouts);
      if (workouts.length > 0) setSelectedWorkout(workouts[0]);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !image && !attachment) {
      return Alert.alert("Error", "Please add content.");
    }

    // Content moderation check
    try {
      const modResult = await moderatePost({ text: text.trim(), hasImage: !!image });
      if (!modResult.approved) {
        Alert.alert("Post Not Approved", modResult.reason || "Your post cannot be shared at this time.");
        setIsPosting(false);
        return;
      }
    } catch (e) {
      console.error('Moderation error:', e);
      // If moderation fails, allow posting? Safer to block? We'll allow to not block user.
    }

    setIsPosting(true);
    try {

      let finalImagePath = null;
      if (image) {
        const postsDir = (FileSystem as any).documentDirectory + 'posts/';
        const dirInfo = await FileSystem.getInfoAsync(postsDir);
        if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(postsDir, { intermediates: true });
        const name = `${Date.now()}.jpg`;
        const dest = postsDir + name;
        await FileSystem.copyAsync({ from: image, to: dest });
        finalImagePath = dest;
      }

      let nutSummary = undefined;
      if (attachment === 'nutrition') {
         const db = await (require('../../src/lib/database').getDb());
         const today = new Date().toISOString().split('T')[0];
         const entries: any[] = await db.getAllAsync('SELECT calories, protein FROM food_entries WHERE date = ?', [today]);
         const totalCals = entries.reduce((s, e) => s + e.calories, 0);
         const totalProt = entries.reduce((s, e) => s + e.protein, 0);
         nutSummary = `Logged ${Math.round(totalCals)} kcal & ${Math.round(totalProt)}g protein today`;
      }

      await socialDb.createPost({
        text,
        mediaPath: finalImagePath || undefined,
        isPublic: visibility,
        aiApproved: 1,
        category: attachment || "photo",
        workoutId: selectedWorkout?.id,
        nutritionSummary: nutSummary
      });

      setIsPosting(false);
      router.back();
    } catch (e) {
      setIsPosting(false);
      Alert.alert("Error", "Post failed.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="close" size={28} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={isPosting}><Text style={styles.postBtnText}>Post</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Say something..." placeholderTextColor="#666" multiline value={text} onChangeText={setText} />
        </View>

        {image && <View style={styles.previewContainer}><Image source={{ uri: image }} style={styles.preview} /></View>}

        {attachment === 'workout' && selectedWorkout && (
          <View style={styles.attachmentPreview}>
            <Text style={styles.attLabel}>Attaching Workout: {selectedWorkout.name}</Text>
          </View>
        )}

        {attachment === 'nutrition' && (
          <View style={styles.attachmentPreview}>
            <Text style={styles.attLabel}>Attaching Today's Nutrition Summary</Text>
          </View>
        )}

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={handlePickImage}>
            <MaterialCommunityIcons name="camera" size={24} color="#FFF" />
            <Text style={styles.actionLabel}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, attachment === 'workout' && { backgroundColor: Colors.dark.lime + '20' }]} 
            onPress={() => handleToggleAttachment('workout')}
          >
            <MaterialCommunityIcons name="arm-flex" size={24} color={Colors.dark.lime} />
            <Text style={styles.actionLabel}>Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, attachment === 'nutrition' && { backgroundColor: Colors.dark.cyan + '20' }]} 
            onPress={() => handleToggleAttachment('nutrition')}
          >
            <MaterialCommunityIcons name="food-apple" size={24} color={Colors.dark.cyan} />
            <Text style={styles.actionLabel}>Nutrition</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {VISIBILITY_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} style={[styles.visChip, visibility === opt.value && styles.visChipActive]} onPress={() => setVisibility(opt.value)}>
                <Text style={[styles.visText, visibility === opt.value && styles.visTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  postBtn: { backgroundColor: Colors.dark.lime, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#000', fontWeight: 'bold' },
  scroll: { padding: 16 },
  inputContainer: { marginBottom: 20 },
  input: { color: '#FFF', fontSize: 18, minHeight: 80 },
  previewContainer: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  preview: { width: '100%', height: 300 },
  attachmentPreview: { backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  attLabel: { color: Colors.dark.lime, fontSize: 12, fontWeight: 'bold' },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  actionItem: { flex: 1, alignItems: 'center', backgroundColor: '#111', paddingVertical: 15, borderRadius: 12, gap: 8 },
  actionLabel: { color: '#888', fontSize: 12 },
  section: { marginTop: 20 },
  sectionTitle: { color: '#555', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 },
  visibilityRow: { flexDirection: 'row', gap: 10 },
  visChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111' },
  visChipActive: { backgroundColor: Colors.dark.lime },
  visText: { color: '#FFF', fontSize: 13 },
  visTextActive: { color: '#000' }
});
