import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { socialDb } from '../../src/db/socialDb';
import { Colors } from '../../src/constants/colors';

export default function CreateStory() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!image) return;
    setIsPosting(true);
    try {
      const storyDir = (FileSystem as any).documentDirectory + 'stories/';
      const dirInfo = await FileSystem.getInfoAsync(storyDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(storyDir, { intermediates: true });
      }

      const fileName = `story_${Date.now()}.jpg`;
      const finalPath = storyDir + fileName;
      await FileSystem.copyAsync({ from: image, to: finalPath });

      await socialDb.createStory({ mediaPath: finalPath });
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to post story.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>New Story</Text>
        <TouchableOpacity onPress={handlePost} disabled={!image || isPosting}>
          <Text style={[styles.postBtn, (!image || isPosting) && { opacity: 0.5 }]}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <TouchableOpacity style={styles.placeholder} onPress={handlePickImage}>
            <MaterialCommunityIcons name="camera-plus" size={48} color={Colors.dark.muted} />
            <Text style={styles.placeholderText}>Tap to pick a photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {image && (
        <TouchableOpacity style={styles.retake} onPress={handlePickImage}>
          <Text style={styles.retakeText}>Pick different photo</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  postBtn: { color: Colors.dark.cyan, fontSize: 16, fontWeight: 'bold' },
  previewContainer: { flex: 1, margin: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111' },
  preview: { flex: 1, width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 15 },
  placeholderText: { color: Colors.dark.muted, fontSize: 16 },
  retake: { alignSelf: 'center', marginBottom: 40 },
  retakeText: { color: Colors.dark.muted, fontSize: 14, fontWeight: 'bold' }
});
