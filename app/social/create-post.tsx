// filepath: app/social/create-post.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { contentModerationService } from '../../src/services/contentModerationService';
import { socialDb } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

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

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !image) {
      return Alert.alert("Error", "Please add some text or a photo.");
    }

    setIsPosting(true);
    try {
      // 1. AI Moderation
      const moderation = await contentModerationService.moderatePost({
        text,
        hasImage: !!image
      });

      if (!moderation.approved) {
        setIsPosting(false);
        return Alert.alert("Post Rejected", moderation.reason);
      }

      // 2. Process Image (Copy to permanent storage)
      let finalImagePath = null;
      if (image) {
        const postsDir = (FileSystem as any).documentDirectory + 'posts/';
        const dirInfo = await FileSystem.getInfoAsync(postsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(postsDir, { intermediates: true });
        }
        const filename = `${Date.now()}.jpg`;
        const destPath = postsDir + filename;
        await FileSystem.copyAsync({ from: image, to: destPath });
        finalImagePath = destPath;
      }

      // 3. Save to DB
      await socialDb.createPost({
        text,
        mediaPath: finalImagePath || undefined,
        isPublic: visibility,
        aiApproved: 1,
        category: moderation.category,
        // Mocking workout/nutrition IDs for now as picker wasn't built yet
        workoutId: attachment === 'workout' ? 123 : undefined,
        nutritionSummary: attachment === 'nutrition' ? "Logged 1,800 kcal today" : undefined
      });

      setIsPosting(false);
      Alert.alert("Success", "Posted!", [
        { text: "Dismiss", onPress: () => router.back() }
      ]);

    } catch (e) {
      console.error(e);
      setIsPosting(false);
      Alert.alert("Error", "Failed to create post.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={[styles.postBtn, (!text.trim() && !image) && styles.postBtnDisabled]} 
          onPress={handlePost}
          disabled={isPosting || (!text.trim() && !image)}
        >
          <Text style={styles.postBtnText}>{isPosting ? '...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Share your fitness progress..."
            placeholderTextColor="#555"
            multiline
            maxLength={500}
            value={text}
            onChangeText={setText}
          />
          <Text style={[styles.counter, text.length >= 500 && { color: '#E57373' }]}>
            {text.length}/500
          </Text>
        </View>

        {image && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity style={styles.removeImg} onPress={() => setImage(null)}>
              <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Visibility Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {VISIBILITY_OPTIONS.map(opt => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.visChip, visibility === opt.value && styles.visChipActive]}
                onPress={() => setVisibility(opt.value)}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={16} color={visibility === opt.value ? '#000' : '#FFF'} />
                <Text style={[styles.visText, visibility === opt.value && styles.visTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Attachments */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={handlePickImage}>
            <MaterialCommunityIcons name="image-plus" size={24} color={Colors.dark.lime} />
            <Text style={styles.actionLabel}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, attachment === 'workout' && styles.actionItemActive]} 
            onPress={() => setAttachment(attachment === 'workout' ? null : 'workout')}
          >
            <MaterialCommunityIcons name="arm-flex" size={24} color={Colors.dark.cyan} />
            <Text style={styles.actionLabel}>Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, attachment === 'nutrition' && styles.actionItemActive]} 
            onPress={() => setAttachment(attachment === 'nutrition' ? null : 'nutrition')}
          >
            <MaterialCommunityIcons name="food-apple" size={24} color={Colors.dark.amber} />
            <Text style={styles.actionLabel}>Nutrition</Text>
          </TouchableOpacity>
        </View>

        {isPosting && (
          <View style={styles.postingOverlay}>
            <ActivityIndicator color={Colors.dark.lime} size="large" />
            <Text style={styles.postingText}>Checking content...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  postBtn: { backgroundColor: Colors.dark.lime, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#000', fontWeight: 'bold' },
  scroll: { padding: 20 },
  inputContainer: { marginBottom: 20 },
  input: { color: '#FFF', fontSize: 18, minHeight: 120, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', color: '#555', fontSize: 12, marginTop: 8 },
  previewContainer: { marginBottom: 30, borderRadius: 16, overflow: 'hidden' },
  preview: { width: '100%', height: 300 },
  removeImg: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#555', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  visibilityRow: { flexDirection: 'row', gap: 10 },
  visChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  visChipActive: { backgroundColor: Colors.dark.lime, borderColor: Colors.dark.lime },
  visText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  visTextActive: { color: '#000' },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionItem: { flex: 1, alignItems: 'center', backgroundColor: '#111', paddingVertical: 15, borderRadius: 16, gap: 8 },
  actionItemActive: { borderColor: Colors.dark.lime, borderWidth: 1 },
  actionLabel: { color: '#CCC', fontSize: 12, fontWeight: 'bold' },
  postingOverlay: { marginVertical: 30, alignItems: 'center' },
  postingText: { color: Colors.dark.lime, fontWeight: 'bold', marginTop: 12 }
});
