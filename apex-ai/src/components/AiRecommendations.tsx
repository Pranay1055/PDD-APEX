import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppStore } from '../store';
import { API_BASE_URL } from '../constants';
import { colors, fonts, spacing, fontSizes } from '../theme';
import { WORKOUT_ASSETS } from '../workoutAssets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RecData {
  dietRecommendations: string;
  workoutAdjustments: string;
  progressAnalysis: string;
  suggestedWorkouts?: string[];
}

interface WorkoutVideoCardProps {
  exercise: string;
  assetSource: any;
  exerciseLabel: string;
}

// Child component to manage each video player instance and state separately, satisfying hook rules
function WorkoutVideoCard({ exercise, assetSource, exerciseLabel }: WorkoutVideoCardProps) {
  if (!assetSource) {
    return (
      <View style={styles.videoCard}>
        {/* Card Header */}
        <View style={styles.videoCardHeader}>
          <View style={styles.videoCardTitleRow}>
            <View style={styles.videoCardDot} />
            <Text style={styles.videoCardTitle}>{exerciseLabel}</Text>
          </View>
          <Text style={styles.videoCardBadge}>BUNDLED</Text>
        </View>

        {/* Video Player Container */}
        <View style={styles.videoPlayerContainer}>
          <View style={styles.videoOverlay}>
            <Feather name="film" size={28} color={colors.grayMuted} />
            <Text style={styles.videoErrorText}>NO ASSET FOR "{exercise}"</Text>
          </View>
        </View>

        <Text style={styles.videoCardDesc}>
          FOLLOW THIS TUTORIAL TO EXECUTE{' '}
          <Text style={{ color: colors.lime }}>{exerciseLabel}</Text> WITH CORRECT
          BIOMECHANICAL FORM.
        </Text>
      </View>
    );
  }

  // Initialize the player (do not autoplay automatically, let user tap play)
  const player = useVideoPlayer(assetSource, (playerInstance) => {
    playerInstance.loop = false;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Initial status check since it could load immediately
    if (player.status === 'readyToPlay') {
      setIsLoading(false);
    } else if (player.status === 'error') {
      setIsLoading(false);
      setHasError(true);
    }

    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        setIsLoading(false);
        setHasError(false);
      } else if (status === 'loading') {
        setIsLoading(true);
        setHasError(false);
      } else if (status === 'error') {
        setIsLoading(false);
        setHasError(true);
        console.error(`Video player error for ${exercise}:`, error);
      }
    });

    return () => {
      sub.remove();
    };
  }, [player, exercise]);

  return (
    <View style={styles.videoCard}>
      {/* Card Header */}
      <View style={styles.videoCardHeader}>
        <View style={styles.videoCardTitleRow}>
          <View style={styles.videoCardDot} />
          <Text style={styles.videoCardTitle}>{exerciseLabel}</Text>
        </View>
        <Text style={styles.videoCardBadge}>BUNDLED</Text>
      </View>

      {/* Video Player Container */}
      <View style={styles.videoPlayerContainer}>
        {/* Loading Overlay — shown while video buffers */}
        {isLoading && !hasError && (
          <View style={styles.videoOverlay}>
            <ActivityIndicator color={colors.lime} size="large" />
            <Text style={styles.videoLoadingText}>LOADING VIDEO...</Text>
          </View>
        )}

        {/* Error Overlay */}
        {hasError && (
          <View style={styles.videoOverlay}>
            <Feather name="alert-triangle" size={28} color={colors.redMuted} />
            <Text style={styles.videoErrorText}>VIDEO UNAVAILABLE</Text>
          </View>
        )}

        <VideoView
          player={player}
          nativeControls={true}
          contentFit="cover"
          surfaceType="textureView"
          style={[
            styles.videoPlayer,
            // Hide video element while loading or errored to avoid flicker
            (isLoading || hasError) && styles.videoHidden,
          ]}
        />
      </View>

      <Text style={styles.videoCardDesc}>
        FOLLOW THIS TUTORIAL TO EXECUTE{' '}
        <Text style={{ color: colors.lime }}>{exerciseLabel}</Text> WITH CORRECT
        BIOMECHANICAL FORM.
      </Text>
    </View>
  );
}

