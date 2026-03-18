// filepath: src/components/progress/WeightChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors } from '../../constants/colors';

interface WeightDataPoint {
  value: number;
  label: string;
  date: string;
}

interface Props {
  data: WeightDataPoint[];
  goalWeight: number;
  compact?: boolean;
}

export default function WeightChart({ data, goalWeight, compact = false }: Props) {
  if (data.length < 2) {
    return (
      <View style={[styles.emptyContainer, compact && styles.compactEmpty]}>
        <Text style={styles.emptyText}>Log at least 2 weights to see trend</Text>
      </View>
    );
  }

  const points = data.slice(-30).map(p => ({
    value: p.value,
    label: p.label,
    dataPointText: compact ? undefined : `${p.value}`,
    dataPointColor: Colors.dark.cyan,
  }));
  
  const values = points.map(p => p.value);
  const minVal = Math.floor(Math.min(...values, goalWeight) - 5);
  const maxVal = Math.ceil(Math.max(...values, goalWeight) + 5);

  const computeTrendLine = () => {
    const n = points.length;
    if (n < 2) return null;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    points.forEach((p, i) => {
      sumX += i;
      sumY += p.value;
      sumXY += i * p.value;
      sumX2 += i * i;
    });
    const denominator = (n * sumX2 - sumX * sumX);
    if (denominator === 0) return null;
    const m = (n * sumXY - sumX * sumY) / denominator;
    const b = (sumY - m * sumX) / n;
    
    return points.map((_, i) => ({
      value: m * i + b,
      hideDataPoint: true,
    }));
  };

  const trendLineData = computeTrendLine();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <LineChart
        areaChart
        curved
        data={points}
        data2={trendLineData || undefined}
        hideDataPoints={compact}
        spacing={compact ? 30 : 50}
        initialSpacing={10}
        color={Colors.dark.cyan}
        thickness={3}
        startFillColor={Colors.dark.cyan}
        endFillColor={Colors.dark.cyan}
        startOpacity={0.3}
        endOpacity={0.05}
        color2={Colors.dark.muted}
        thickness2={1}
        yAxisColor="transparent"
        xAxisColor="transparent"
        yAxisTextStyle={styles.axisText}
        yAxisOffset={minVal}
        maxValue={maxVal}
        noOfSections={4}
        height={compact ? 100 : 180}
        pointerConfig={{
          pointerStripColor: Colors.dark.cyan,
          pointerStripWidth: 2,
          pointerColor: Colors.dark.cyan,
          radius: 4,
          pointerLabelComponent: (items: any) => (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>{items[0].value} kg</Text>
            </View>
          ),
        }}
        showReferenceLine1
        referenceLine1Position={goalWeight}
        referenceLine1Config={{
          color: Colors.dark.rose,
          dashWidth: 2,
          dashGap: 4,
          thickness: 1,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.dark.bg2, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.dark.border },
  compactContainer: { padding: 4, backgroundColor: 'transparent', borderWidth: 0 },
  emptyContainer: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.bg2, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.dark.border },
  compactEmpty: { height: 80, borderWidth: 0, backgroundColor: 'transparent' },
  emptyText: { color: Colors.dark.muted, fontSize: 13 },
  axisText: { color: Colors.dark.muted, fontSize: 10 },
  tooltip: { backgroundColor: Colors.dark.bg3, padding: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.border },
  tooltipText: { color: Colors.dark.text, fontWeight: 'bold', fontSize: 12 },
});
