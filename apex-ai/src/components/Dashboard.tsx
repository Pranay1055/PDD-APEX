import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { colors, fonts, spacing, fontSizes } from '../theme';

const { width } = Dimensions.get('window');
const DONUT_R = 15.91549430918954;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R; // ~100

export default function Dashboard() {
  const { state, setProfileModalOpen } = useAppStore();

  const stats = useMemo(() => ({
    workouts: state.workouts.length,
    caloriesBurned: state.workouts.reduce((a, b) => a + b.totalCalories, 0),
    avgBmi: state.profile.bmi || 0,
    daysTracked: state.weightHistory.length,
  }), [state]);

  const macroTotals = useMemo(() => {
    const totals = state.meals.reduce(
      (acc, m) => ({ p: acc.p + m.protein, c: acc.c + m.carbs, f: acc.f + m.fat }),
      { p: 0, c: 0, f: 0 }
    );
    const sum = totals.p + totals.c + totals.f || 1;
    return { p: totals.p / sum, c: totals.c / sum, f: totals.f / sum };
  }, [state.meals]);

  // Donut chart: strokeDasharray on circumference-based circle
  const pDash = `${(macroTotals.p * 100).toFixed(1)} ${(100 - macroTotals.p * 100).toFixed(1)}`;
  const cDash = `${(macroTotals.c * 100).toFixed(1)} ${(100 - macroTotals.c * 100).toFixed(1)}`;
  const fDash = `${(macroTotals.f * 100).toFixed(1)} ${(100 - macroTotals.f * 100).toFixed(1)}`;

  // Protein offset starts at 25 (12 o'clock in SVG coords)
  const pOffset = 25;
  const cOffset = 25 - macroTotals.p * 100;
  const fOffset = 25 - (macroTotals.p + macroTotals.c) * 100;

  // Activity heatmap: dynamically generated matching current calendar month days
  const { heatmapCells, monthName, totalDaysInMonth } = useMemo(() => {
    const toLocalDateStr = (dStr: string) => {
      if (!dStr) return '';
      if (!dStr.includes('T')) return dStr;
      const date = new Date(dStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const totalDays = new Date(year, month + 1, 0).getDate();
    const mName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

    const arr = [];
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const d = new Date(year, month, dayNum);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      
      let count = 0;
      
      state.workouts.forEach(w => {
        try {
          if (toLocalDateStr(w.date) === dateStr) {
            count++;
          }
        } catch {}
      });
      
      state.meals.forEach(m => {
        try {
          if (toLocalDateStr(m.date) === dateStr) {
            count++;
          }
        } catch {}
      });
      
      state.weightHistory.forEach(wh => {
        try {
          if (toLocalDateStr(wh.date) === dateStr) {
            count++;
          }
        } catch {}
      });
      
      arr.push({ count, dayNum });
    }
    
    return {
      heatmapCells: arr,
      monthName: mName,
      totalDaysInMonth: totalDays,
    };
  }, [state.workouts, state.meals, state.weightHistory]);

  const statRows = [
    { label: 'WORKOUTS', val: stats.workouts },
    { label: 'CALS BURNED', val: stats.caloriesBurned },
    { label: 'CURRENT BMI', val: stats.avgBmi },
    { label: 'DAYS TRACKED', val: stats.daysTracked },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={styles.title}>COMMAND CENTER</Text>
        <Text style={styles.subtitle}>The hard data.</Text>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          {statRows.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.accentBorder} />
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
            </View>
          ))}
        </View>



        {/* Charts Row */}
        <View style={styles.chartsRow}>

          {/* Macro Donut */}
          <View style={[styles.card, styles.donutCard]}>
            <Text style={styles.cardTitle}>MACRO DIST.</Text>
            <View style={styles.donutWrapper}>
              <Svg width={140} height={140} viewBox="0 0 42 42" style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Track */}
                <Circle cx={21} cy={21} r={DONUT_R} fill="transparent" stroke="#222" strokeWidth={6} />
                {/* Protein - lime */}
                <Circle
                  cx={21} cy={21} r={DONUT_R}
                  fill="transparent"
                  stroke={colors.lime}
                  strokeWidth={6}
                  strokeDasharray={pDash}
                  strokeDashoffset={pOffset}
                />
                {/* Carbs - blue */}
                <Circle
                  cx={21} cy={21} r={DONUT_R}
                  fill="transparent"
                  stroke={colors.blue}
                  strokeWidth={6}
                  strokeDasharray={cDash}
                  strokeDashoffset={cOffset}
                />
                {/* Fat - red */}
                <Circle
                  cx={21} cy={21} r={DONUT_R}
                  fill="transparent"
                  stroke={colors.red}
                  strokeWidth={6}
                  strokeDasharray={fDash}
                  strokeDashoffset={fOffset}
                />
              </Svg>
              {/* Center label */}
              <View style={styles.donutCenter}>
                <Text style={styles.donutVal}>{state.meals.length}</Text>
                <Text style={styles.donutSub}>MEALS</Text>
              </View>
            </View>
            {/* Legend */}
            <View style={styles.legend}>
              {[
                { color: colors.lime, label: 'PRO' },
                { color: colors.blue, label: 'CARB' },
                { color: colors.red, label: 'FAT' },
              ].map(l => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                  <Text style={styles.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Heatmap */}
          <View style={[styles.card, styles.heatmapCard]}>
            <Text style={styles.cardTitle}>ACTIVITY HEATMAP</Text>
            <Text style={styles.heatmapSub}>{monthName} - {totalDaysInMonth} DAYS</Text>
            <View style={styles.heatmapGrid}>
              {heatmapCells.map((cell, i) => {
                let cellStyle = {};
                if (cell.count === 0) {
                  cellStyle = styles.heatCellInactive;
                } else if (cell.count === 1) {
                  cellStyle = {
                    backgroundColor: 'rgba(204, 255, 0, 0.35)',
                    borderColor: 'rgba(204, 255, 0, 0.4)',
                  };
                } else if (cell.count === 2) {
                  cellStyle = {
                    backgroundColor: 'rgba(204, 255, 0, 0.65)',
                    borderColor: 'rgba(204, 255, 0, 0.7)',
                  };
                } else {
                  cellStyle = styles.heatCellActive; // 3 or more activities, fully bright
                }

                return (
                  <View
                    key={i}
                    style={[styles.heatCell, cellStyle]}
                  />
                );
              })}
            </View>
            <Text style={styles.heatmapQuote}>
              Consistency is the only variable that matters.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL = (width - spacing.base * 2 - spacing.base - spacing.xs * 6) / 7;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dark },
  scrollContent: { padding: spacing.base, paddingTop: spacing['4xl'], paddingBottom: 100 },

  title: { fontFamily: fonts.bebas, fontSize: fontSizes['5xl'], color: colors.white, letterSpacing: 2 },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.grayDim,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: spacing.xl,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: {
    width: '47%',
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.lime,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['2xs'],
    color: colors.grayMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
    paddingLeft: spacing.sm,
  },
  statVal: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['4xl'],
    color: colors.white,
    paddingLeft: spacing.sm,
  },

  chartsRow: { gap: spacing.base },

  card: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.white,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  donutCard: { alignItems: 'center' },
  donutWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.base },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutVal: { fontFamily: fonts.bebas, fontSize: fontSizes['2xl'], color: colors.lime },
  donutSub: { fontFamily: fonts.mono, fontSize: 9, color: colors.grayMuted },
  legend: { flexDirection: 'row', gap: spacing.base, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayDim },

  heatmapCard: {},
  heatmapSub: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['2xs'],
    color: colors.grayMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  heatCell: {
    width: CELL * 0.75,
    height: CELL * 0.75,
    borderRadius: 2,
    borderWidth: 1,
  },
  heatCellActive: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  heatCellInactive: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
  },
  heatmapQuote: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    textTransform: 'uppercase',
    textAlign: 'right',
    marginTop: spacing.base,
  },
});
