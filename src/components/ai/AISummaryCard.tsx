// filepath: src/components/ai/AISummaryCard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { aiService, DailyData, WeekSummary } from '../../services/aiService';
import { Colors } from '../../constants/colors';

const REFRESH_COOLDOWN = 6 * 60 * 60 * 1000;

export default function AISummaryCard({ todayData, goals }: { todayData: DailyData, goals: { protein: number, calories: number } }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [tip, setTip] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
    fetchData();
  }, [todayData]);

  const animatedShimmer = useAnimatedStyle(() => ({
      opacity: interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.8, 0.3])
  }));

  const fetchData = async (force = false) => {
    if (!force && Date.now() - lastUpdated < REFRESH_COOLDOWN && summary) return;
    
    setLoading(true);
    setError(false);
    try {
      const [sumRes, tipRes] = await Promise.all([
        aiService.getDailySummary(todayData),
        aiService.getTipOfDay()
      ]);
      setSummary(sumRes);
      setTip(tipRes);
      
      // If protein < 80% of goal, suggest high-protein meals
      if (todayData.protein < goals.protein * 0.8) {
          const sRes = await aiService.getMealSuggestions({
              calories: Math.max(0, goals.calories - todayData.calories),
              protein: Math.max(0, goals.protein - todayData.protein),
              carbs: 50, // default
              fat: 20    // default
          });
          setSuggestions(sRes);
      } else {
          setSuggestions([]);
      }

      setLastUpdated(Date.now());
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyReport = async () => {
    // This is typically called once a week or on demand
    try {
      // Mock week summary for example
      const report = await aiService.getWeeklyReport({
          avgCalories: todayData.calories, // simplified for demo
          avgSteps: todayData.steps,
          workoutsCount: todayData.workoutDone ? 1 : 0,
          weightTrend: 'stable'
      });
      setWeeklyReport(report);
    } catch (e) {
      console.warn('Weekly report failed', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.shimmer, animatedShimmer]} />
        <Animated.View style={[styles.shimmerShort, animatedShimmer]} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity 
        style={[styles.container, styles.border]} 
        onPress={() => setIsModalOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.dark.lime} />
            <Text style={styles.headerText}>AI Intelligence Layer</Text>
          </View>
          <TouchableOpacity onPress={() => fetchData(true)}>
            <MaterialCommunityIcons name="refresh" size={16} color={Colors.dark.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.summaryText} numberOfLines={2}>
           {error ? "Connect to internet for AI insights" : summary}
        </Text>
        
        {tip && !error && (
            <View style={styles.tipBox}>
                <MaterialCommunityIcons name="lightbulb-on" size={14} color={Colors.dark.amber} />
                <Text style={styles.tipText}>{tip}</Text>
            </View>
        )}
      </TouchableOpacity>

      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Intelligence Dashboard</Text>
                    <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                        <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.reportScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.reportCard}>
                        <MaterialCommunityIcons name="chat-processing-outline" size={40} color={Colors.dark.lime} />
                        <Text style={styles.reportText}>{summary}</Text>
                    </View>

                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsCard}>
                            <Text style={styles.cardLabel}>Protein Nudge: Meal Suggestions</Text>
                            {suggestions.map((s, i) => (
                                <View key={i} style={styles.suggestionRow}>
                                    <MaterialCommunityIcons name="food-apple" size={16} color={Colors.dark.lime} />
                                    <Text style={styles.suggestionText}>{s}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {!weeklyReport ? (
                      <TouchableOpacity style={styles.weeklyBtn} onPress={loadWeeklyReport}>
                          <MaterialCommunityIcons name="file-chart" size={20} color="#000" />
                          <Text style={styles.weeklyBtnText}>Generate Weekly AI Report</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.weeklyReportCard}>
                          <View style={styles.gradeCircle}>
                              <Text style={styles.gradeText}>{weeklyReport.grade}</Text>
                          </View>
                          <Text style={styles.reportSubtitle}>Weekly Performance Grade</Text>
                          <View style={styles.divider} />
                          <View style={styles.pointsList}>
                             {weeklyReport.tips.map((tip: string, i: number) => (
                               <Text key={i} style={styles.point}>• {tip}</Text>
                             ))}
                          </View>
                      </View>
                    )}

                    <View style={styles.dataGrid}>
                         <DataPoint icon="fire" label="Calories" value={todayData.calories.toString()} unit="kcal" />
                         <DataPoint icon="walk" label="Steps" value={todayData.steps.toString()} />
                         <DataPoint icon="dumbbell" label="Workout" value={todayData.workoutDone ? 'Done' : 'Missed'} />
                         <DataPoint icon="food-apple" label="Protein" value={todayData.protein.toString()} unit="g" />
                    </View>

                    <TouchableOpacity style={styles.closeBtn} onPress={() => setIsModalOpen(false)}>
                        <Text style={styles.closeBtnText}>Great, thanks!</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const DataPoint = ({ icon, label, value, unit }: any) => (
    <View style={styles.dpBox}>
        <MaterialCommunityIcons name={icon} size={20} color={Colors.dark.muted} />
        <Text style={styles.dpValue}>{value}{unit || ''}</Text>
        <Text style={styles.dpLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 20, marginVertical: 10 },
  container: { 
    padding: 16, 
    borderRadius: 20, 
    backgroundColor: '#111', 
    gap: 8,
    minHeight: 100,
    justifyContent: 'center'
  },
  border: { borderColor: Colors.dark.lime, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { color: Colors.dark.muted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  summaryText: { color: '#EEE', fontSize: 15, lineHeight: 22 },
  tipBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, opacity: 0.8 },
  tipText: { color: Colors.dark.amber, fontSize: 12, fontWeight: '500' },
  shimmer: { height: 16, backgroundColor: '#333', borderRadius: 8, width: '90%', marginBottom: 8 },
  shimmerShort: { height: 16, backgroundColor: '#333', borderRadius: 8, width: '60%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { 
     backgroundColor: '#18181B', 
     borderTopLeftRadius: 32, 
     borderTopRightRadius: 32,
     padding: 24,
     maxHeight: '90%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  reportScroll: { gap: 20, paddingBottom: 40 },
  reportCard: { backgroundColor: '#27272A', padding: 24, borderRadius: 24, gap: 16, alignItems: 'center' },
  reportText: { color: '#FFF', fontSize: 18, lineHeight: 28, textAlign: 'center', fontStyle: 'italic' },
  suggestionsCard: { backgroundColor: '#1C1917', padding: 16, borderRadius: 20, gap: 10, borderLeftWidth: 3, borderLeftColor: Colors.dark.lime },
  cardLabel: { color: Colors.dark.muted, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionText: { color: '#FFF', fontSize: 14 },
  weeklyBtn: { backgroundColor: Colors.dark.lime, padding: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  weeklyBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  weeklyReportCard: { backgroundColor: '#27272A', padding: 24, borderRadius: 24, alignItems: 'center' },
  gradeCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gradeText: { color: '#000', fontSize: 32, fontWeight: 'bold' },
  reportSubtitle: { color: Colors.dark.muted, fontSize: 13, fontWeight: '600', marginBottom: 16 },
  divider: { width: '100%', height: 1, backgroundColor: '#3F3F46', marginBottom: 16 },
  pointsList: { alignSelf: 'stretch', gap: 8 },
  point: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dpBox: { flex: 1, minWidth: '45%', backgroundColor: '#27272A', padding: 16, borderRadius: 16, alignItems: 'center', gap: 4 },
  dpValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  dpLabel: { color: Colors.dark.muted, fontSize: 11, textTransform: 'uppercase' },
  closeBtn: { backgroundColor: '#3F3F46', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
