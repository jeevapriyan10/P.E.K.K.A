// filepath: src/components/ui/RingProgress.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProgressProps {
  value: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  sublabel: string;
}

export default function RingProgress({
  value,
  size = 80,
  strokeWidth = 8,
  color,
  label,
  sublabel,
}: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(Math.min(value, 1), {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - circumference * animatedValue.value;
    return {
      strokeDashoffset,
    };
  });

  const percentage = Math.round(Math.min(value, 1) * 100);

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.dark.border3} // background track
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.centerText]}>
        <Text style={[styles.percentage, { color: Colors.dark.text }]}>{percentage}%</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centerText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  labelContainer: {
    position: 'absolute',
    bottom: -35,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 10,
    color: Colors.dark.muted,
  },
});
