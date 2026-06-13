import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { colors, fonts, spacing, fontSizes } from '../theme';

export default function WeightTracker() {
  const { state, updateProfile, addWeightLog, setProfileModalOpen } = useAppStore();
  const profile = state.profile;
  const isProfileCompleted = profile.profileCompleted && (profile.bmi || 0) > 0;

  // Generate the last 7 calendar days ending with today
  const dates = useMemo(() => {
    const getLocalDateString = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      arr.push({
        dateStr: getLocalDateString(d), // YYYY-MM-DD in local timezone
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
        isToday: i === 0,
      });
    }
    return arr;
  }, []);

  // Utility to calculate TDEE based on Mifflin-St Jeor BMR * activityMultiplier
  const getTdeeForWeight = (w: number) => {
    const { age, gender, height, activityLevel } = profile;
    let bmr = 0;
    if (gender === 'F') {
      bmr = 10 * w + 6.25 * height - 5 * age - 161;
    } else {
      bmr = 10 * w + 6.25 * height - 5 * age + 5;
    }
    
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const factor = multipliers[activityLevel] || 1.55;
    return Math.round(bmr * factor);
  };

  // State-controlled input values for each of the 7 days (persisted automatically to store weightHistory)
  const dayWeights = useMemo(() => {
    const map: Record<string, string> = {};
    dates.forEach(d => {
      const log = state.weightHistory.find(w => w.date === d.dateStr);
      map[d.dateStr] = log ? String(log.weight) : '';
    });
    return map;
  }, [state.weightHistory, dates]);

  const handleWeightChange = (dateStr: string, text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, '');
    const num = Number(cleanText);
    if (!isNaN(num) && num > 0) {
      addWeightLog(num, dateStr);
    } else if (cleanText === '') {
      // Allow empty value
      updateProfile({ weight: profile.weight }); // trigger update
    }
  };

  const handleAdjustWeightGoal = (change: number) => {
    const currentKg = (profile.calorieOffset || 500) / 1000;
    const nextKg = Math.max(0.1, Math.min(1.5, currentKg + change));
    updateProfile({ calorieOffset: Math.round(nextKg * 1000) });
  };

  // 7-day average metrics
  const statsSummary = useMemo(() => {
    const activeWeights = dates
      .map(d => {
        const entry = state.weightHistory.find(w => w.date === d.dateStr);
        return entry ? entry.weight : null;
      })
      .filter((w): w is number => w !== null);

    const baseWeight = activeWeights.length > 0
      ? activeWeights.reduce((a, b) => a + b, 0) / activeWeights.length
      : profile.weight;

    const avgMaintain = getTdeeForWeight(baseWeight);
    const offset = profile.calorieOffset || 500;

    return {
      avgWeight: Number(baseWeight.toFixed(1)),
      avgMaintain,
      avgGain: avgMaintain + offset,
      avgLose: avgMaintain - offset,
      logsCount: activeWeights.length,
    };
  }, [state.weightHistory, profile, dates]);

  // Premium custom SVG line chart (native performance alternative to Chart.js)
  const chartData = useMemo(() => {
    const w = 345;
    const h = 180;
    const padding = 25;

    let fallbackWeight = profile.weight;
    const pointsData = dates.map(d => {
      const log = state.weightHistory.find(w => w.date === d.dateStr);
      if (log) {
        fallbackWeight = log.weight;
      }
      return {
        label: d.shortDate,
        weight: fallbackWeight,
        logged: !!log,
      };
    });

    const weights = pointsData.map(p => p.weight);
    let minW = Math.min(...weights) - 3;
    let maxW = Math.max(...weights) + 3;
    if (minW === maxW) {
      minW -= 2;
      maxW += 2;
    }

    const points = pointsData.map((p, i) => {
      const x = padding + (i / (dates.length - 1)) * (w - padding * 2);
      const y = h - padding - ((p.weight - minW) / (maxW - minW)) * (h - padding * 2);
      return { x, y, ...p };
    });

    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    
    return { points, pathD, w, h };
  }, [state.weightHistory, profile.weight, dates]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>TELEMETRY LOGS</Text>
            <Text style={styles.subtitle}>WEEK-BY-WEEK TDEE WEIGHT TARGETS</Text>
          </View>

          {/* Goal Calibration Panel */}
          {isProfileCompleted ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>WEEKLY RATE TARGET CALIBRATION</Text>
                  <Text style={styles.cardSubtitle}>ADJUST WEEKLY WEIGHT CHANGE GOAL</Text>
                </View>
                <Feather name="trending-up" size={16} color={colors.lime} />
              </View>
              
              <View style={styles.offsetAdjusterRow}>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjustWeightGoal(-0.05)}>
                  <Feather name="minus" size={18} color={colors.lime} />
                </TouchableOpacity>
                <View style={styles.offsetLabelContainer}>
                  <Text style={styles.offsetVal}>{((profile.calorieOffset || 500) / 1000).toFixed(2)}</Text>
                  <Text style={styles.offsetUnit}>KG / WEEK TARGET</Text>
                </View>
                <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjustWeightGoal(0.05)}>
                  <Feather name="plus" size={18} color={colors.lime} />
                </TouchableOpacity>
              </View>

              <Text style={styles.calculatedOffsetHelp}>
                CALCULATED ENERGY GAP: {profile.calorieOffset || 500} KCAL/DAY DISPLACEMENT
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.card, { alignItems: 'center', paddingVertical: spacing.xl }]} 
              onPress={() => setProfileModalOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="lock" size={24} color={colors.lime} style={{ marginBottom: 8 }} />
              <Text style={[styles.cardTitle, { color: colors.lime }]}>TELEMETRY BASES UNCALIBRATED</Text>
              <Text style={[styles.cardSubtitle, { textAlign: 'center', marginTop: 4 }]}>TAP TO CALIBRATE METRICS & CALCULATE PERSONAL MAINTENANCE TARGETS</Text>
            </TouchableOpacity>
          )}

          {/* Summary Metric Cards */}
          {isProfileCompleted && (
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: colors.darkBorder }]}>
                <Text style={styles.statLabel}>AVG MAINTAIN</Text>
                <Text style={[styles.statVal, { color: colors.white }]}>{statsSummary.avgMaintain}</Text>
                <Text style={styles.statSub}>KCAL / DAY</Text>
              </View>
              <View style={[styles.statCard, { borderColor: 'rgba(204,255,0,0.4)' }]}>
                <Text style={[styles.statLabel, { color: colors.lime }]}>AVG GAIN</Text>
                <Text style={[styles.statVal, { color: colors.lime }]}>{statsSummary.avgGain}</Text>
                <Text style={styles.statSub}>+{((profile.calorieOffset || 500) / 1000).toFixed(2)} KG / WK</Text>
              </View>
              <View style={[styles.statCard, { borderColor: 'rgba(239,68,68,0.4)' }]}>
                <Text style={[styles.statLabel, { color: colors.redMuted }]}>AVG LOSE</Text>
                <Text style={[styles.statVal, { color: colors.redMuted }]}>{statsSummary.avgLose}</Text>
                <Text style={styles.statSub}>-{((profile.calorieOffset || 500) / 1000).toFixed(2)} KG / WK</Text>
              </View>
            </View>
          )}

          {/* 7-Day Weight Logs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>7-DAY CALORIE & WEIGHT LOG</Text>
            <Text style={styles.cardSubtitle}>LOG KG TO GENERATE INSTANT BMR TARGETS</Text>

            <View style={styles.dayList}>
              {dates.map(d => {
                const loggedWeight = dayWeights[d.dateStr] || '';
                const currentWeightNum = Number(loggedWeight) || statsSummary.avgWeight;
                const dailyTdee = getTdeeForWeight(currentWeightNum);
                const surplusVal = dailyTdee + (profile.calorieOffset || 500);
                const deficitVal = dailyTdee - (profile.calorieOffset || 500);

                return (
                  <View
                    key={d.dateStr}
                    style={[
                      styles.dayRow,
                      d.isToday && styles.todayRow,
                    ]}
                  >
                    {/* Left Column: Date & Badge */}
                    <View style={styles.dayMeta}>
                      <Text style={[styles.dayName, d.isToday && styles.todayText]}>
                        {d.dayLabel}
                      </Text>
                      <Text style={styles.dayDate}>{d.shortDate}</Text>
                      {d.isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>TODAY</Text>
                        </View>
                      )}
                    </View>

                    {/* Middle Column: Kilograms Input */}
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.weightInput}
                        value={loggedWeight}
                        onChangeText={t => handleWeightChange(d.dateStr, t)}
                        placeholder={String(profile.weight)}
                        placeholderTextColor={colors.grayMuted}
                        keyboardType="numeric"
                        selectionColor={colors.lime}
                      />
                      <Text style={styles.weightUnit}>KG</Text>
                    </View>

                    {/* Right Column: Calculated Calorie Budgets */}
                    {isProfileCompleted && (
                      <View style={styles.calTargets}>
                        <View style={styles.calItem}>
                          <Text style={styles.calLabel}>MAINTAIN</Text>
                          <Text style={styles.calNum}>{dailyTdee}</Text>
                        </View>
                        <View style={styles.calItem}>
                          <Text style={[styles.calLabel, { color: colors.lime }]}>GAIN</Text>
                          <Text style={[styles.calNum, { color: colors.lime }]}>{surplusVal}</Text>
                        </View>
                        <View style={styles.calItem}>
                          <Text style={[styles.calLabel, { color: colors.redMuted }]}>LOSE</Text>
                          <Text style={[styles.calNum, { color: colors.redMuted }]}>{deficitVal}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Weight Trend Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>7-DAY TELEMETRY TREND</Text>
            <Text style={styles.cardSubtitle}>VISUAL WEIGHT DIRECTION</Text>

            <View style={styles.chartWrapper}>
              <Svg width="100%" height={chartData.h} viewBox={`0 0 ${chartData.w} ${chartData.h}`}>
                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map(frac => (
                  <Line
                    key={frac}
                    x1={20}
                    y1={20 + frac * (chartData.h - 40)}
                    x2={chartData.w - 20}
                    y2={20 + frac * (chartData.h - 40)}
                    stroke="#222"
                    strokeDasharray="2,2"
                  />
                ))}
                
                {/* Custom Line Path */}
                <Path
                  d={chartData.pathD}
                  fill="none"
                  stroke={colors.lime}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Nodes & Data Annotations */}
                {chartData.points.map((p, i) => (
                  <React.Fragment key={i}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={4}
                      fill={p.logged ? colors.lime : colors.dark}
                      stroke={colors.lime}
                      strokeWidth={2}
                    />
                    <SvgText
                      x={p.x}
                      y={p.y - 10}
                      fill={p.logged ? colors.white : colors.grayMuted}
                      fontSize="9"
                      fontFamily={fonts.mono}
                      textAnchor="middle"
                    >
                      {p.weight.toFixed(1)}
                    </SvgText>
                    <SvgText
                      x={p.x}
                      y={chartData.h - 5}
                      fill={colors.grayMuted}
                      fontSize="8"
                      fontFamily={fonts.mono}
                      textAnchor="middle"
                    >
                      {p.label}
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing['4xl'],
    paddingBottom: 110,
    gap: spacing.base,
  },
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['5xl'],
    color: colors.lime,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.grayMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    borderRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.white,
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  offsetAdjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  offsetLabelContainer: {
    alignItems: 'center',
  },
  offsetVal: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['4xl'],
    color: colors.lime,
    letterSpacing: 1,
  },
  offsetUnit: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayDim,
    letterSpacing: 1,
  },
  calculatedOffsetHelp: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statVal: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['2xl'],
    marginVertical: 4,
  },
  statSub: {
    fontFamily: fonts.mono,
    fontSize: 7,
    color: colors.grayDim,
  },
  dayList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.md,
    borderRadius: 4,
  },
  todayRow: {
    borderColor: colors.lime,
    backgroundColor: 'rgba(204,255,0,0.03)',
  },
  dayMeta: {
    width: 65,
  },
  dayName: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.lg,
    color: colors.white,
    letterSpacing: 1,
  },
  todayText: {
    color: colors.lime,
  },
  dayDate: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: colors.lime,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  todayBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 7,
    color: colors.dark,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    paddingHorizontal: spacing.sm,
    width: 90,
    height: 38,
    borderRadius: 4,
  },
  weightInput: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    padding: 0,
  },
  weightUnit: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    marginLeft: 2,
  },
  calTargets: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  calItem: {
    alignItems: 'center',
    width: 46,
  },
  calLabel: {
    fontFamily: fonts.mono,
    fontSize: 7,
    color: colors.grayMuted,
    letterSpacing: 0.5,
  },
  calNum: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.base,
    color: colors.white,
    marginTop: 2,
  },
  chartWrapper: {
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.xs,
    borderRadius: 4,
  },
});
