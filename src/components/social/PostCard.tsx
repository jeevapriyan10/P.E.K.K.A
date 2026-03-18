// filepath: src/components/social/PostCard.tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface PostCardProps {
  post: any;
  onLike?: (postId: number, increment: boolean) => void;
  onReport?: (postId: number) => void;
}

import { Avatar } from '../ui/Avatar';

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onReport }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);

  const handleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikes((prev: number) => nextState ? prev + 1 : prev - 1);
    onLike?.(post.id, nextState);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.text_content}\n\nShared from P.E.K.K.A`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMore = () => {
    Alert.alert(
      "Options",
      "What would you like to do?",
      [
        { text: "Report / Hide", style: "destructive", onPress: () => onReport?.(post.id) },
        { text: "Copy Text", onPress: () => {} }, // Clipboard not requested specifically but good placeholder
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return past.toLocaleDateString();
  };

  return (
    <View style={styles.card}>
      {/* Author Row */}
      <View style={styles.authorRow}>
        <Avatar source={post.avatar_path} size={40} />
        <View style={[styles.authorInfo, { marginLeft: 12 }]}>
          <Text style={styles.displayName}>{post.display_name || post.author_username}</Text>
          <Text style={styles.username}>@{post.author_username} • {getTimeAgo(post.created_at)}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={handleMore}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Category Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.categoryBadge, { backgroundColor: Colors.dark.lime + '20' }]}>
          <Text style={styles.categoryText}>{post.category || 'workout'}</Text>
        </View>
      </View>

      {/* Text Content */}
      <Text style={styles.textContent}>{post.text_content}</Text>

      {/* Media */}
      {post.media_path && (
        <Image 
          source={{ uri: post.media_path }} 
          style={styles.media} 
          resizeMode="cover" 
        />
      )}

      {/* Attachments (Workout/Nutrition) */}
      {post.workout_ref_id && (
        <View style={styles.attachmentCard}>
          <View style={styles.attachmentIcon}>
            <MaterialCommunityIcons name="arm-flex" size={24} color={Colors.dark.lime} />
          </View>
          <View>
            <Text style={styles.attachmentTitle}>{post.workout_name || 'Workout Session'}</Text>
            <Text style={styles.attachmentSub}>
              {post.duration_minutes} min • {Math.floor(post.total_volume || 0)}kg total volume
            </Text>
          </View>
        </View>
      )}

      {post.nutrition_summary && (
        <View style={[styles.attachmentCard, { borderColor: Colors.dark.cyan + '40' }]}>
          <View style={[styles.attachmentIcon, { backgroundColor: Colors.dark.cyan + '20' }]}>
            <MaterialCommunityIcons name="food-apple" size={24} color={Colors.dark.cyan} />
          </View>
          <View>
            <Text style={styles.attachmentTitle}>Nutrition Summary Update</Text>
            <Text style={styles.attachmentSub}>{post.nutrition_summary}</Text>
          </View>
        </View>
      )}

      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <MaterialCommunityIcons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={isLiked ? "#E57373" : "#777"} 
          />
          <Text style={[styles.actionLabel, isLiked && { color: "#E57373" }]}>{likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="comment-outline" size={22} color="#777" />
          <Text style={styles.actionLabel}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <MaterialCommunityIcons name="export-variant" size={22} color="#777" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#111', borderRadius: 24, padding: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { fontSize: 32, marginRight: 12 },
  authorInfo: { flex: 1 },
  displayName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  username: { color: '#555', fontSize: 12, marginTop: 2 },
  moreBtn: { padding: 4 },
  badgeRow: { flexDirection: 'row', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: Colors.dark.lime, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  textContent: { color: '#CCC', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  media: { width: '100%', height: 250, borderRadius: 16, marginBottom: 16 },
  attachmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 12, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.dark.lime + '40' },
  attachmentIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.lime + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  attachmentTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  attachmentSub: { color: '#555', fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1A1A1A' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: { color: '#777', fontSize: 14, fontWeight: '500' }
});