export default function AiRecommendations() {
  const { state, showAlert } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecData | null>(null);

  const generate = async () => {
    setLoading(true);
    setData(null);

    const last3Days = state.meals.slice(-10);
    const avgCal = last3Days.reduce((a, b) => a + b.calories, 0) / (last3Days.length || 1);
    const avgPro = last3Days.reduce((a, b) => a + b.protein, 0) / (last3Days.length || 1);
    const wHistory = [...state.weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const startW = wHistory[0]?.weight || state.profile.weight;

    const payload = {
      bmi: state.profile.bmi,
      bmiCategory: 'Calculated',
      currentWeight: state.profile.weight,
      startWeight: startW,
      targetWeight: state.profile.targetWeight || state.profile.weight,
      avgCalories: Math.round(avgCal),
      avgProtein: Math.round(avgPro),
      recentWorkouts: state.workouts.length,
      age: state.profile.age,
      gender: state.profile.gender,
      activityLevel: state.profile.activityLevel,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });
      const json = await res.json();
      if (json.dietRecommendations) {
        // Normalize suggested workout names to lowercase to match asset keys
        if (json.suggestedWorkouts) {
          json.suggestedWorkouts = json.suggestedWorkouts.map((s: string) => s.toLowerCase());
        }
        setData(json);
      } else {
        showAlert('Error', json.error || 'Failed to parse AI coaching suggestions.');
      }
    } catch (e) {
      showAlert('Connection Issue', 'The server is currently unavailable. Please try again after some time.');
    } finally {
      setLoading(false);
    }
  };

  const cards = data
    ? [
        { title: 'DIET MODS', content: data.dietRecommendations, icon: 'coffee' as const },
        { title: 'TRAINING SHIFTS', content: data.workoutAdjustments, icon: 'activity' as const },
        { title: 'PROGRESS AUDIT', content: data.progressAnalysis, icon: 'trending-up' as const },
      ]
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Background glow */}
      <View style={styles.glow} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>AI COACH</Text>
          <Text style={styles.subtitle}>Data ingested. Strategies generated.</Text>

          {!data && (
            <TouchableOpacity
              style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
              onPress={generate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.dark} size="small" />
                  <Text style={styles.generateBtnText}>  ANALYZING VITAL DATA...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Feather name="zap" size={20} color={colors.dark} />
                  <Text style={styles.generateBtnText}>  GENERATE INSIGHTS</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── AI Coaching Cards ── */}
        {data && (
          <>
            {cards.map((item, i) => (
              <View key={i} style={styles.recCard}>
                <View style={styles.accentLine} />
                <View style={styles.cardHeaderRow}>
                  <Feather name={item.icon} size={16} color={colors.lime} />
                  <Text style={styles.cardTitle}> {item.title}</Text>
                </View>
                <Text style={styles.cardContent}>{item.content}</Text>
              </View>
            ))}

            {/* ── Suggested Workout Videos ── */}
            {data.suggestedWorkouts && data.suggestedWorkouts.length > 0 && (
              <View style={styles.videoSection}>
                <View style={styles.videoSectionHeader}>
                  <Feather name="zap" size={18} color={colors.lime} />
                  <Text style={styles.videoSectionTitle}> RECOMMENDED TUTORIALS</Text>
                </View>
                <Text style={styles.videoSectionSubtitle}>
                  SUGGESTED BY AI TO REACH YOUR{' '}
                  {state.profile.targetWeight || state.profile.weight} KG GOAL
                </Text>

                {data.suggestedWorkouts.map((ex, idx) => {
                  const assetSource = WORKOUT_ASSETS[ex];
                  const exerciseLabel = ex.replace(/[-_]/g, ' ').toUpperCase();

                  return (
                    <WorkoutVideoCard
                      key={idx}
                      exercise={ex}
                      assetSource={assetSource}
                      exerciseLabel={exerciseLabel}
                    />
                  );
                })}
              </View>
            )}

            {/* ── Recalculate ── */}
            <TouchableOpacity
              style={styles.recalcBtn}
              onPress={generate}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={colors.lime} size="small" />
              ) : (
                <Feather name="refresh-cw" size={14} color={colors.lime} />
              )}
              <Text style={styles.recalcText}>
                {'  '}{loading ? 'RE-ANALYZING...' : 'RECALCULATE'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darker },
  glow: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    width: '80%',
    height: '40%',
    backgroundColor: colors.lime,
    borderRadius: 999,
    opacity: 0.04,
  },
  scrollContent: {
    padding: spacing.base,
    paddingTop: spacing['4xl'],
    paddingBottom: 100,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: { alignItems: 'center', marginBottom: spacing['2xl'] },
  title: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['5xl'],
    color: colors.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.grayDim,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  generateBtn: {
    backgroundColor: colors.lime,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  generateBtnDisabled: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  generateBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['2xl'],
    color: colors.dark,
    letterSpacing: 2,
  },

  // ── Rec Cards ───────────────────────────────────────────────────────────────
  recCard: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.3)',
    padding: spacing.base,
    marginBottom: spacing.base,
    position: 'relative',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.lime,
    opacity: 0.6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: 8,
  },
  cardTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['2xl'],
    color: colors.lime,
    letterSpacing: 1,
  },
  cardContent: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: '#d1d5db',
    lineHeight: 22,
  },

  // ── Video Section ────────────────────────────────────────────────────────────
  videoSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.darkBorder,
  },
  videoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  videoSectionTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['3xl'],
    color: colors.white,
    letterSpacing: 1.5,
  },
  videoSectionSubtitle: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayDim,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },

  // ── Individual Video Card ────────────────────────────────────────────────────
  videoCard: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 8,
    marginBottom: spacing.base,
    overflow: 'hidden',
  },
  videoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
  },
  videoCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
  videoCardTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.lime,
    letterSpacing: 1,
  },
  videoCardBadge: {
    fontFamily: fonts.mono,
    fontSize: 7,
    color: colors.grayMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(204,255,0,0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.15)',
  },

  // ── Video Player ─────────────────────────────────────────────────────────────
  videoPlayerContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#0a0a0a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoHidden: {
    opacity: 0,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 2,
  },
  videoLoadingText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  videoErrorText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.redMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },

  videoCardDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSizes['2xs'],
    color: colors.grayDim,
    lineHeight: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // ── Recalculate ──────────────────────────────────────────────────────────────
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
  },
  recalcText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.xs,
    color: colors.lime,
    textTransform: 'uppercase',
  },
});
