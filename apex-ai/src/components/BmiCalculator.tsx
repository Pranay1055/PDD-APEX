import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { BMI_CATEGORIES } from '../constants';
import { colors, fonts, spacing, fontSizes } from '../theme';

export default function BmiCalculator() {
  const { state, setProfileModalOpen } = useAppStore();
  const profile = state.profile;
  const isProfileCompleted = profile.profileCompleted;

  // Animated needle rotation
  const needleRotation = useRef(new Animated.Value(-90)).current;
  const [bmiText, setBmiText] = useState('0.0');

  useEffect(() => {
    if (!profile.bmi || profile.bmi <= 0) {
      setBmiText('0.0');
      needleRotation.setValue(-90);
      return;
    }
    const minBMI = 15;
    const maxBMI = 40;
    const clamped = Math.max(minBMI, Math.min(profile.bmi, maxBMI));
    const rotation = ((clamped - minBMI) / (maxBMI - minBMI)) * 180 - 90;

    Animated.spring(needleRotation, {
      toValue: rotation,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    let start = 0;
    const step = profile.bmi / 30;
    const interval = setInterval(() => {
      start += step;
      if (start >= profile.bmi) {
        start = profile.bmi;
        clearInterval(interval);
      }
      setBmiText(start.toFixed(1));
    }, 16);
    return () => clearInterval(interval);
  }, [profile.bmi]);

  // Mifflin-St Jeor Equation Calculations
  const getMifflinStJeorTdee = () => {
    const { age, gender, height, weight, activityLevel } = profile;
    if (!height || !weight || !age) return 0;
    let bmr = 0;
    if (gender === 'F') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
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

  const tdee = getMifflinStJeorTdee();

  const isBelowSafeLevel = (calories: number) => {
    const minSafe = profile.gender === 'F' ? 1200 : 1500;
    return calories < minSafe;
  };

  const currentCategory =
    BMI_CATEGORIES.find(c => profile.bmi <= c.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];

  const needleSpin = needleRotation.interpolate({
    inputRange: [-90, 90],
    outputRange: ['-90deg', '90deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>BMI & METABOLIC BASES</Text>
            <Text style={styles.subtitle}>Energy expenditure & biometric telemetry</Text>
          </View>

          {isProfileCompleted ? (
            <>
              {/* BMI Gauge Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>BODY MASS INDEX (BMI)</Text>
                  <Feather name="activity" size={16} color={colors.lime} />
                </View>
                <View style={styles.gaugeContainer}>
                  <Svg width={220} height={120} viewBox="0 0 200 100">
                    <Path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#222"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <Path d="M 20 100 A 80 80 0 0 1 60 30" fill="none" stroke="#3b82f6" strokeWidth="20" />
                    <Path d="M 60 30 A 80 80 0 0 1 140 30" fill="none" stroke="#22c55e" strokeWidth="20" />
                    <Path d="M 140 30 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="20" />
                    <G transform={`translate(100, 100)`}>
                      <Circle cx={0} cy={0} r={6} fill={colors.lime} />
                    </G>
                  </Svg>
                  <Animated.View
                    style={[
                      styles.needleWrapper,
                      { transform: [{ rotate: needleSpin }] },
                    ]}
                  >
                    <View style={styles.needle} />
                  </Animated.View>
                </View>
                <Text style={styles.bmiValue}>{bmiText}</Text>
                {profile.bmi > 0 && (
                  <Text style={[styles.bmiCategory, { color: currentCategory.color }]}>
                    {currentCategory.label}
                  </Text>
                )}
              </View>

              {/* Mifflin-St Jeor Energy Modulation targets */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>DAILY CALORIE BUDGETS</Text>
                    <Text style={styles.cardSubtitle}>MIFFLIN-ST JEOR WEIGHT TARGETS</Text>
                  </View>
                  <Feather name="zap" size={16} color={colors.lime} />
                </View>

                <View style={styles.targetsList}>
                  {/* Maintain Weight */}
                  <View style={styles.targetRow}>
                    <View style={styles.targetInfo}>
                      <Text style={styles.targetLabel}>MAINTAIN WEIGHT</Text>
                      <Text style={styles.targetSubText}>Steady metabolic energy baseline</Text>
                    </View>
                    <View style={styles.targetMetrics}>
                      <Text style={styles.targetCalories}>{tdee}</Text>
                      <Text style={styles.targetPercentage}>100% CAL/DAY</Text>
                    </View>
                  </View>

                  {/* Mild Weight Loss */}
                  <View style={styles.targetRow}>
                    <View style={styles.targetInfo}>
                      <Text style={[styles.targetLabel, { color: colors.lime }]}>MILD WEIGHT LOSS</Text>
                      <Text style={styles.targetSubText}>0.25 kg/week reduction rate</Text>
                    </View>
                    <View style={styles.targetMetrics}>
                      <Text style={[styles.targetCalories, { color: colors.lime }]}>
                        {Math.max(500, tdee - 250)}
                      </Text>
                      <Text style={[styles.targetPercentage, { color: colors.lime }]}>87% CAL/DAY</Text>
                    </View>
                  </View>

                  {/* Weight Loss */}
                  <View style={styles.targetRow}>
                    <View style={styles.targetInfo}>
                      <Text style={[styles.targetLabel, { color: colors.lime }]}>WEIGHT LOSS</Text>
                      <Text style={styles.targetSubText}>0.5 kg/week standard rate</Text>
                    </View>
                    <View style={styles.targetMetrics}>
                      <Text style={[styles.targetCalories, { color: colors.lime }]}>
                        {Math.max(500, tdee - 500)}
                      </Text>
                      <Text style={[styles.targetPercentage, { color: colors.lime }]}>75% CAL/DAY</Text>
                    </View>
                  </View>

                  {/* Extreme Weight Loss */}
                  <View style={[styles.targetRow, isBelowSafeLevel(tdee - 1000) && styles.unsafeTargetRow]}>
                    <View style={styles.targetInfo}>
                      <Text style={[styles.targetLabel, { color: colors.redMuted }]}>EXTREME WEIGHT LOSS</Text>
                      <Text style={styles.targetSubText}>1.0 kg/week aggressive rate</Text>
                    </View>
                    <View style={styles.targetMetrics}>
                      <Text style={[styles.targetCalories, { color: colors.redMuted }]}>
                        {Math.max(500, tdee - 1000)}
                      </Text>
                      <Text style={[styles.targetPercentage, { color: colors.redMuted }]}>49% CAL/DAY</Text>
                    </View>
                  </View>
                  {isBelowSafeLevel(tdee - 1000) && (
                    <View style={styles.warningAlertBox}>
                      <Feather name="alert-triangle" size={14} color={colors.redMuted} style={{ marginRight: 6 }} />
                      <Text style={styles.warningText}>
                        CAUTION: CALORIES DROP BELOW SAFE RANGE ({profile.gender === 'F' ? '1200' : '1500'} CAL). DOCTOR SUPERVISION STRONGLY ADVISED.
                      </Text>
                    </View>
                  )}

                  {/* Weight Gain */}
                  <View style={styles.targetRow}>
                    <View style={styles.targetInfo}>
                      <Text style={[styles.targetLabel, { color: colors.white }]}>WEIGHT GAIN</Text>
                      <Text style={styles.targetSubText}>0.5 kg/week hypertrophy surplus</Text>
                    </View>
                    <View style={styles.targetMetrics}>
                      <Text style={[styles.targetCalories, { color: colors.white }]}>{tdee + 500}</Text>
                      <Text style={[styles.targetPercentage, { color: colors.grayMuted }]}>125% CAL/DAY</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Calibrated Biometrics Telemetry Details */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardTitle}>CALIBRATED BIOMETRICS</Text>
                    <Text style={styles.cardSubtitle}>ACTIVE PROFILE PARAMETERS</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editBtnMini}
                    onPress={() => setProfileModalOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="edit-3" size={14} color={colors.lime} />
                    <Text style={styles.editBtnMiniText}>EDIT</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.telemetryGrid}>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>NAME</Text>
                    <Text style={styles.telemetryValue} numberOfLines={1}>{profile.name || 'ANONYMOUS'}</Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>AGE</Text>
                    <Text style={styles.telemetryValue}>{profile.age} YRS</Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>BIOLOGICAL SEX</Text>
                    <Text style={styles.telemetryValue}>{profile.gender === 'M' ? 'MALE' : 'FEMALE'}</Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>HEIGHT</Text>
                    <Text style={styles.telemetryValue}>{profile.height} CM</Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>WEIGHT</Text>
                    <Text style={styles.telemetryValue}>{profile.weight} KG</Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryLabel}>ACTIVITY LEVEL</Text>
                    <Text style={styles.telemetryValue}>
                      {profile.activityLevel === 'sedentary' && 'SEDENTARY'}
                      {profile.activityLevel === 'light' && 'LIGHT ACTIVE'}
                      {profile.activityLevel === 'moderate' && 'MODERATE ACTIVE'}
                      {profile.activityLevel === 'active' && 'VERY ACTIVE'}
                      {profile.activityLevel === 'very_active' && 'EXTRA ACTIVE'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.recalibrateButton}
                  onPress={() => setProfileModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.recalibrateButtonText}>RE-CALIBRATE BIOMETRICS</Text>
                  <Feather name="sliders" size={16} color={colors.dark} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Uncalibrated Screen State */
            <View style={styles.uncalibratedContainer}>
              <View style={styles.lockRing}>
                <Feather name="lock" size={32} color={colors.lime} />
              </View>
              <Text style={styles.uncalibratedTitle}>BIOMETRICS UNCALIBRATED</Text>
              <Text style={styles.uncalibratedText}>
                Establish your basal metabolic rate (BMR) and daily energy allotments by initializing your biometric vital telemetry bases.
              </Text>
              <TouchableOpacity
                style={styles.calibrateBtnBig}
                onPress={() => setProfileModalOpen(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.calibrateBtnBigText}>INITIALIZE BIOMETRICS</Text>
                <Feather name="arrow-right" size={18} color={colors.dark} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darker },
  scrollContent: { padding: spacing.base, paddingTop: spacing['3xl'], paddingBottom: 100 },
  header: { marginBottom: spacing.lg },
  title: { fontFamily: fonts.bebas, fontSize: fontSizes['4xl'], color: colors.lime, letterSpacing: 2 },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.grayMuted,
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 1,
  },

  card: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.white,
    letterSpacing: 1.5,
  },
  cardSubtitle: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  gaugeContainer: { position: 'relative', alignItems: 'center', marginBottom: spacing.base },
  needleWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 110 - 1, // center at 220/2
    width: 2,
    height: 75,
    transformOrigin: 'bottom center',
    alignItems: 'center',
  },
  needle: {
    width: 3,
    height: 75,
    backgroundColor: colors.lime,
    borderRadius: 2,
  },
  bmiValue: { fontFamily: fonts.bebas, fontSize: fontSizes['4xl'], color: colors.white, letterSpacing: 2 },
  bmiCategory: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Telemetry Grid
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.md,
  },
  telemetryItem: {
    width: '48%',
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.sm,
  },
  telemetryLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  telemetryValue: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.lg,
    color: colors.white,
  },
  editBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  editBtnMiniText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.lime,
  },
  recalibrateButton: {
    flexDirection: 'row',
    backgroundColor: colors.lime,
    width: '100%',
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  recalibrateButtonText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    color: colors.dark,
    letterSpacing: 1.5,
  },

  // Calorie targets lists
  targetsList: {
    width: '100%',
    gap: spacing.sm,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.md,
    borderRadius: 4,
  },
  targetInfo: {
    flex: 1,
    gap: 2,
  },
  targetLabel: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.lg,
    color: colors.white,
    letterSpacing: 1,
  },
  targetSubText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.grayMuted,
  },
  targetMetrics: {
    alignItems: 'flex-end',
  },
  targetCalories: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.white,
    letterSpacing: 1,
  },
  targetPercentage: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
  },
  unsafeTargetRow: {
    borderColor: colors.redMuted,
  },
  warningAlertBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: spacing.sm,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.redMuted,
    lineHeight: 14,
  },

  // Uncalibrated Screen
  uncalibratedContainer: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    borderRadius: 6,
  },
  lockRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkSurface,
    marginBottom: spacing.lg,
  },
  uncalibratedTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['2xl'],
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  uncalibratedText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.grayMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  calibrateBtnBig: {
    flexDirection: 'row',
    backgroundColor: colors.lime,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  calibrateBtnBigText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.lg,
    color: colors.dark,
    letterSpacing: 2,
  },
});
