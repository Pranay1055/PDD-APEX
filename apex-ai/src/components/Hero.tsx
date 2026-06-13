import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { colors, fonts, spacing, fontSizes } from '../theme';

const { width } = Dimensions.get('window');

export default function Hero() {
  const navigation = useNavigation<any>();
  const { state } = useAppStore();

  // Animated values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(40)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(0.8)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  // Ticker scroll
  const tickerX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(subY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.timing(statsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Ticker loop
    Animated.loop(
      Animated.timing(tickerX, { toValue: -width * 3, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);

  const stats = [
    { label: 'CURRENT BMI', val: state.profile.bmi || '--' },
    { label: 'WORKOUTS', val: state.workouts.length },
    { label: 'MEALS LOGGED', val: state.meals.length },
    { label: 'WEIGHT LOGS', val: state.weightHistory.length },
  ];

  const tickerUnit = 'BMI TRACKING — DIET PLANNING — AI COACHING — WORKOUT ROUTINES — PROGRESS ANALYTICS — STRENGTH TRAINING — CALORIE GOALS — SMART INSIGHTS — ';
  const tickerText = tickerUnit.repeat(6);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Background glow blobs (simulated with blurred Views) */}
        <View style={styles.glowBlobGreen} />
        <View style={styles.glowBlobBlue} />

        {/* Headline */}
        <Animated.View style={[styles.titleContainer, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          <View style={styles.titleRow}>
            <Text style={styles.titleWord}>TRAIN</Text>
            <Text style={styles.titleWord}> SMARTER.</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={[styles.titleWord, { color: colors.lime }]}>LIVE</Text>
            <Text style={[styles.titleWord, { color: colors.lime }]}> HARDER.</Text>
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { opacity: subOpacity, transform: [{ translateY: subY }] }]}>
          AI-ENHANCED TRACKING. BRUTAL CONSISTENCY. UNSTOPPABLE PROGRESS.
        </Animated.Text>

        {/* CTA Button */}
        <Animated.View style={{ opacity: btnOpacity, transform: [{ scale: btnScale }], width: '100%' }}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('BmiTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>START YOUR JOURNEY</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View style={[styles.statsGrid, { opacity: statsOpacity }]}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statVal}>{stat.val}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Visual Progress / Transformation Card */}
        <Animated.View style={{ opacity: statsOpacity, width: '100%', marginTop: spacing.xl }}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressCardTitle}>VISUAL TELEMETRY</Text>
            </View>
            
            {state.profile.beforePhoto || state.profile.afterPhoto ? (
              <View style={styles.progressPhotosRow}>
                
                {/* Before Slot */}
                <View style={styles.progressPhotoSlot}>
                  <View style={styles.progressImageWrapper}>
                    {state.profile.beforePhoto ? (
                      <Image source={{ uri: state.profile.beforePhoto }} style={styles.progressImage} />
                    ) : (
                      <View style={styles.progressImagePlaceholder}>
                        <Feather name="image" size={20} color={colors.grayMuted} />
                        <Text style={styles.progressPlaceholderText}>NO BASELINE</Text>
                      </View>
                    )}
                    <View style={styles.progressLabelOverlay}>
                      <Text style={styles.progressOverlayText}>BEFORE</Text>
                    </View>
                  </View>
                </View>

                {/* After Slot */}
                <View style={styles.progressPhotoSlot}>
                  <View style={styles.progressImageWrapper}>
                    {state.profile.afterPhoto ? (
                      <Image source={{ uri: state.profile.afterPhoto }} style={styles.progressImage} />
                    ) : (
                      <View style={styles.progressImagePlaceholder}>
                        <Feather name="trending-up" size={20} color={colors.grayMuted} />
                        <Text style={styles.progressPlaceholderText}>NO MILESTONE</Text>
                      </View>
                    )}
                    <View style={styles.progressLabelOverlay}>
                      <Text style={styles.progressOverlayText}>AFTER</Text>
                    </View>
                  </View>
                </View>

              </View>
            ) : (
              <View style={styles.progressEmptyState}>
                <Feather name="camera" size={28} color={colors.grayMuted} style={{ marginBottom: 6 }} />
                <Text style={styles.progressEmptyText}>NO VISUAL TELEMETRY LOGGED</Text>
                <Text style={styles.progressEmptySubtext}>CALIBRATE BASES IN PROFILE EDITOR</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Ticker strip at bottom */}
      <View style={styles.ticker}>
        <Animated.Text
          style={[styles.tickerText, { transform: [{ translateX: tickerX }] }]}
          numberOfLines={1}
        >
          {tickerText}
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing['4xl'],
    paddingBottom: 80,
  },
  glowBlobGreen: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: colors.lime,
    borderRadius: width * 0.3,
    opacity: 0.06,
  },
  glowBlobBlue: {
    position: 'absolute',
    bottom: '10%',
    right: -width * 0.1,
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: '#2563eb',
    borderRadius: width * 0.25,
    opacity: 0.06,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  titleWord: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['5xl'],
    color: colors.white,
    lineHeight: fontSizes['5xl'] * 1.1,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['2xs'],
    color: colors.grayDim,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.base,
  },
  ctaButton: {
    backgroundColor: colors.lime,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  ctaText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.dark,
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['2xs'],
    color: colors.grayMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statVal: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['3xl'],
    color: colors.lime,
  },
  ticker: {
    backgroundColor: colors.lime,
    paddingVertical: 6,
    overflow: 'hidden',
    width: '100%',
  },
  tickerText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    fontWeight: 'bold',
    color: colors.dark,
    textTransform: 'uppercase',
    width: width * 18,
  },
  progressCard: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    width: '100%',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  progressCardTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.white,
    letterSpacing: 1,
  },

  progressPhotosRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  progressPhotoSlot: {
    flex: 1,
  },
  progressImageWrapper: {
    width: '100%',
    height: 220,
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  progressImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.darkBorder,
    borderRadius: 4,
  },
  progressPlaceholderText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
  },
  progressLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 4,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.darkBorder,
  },
  progressOverlayText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.lime,
    letterSpacing: 1,
  },
  progressEmptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.darkBorder,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: colors.dark,
  },
  progressEmptyText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    color: colors.white,
    letterSpacing: 1,
  },
  progressEmptySubtext: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    marginTop: 2,
  },
});
