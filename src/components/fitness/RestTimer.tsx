// filepath: src/components/fitness/RestTimer.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../../constants/colors';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface Props {
  visible: boolean;
  durationSeconds: number;
  onDismiss: () => void;
}

export default function RestTimer({ visible, durationSeconds, onDismiss }: Props) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setTimeLeft(durationSeconds);
      scale.value = withSpring(1);
    }
  }, [visible, durationSeconds]);

  useEffect(() => {
    let intv: any;
    if (visible && timeLeft > 0) {
      intv = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (visible && timeLeft === 0) {
      triggerAlarm();
      clearInterval(intv);
    }
    return () => clearInterval(intv);
  }, [visible, timeLeft]);

  const triggerAlarm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSpring(1.2, {}, () => { scale.value = withSpring(1); });
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../../assets/sounds/beep.mp3'));
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 2000);
    } catch (e) {
      // Audio fallback or ignore if missing
    }
  };

  const adj = (secs: number) => setTimeLeft(t => Math.max(0, t + secs));

  const msString = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Rest Timer</Text>
          
          <Animated.Text style={[styles.time, animStyle, timeLeft === 0 && {color: Colors.dark.lime}]}>
            {msString}
          </Animated.Text>

          {timeLeft === 0 && <Text style={styles.timeUp}>Time's up! Back to work!</Text>}

          <View style={styles.controls}>
            <TouchableOpacity onPress={() => adj(-15)} style={styles.btnSmall}><Text style={styles.btnSmallTxt}>-15s</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => adj(15)} style={styles.btnSmall}><Text style={styles.btnSmallTxt}>+15s</Text></TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onDismiss} style={styles.btnDismiss}>
            <Text style={styles.btnDismissTxt}>{timeLeft === 0 ? 'Start Next Set' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.dark.bg2, padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center' },
  title: { color: Colors.dark.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  time: { color: Colors.dark.text, fontSize: 80, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timeUp: { color: Colors.dark.lime, fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  controls: { flexDirection: 'row', gap: 16, marginVertical: 30 },
  btnSmall: { backgroundColor: Colors.dark.bg3, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 },
  btnSmallTxt: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  btnDismiss: { backgroundColor: Colors.dark.lime, width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' },
  btnDismissTxt: { color: Colors.dark.bg, fontSize: 18, fontWeight: 'bold' }
});
