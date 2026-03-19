// filepath: src/providers/AchievementProvider.tsx
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '../constants/colors';

interface AchievementContextType {
  showAchievement: (name: string, icon: string) => void;
}

const AchievementContext = createContext<AchievementContextType | null>(null);

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({ name: '', icon: '' });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAchievement = (name: string, icon: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setData({ name, icon });
    setVisible(true);

    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 50, duration: 600, useNativeDriver: true }),
    ]).start();

    // Hide after 4 seconds
    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -100, duration: 600, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }, 4000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{data.icon}</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.label}>Achievement Unlocked!</Text>
            <Text style={styles.name}>{data.name}</Text>
          </View>
        </Animated.View>
      )}
    </AchievementContext.Provider>
  );
}

export const useAchievements = () => {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toast: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    right: 20, 
    backgroundColor: Colors.dark.bg2, 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: Colors.dark.lime,
    zIndex: 9999,
    elevation: 10,
    shadowColor: Colors.dark.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.dark.bg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  icon: { fontSize: 30 },
  textBox: { flex: 1 },
  label: { color: Colors.dark.muted, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  name: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
});
