// filepath: src/components/ui/Avatar.tsx
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface AvatarProps {
  source: string; // Icon name OR URI
  size?: number;
  color?: string;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 40, color = Colors.dark.lime, borderColor }) => {
  const isUri = source.startsWith('http') || source.startsWith('file') || source.startsWith('content') || source.includes('/');
  
  if (isUri) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: borderColor || 'transparent', borderWidth: borderColor ? 2 : 0 }]}>
        <Image source={{ uri: source }} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '20', borderColor: borderColor || 'transparent', borderWidth: borderColor ? 2 : 0 }]}>
       <MaterialCommunityIcons name={source as any || 'account'} size={size * 0.6} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#111'
  }
});
