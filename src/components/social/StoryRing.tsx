// filepath: src/components/social/StoryRing.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Colors } from '../../constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StoryRingProps {
  uri: string | null;
  size?: number;
  isSeen?: boolean;
  isMe?: boolean;
  onPress?: () => void;
}

export const StoryRing: React.FC<StoryRingProps> = ({
  uri,
  size = 64,
  isSeen = false,
  isMe = false,
  onPress
}) => {
  const ringSize = size + 6; // ring border width adds to size
  const ringColor = isSeen ? Colors.dark.muted : Colors.dark.lime;
  const avatarSize = size;

  return (
    <View style={[styles.container, { width: ringSize, height: ringSize }]} onTouchEnd={onPress}>
      <View style={[styles.ring, { borderColor: ringColor, width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
        <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
          <Avatar source={uri} size={avatarSize} />
        </View>
      </View>
      {isMe && (
        <View style={styles.addBadge}>
          <MaterialCommunityIcons name="plus" size={14} color="#FFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  ring: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.dark.bg3
  },
  addBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.bg
  }
});

export default StoryRing;
