// filepath: src/components/Confetti.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const NUM_CONFETTI = 40;
const COLORS = ['#A3E635', '#22D3EE', '#FACC15', '#F472B6', '#FB923C'];

const ConfettiPiece = ({ index }: { index: number }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(Math.random() * width);
  const rotate = useSharedValue(Math.random() * 360);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      Math.random() * 1000,
      withTiming(height + 20, { 
        duration: 2500 + Math.random() * 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      })
    );
    rotate.value = withTiming(rotate.value + 720, { duration: 3000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` }
      ],
      opacity: interpolate(translateY.value, [height - 100, height], [1, 0])
    };
  });

  return (
    <Animated.View 
      style={[
        styles.piece, 
        { backgroundColor: COLORS[index % COLORS.length] }, 
        animatedStyle
      ]} 
    />
  );
};

export const Confetti = ({ active }: { active: boolean }) => {
  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(NUM_CONFETTI)].map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 2,
  }
});
