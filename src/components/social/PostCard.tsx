// filepath: src/components/social/PostCard.tsx
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Share, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Avatar } from '../ui/Avatar';
import { socialDb } from '../../db/socialDb';

interface PostCardProps {
  post: any;
  onReport?: (postId: number) => void;
}

export const PostCard: React.FC<PostCardProps & { onRefresh?: () => void }> = ({ post, onReport, onRefresh }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked === 1);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isSaved, setIsSaved] = useState(false); // Will check if post is saved on load (optional optimization)

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikes((prev: number) => nextState ? prev + 1 : prev - 1);
    await socialDb.toggleLike(post.id);
  };

  const loadComments = async () => {
    const data = await socialDb.getComments(post.id);
    setComments(data);
    setCommentsCount(data.length);
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await socialDb.addComment(post.id, commentText);
      setCommentText('');
      loadComments();
    } catch (e) {
      Alert.alert("Error", "Failed to add comment.");
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await socialDb.deletePost(post.id);
        onRefresh?.();
      }}
    ]);
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

  const handleSave = async () => {
    if (isSaved) {
      await socialDb.unsavePost(post.id);
      setIsSaved(false);
    } else {
      await socialDb.savePost(post.id);
      setIsSaved(true);
    }
    onRefresh?.();
  };

  const handleMore = async () => {
    const me: any = await socialDb.getMyProfileSettings();
    const isMe = me?.username === post.author_username;

    Alert.alert(
      "Options",
      "What would you like to do?",
      [
        { text: "Report / Hide", style: "destructive", onPress: () => onReport?.(post.id) },
        ...(isMe ? [{ text: "Delete Post", style: "destructive" as any, onPress: handleDelete }] : []),
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return past.toLocaleDateString();
  };

  const getCategoryColor = () => {
    if (post.category === 'workout') return Colors.dark.lime;
    if (post.category === 'nutrition') return Colors.dark.cyan;
    return Colors.dark.muted;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.authorRow}>
        <Avatar source={post.avatar_path} size={36} />
        <View style={styles.authorInfo}>
          <Text style={styles.displayName}>{post.author_username}</Text>
          <Text style={styles.username}>{getTimeAgo(post.created_at)}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={handleMore}>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Media or Placeholder */}
      <View style={styles.mediaContainer}>
        {post.media_path ? (
          <Image source={{ uri: post.media_path }} style={styles.media} resizeMode="cover" />
        ) : (
          <View style={styles.textOnlyMedia}>
             <MaterialCommunityIcons name="format-quote-open" size={40} color="#222" />
          </View>
        )}
        {post.category && (
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() + '20', borderColor: getCategoryColor() }]}>
             <Text style={[styles.categoryText, { color: getCategoryColor() }]}>{post.category.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <MaterialCommunityIcons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={26} 
              color={isLiked ? "#FF3B30" : "#FFF"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleComments}>
            <MaterialCommunityIcons name="chat-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <MaterialCommunityIcons name="send-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
          <MaterialCommunityIcons name={isSaved ? "bookmark" : "bookmark-outline"} size={26} color={isSaved ? Colors.dark.amber : "#FFF"} />
        </TouchableOpacity>
      </View>

      {/* Caption Content */}
      <View style={styles.captionRow}>
        <Text style={styles.likesText}>{likes.toLocaleString()} likes</Text>
        {post.text_content ? (
          <Text style={styles.captionText}>
            <Text style={styles.captionUser}>{post.author_username}</Text> {post.text_content}
          </Text>
        ) : null}
      </View>

      {/* Attachments */}
      {post.workout_ref_id && (
        <View style={styles.attachmentCard}>
          <View style={styles.attachmentIcon}>
            <MaterialCommunityIcons name="arm-flex" size={22} color={Colors.dark.lime} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.attachmentTitle}>{post.workout_name || 'Workout Session'}</Text>
            <Text style={styles.attachmentSub}>
              {post.duration_minutes} min • {Math.floor(post.total_volume || 0)}kg volume
            </Text>
          </View>
        </View>
      )}

      {post.nutrition_summary && (
        <View style={[styles.attachmentCard, { borderColor: Colors.dark.cyan + '30' }]}>
          <View style={[styles.attachmentIcon, { backgroundColor: Colors.dark.cyan + '15' }]}>
            <MaterialCommunityIcons name="food-apple" size={22} color={Colors.dark.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.attachmentTitle}>Daily Nutrition</Text>
            <Text style={styles.attachmentSub}>{post.nutrition_summary}</Text>
          </View>
        </View>
      )}

      {/* Comments Section */}
      {commentsCount > 0 && !showComments && (
        <TouchableOpacity onPress={toggleComments} style={{ paddingHorizontal: 12 }}>
          <Text style={styles.viewComments}>View all {commentsCount} comments</Text>
        </TouchableOpacity>
      )}

      {showComments && (
        <View style={styles.commentsList}>
          {comments.map((c, i) => (
            <View key={c.id || i} style={styles.commentItem}>
               <Text style={styles.commentUser}>{c.username} <Text style={styles.commentText}>{c.text}</Text></Text>
            </View>
          ))}
          <View style={styles.commentInputRow}>
            <Avatar source={post.my_avatar_path} size={28} />
            <TextInput 
              style={styles.commentInput} 
              placeholder="Add a comment..." 
              placeholderTextColor="#555"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleAddComment}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#000', marginBottom: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  authorInfo: { flex: 1, marginLeft: 10 },
  displayName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  username: { color: '#888', fontSize: 11, marginTop: 1 },
  moreBtn: { padding: 4 },
  mediaContainer: { position: 'relative', backgroundColor: '#0A0A0A' },
  media: { width: '100%', aspectRatio: 1, backgroundColor: '#111' },
  textOnlyMedia: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  categoryBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  actionGroup: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  actionBtn: { padding: 2 },
  captionRow: { paddingHorizontal: 12, gap: 4, marginBottom: 8 },
  likesText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  captionText: { color: '#FFF', fontSize: 14, lineHeight: 18 },
  captionUser: { fontWeight: '700' },
  attachmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', margin: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#1A1A1A' },
  attachmentIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.dark.lime + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  attachmentTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  attachmentSub: { color: '#888', fontSize: 12, marginTop: 2 },
  viewComments: { color: '#555', fontSize: 13, marginTop: 4 },
  commentsList: { paddingHorizontal: 12, marginTop: 10, gap: 8 },
  commentItem: { flexDirection: 'row' },
  commentUser: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  commentText: { fontWeight: '400', color: '#EEE' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 12, borderTopWidth: 0.5, borderColor: '#111', paddingTop: 12 },
  commentInput: { flex: 1, color: '#FFF', fontSize: 14, height: 36 }
});
