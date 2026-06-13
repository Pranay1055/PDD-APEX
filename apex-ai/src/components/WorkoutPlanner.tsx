import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppStore, ExerciseEntry } from '../store';
import { EXERCISES } from '../constants';
import { colors, fonts, spacing, fontSizes } from '../theme';

const categories = ['All', ...Array.from(new Set(EXERCISES.map(e => e.group)))];

export default function WorkoutPlanner() {
  const { addWorkout, state, showAlert } = useAppStore();
  const [session, setSession] = useState<ExerciseEntry[]>([]);
  const [filter, setFilter] = useState('All');

  const filteredLibrary = filter === 'All' ? EXERCISES : EXERCISES.filter(e => e.group === filter);

  const addToSession = (ex: typeof EXERCISES[0]) => {
    if (session.some(e => e.name === ex.name)) {
      showAlert('Limit Reached', `Only one session of ${ex.name} is allowed per workout.`);
      return;
    }
    const id = Date.now().toString() + Math.random().toString();
    setSession(prev => [...prev, { ...ex, id, completed: false, weight: 0 }]);
  };

  const updateSessionExercise = (id: string, updates: Partial<ExerciseEntry>) => {
    setSession(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeSessionExercise = (id: string) => {
    setSession(prev => prev.filter(e => e.id !== id));
  };

  const toggleComplete = (id: string) => {
    setSession(prev => prev.map(e => (e.id === id ? { ...e, completed: !e.completed } : e)));
  };

  const handleFinish = () => {
    if (session.length === 0) return;
    const cals = session.reduce((acc, ex) => {
      const multiplier = ex.group === 'Cardio' || ex.group === 'HIIT' ? 10 : 6;
      return acc + ex.duration * multiplier;
    }, 0);
    addWorkout({ date: new Date().toISOString(), exercises: session, totalCalories: cals });
    setSession([]);
    showAlert('Workout Saved', 'Your completed workout session has been logged to the Command Center.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.content}>
          <Text style={styles.title}>WORKOUT PLANNER</Text>
          <Text style={styles.subtitle}>Break a sweat. Break records.</Text>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {categories.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.filterBtn, filter === c && styles.filterBtnActive]}
                onPress={() => setFilter(c)}
              >
                <Text style={[styles.filterText, filter === c && styles.filterTextActive]}>
                  {c.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Exercise Library */}
          <View style={styles.libraryCard}>
            {filteredLibrary.map((ex, i) => {
              const count = session.filter(s => s.name === ex.name).length;
              const isBlocked = count > 0;

              return (
                <View key={i} style={styles.exerciseRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      {count > 0 && (
                        <View style={styles.addedBadge}>
                          <Text style={styles.addedBadgeText}>x{count}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.exerciseMeta}>
                      {ex.group} · {ex.sets}×{ex.reps} · {ex.duration}m
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, count > 0 && styles.addBtnActive]}
                    onPress={() => addToSession(ex)}
                    disabled={isBlocked}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={count > 0 ? "check" : "plus"}
                      size={16}
                      color={count > 0 ? colors.dark : colors.white}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Today's Session */}
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>TODAY'S WORKOUT</Text>
              <Text style={styles.sessionCount}>{session.length} MOVES</Text>
            </View>

            {session.length === 0 ? (
              <View style={styles.emptySession}>
                <Feather name="activity" size={36} color={colors.grayMuted} />
                <Text style={styles.emptyText}>BUILD YOUR SESSION FROM THE LIBRARY TO START.</Text>
              </View>
            ) : (
              session.map(ex => (
                <View key={ex.id} style={[styles.sessionExercise, ex.completed && styles.sessionExerciseDone]}>
                  <View style={styles.sessionExHeader}>
                    <View style={styles.sessionExLeft}>
                      <TouchableOpacity
                        style={[styles.checkBox, ex.completed && styles.checkBoxDone]}
                        onPress={() => toggleComplete(ex.id)}
                      >
                        {ex.completed && <Feather name="check" size={10} color={colors.dark} />}
                      </TouchableOpacity>
                      <Text style={[styles.sessionExName, ex.completed && styles.sessionExNameDone]}>
                        {ex.name}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeSessionExercise(ex.id)}>
                      <Feather name="trash-2" size={14} color={colors.grayMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputGrid, ex.completed && { opacity: 0.4 }]}>
                    {[
                      { label: 'SETS', field: 'sets' as keyof ExerciseEntry },
                      { label: 'REPS', field: 'reps' as keyof ExerciseEntry },
                      { label: 'WT', field: 'weight' as keyof ExerciseEntry },
                      { label: 'MINS', field: 'duration' as keyof ExerciseEntry },
                    ].map(inp => (
                      <View key={inp.field} style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>{inp.label}</Text>
                        <TextInput
                          style={styles.numInput}
                          value={String(ex[inp.field] as number)}
                          onChangeText={v => updateSessionExercise(ex.id, { [inp.field]: Number(v) })}
                          keyboardType="numeric"
                          editable={!ex.completed}
                          selectionColor={colors.lime}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.finishBtn, session.length === 0 && styles.finishBtnDisabled]}
              onPress={handleFinish}
              disabled={session.length === 0}
            >
              <Text style={styles.finishBtnText}>FINISH WORKOUT</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <View style={styles.historyCard}>
            <Text style={styles.historyLabel}>WORKOUT HISTORY</Text>
            {state.workouts.length === 0 ? (
              <Text style={styles.emptyText}>NO HISTORY YET</Text>
            ) : (
              [...state.workouts].reverse().map(w => (
                <View key={w.id} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>{new Date(w.date).toLocaleDateString()}</Text>
                    <Text style={styles.historyExCount}>{w.exercises.length} EXERCISES</Text>
                  </View>
                  <Text style={styles.historyCal}>{w.totalCalories} KCAL</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dark },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing['4xl'] },
  title: { fontFamily: fonts.bebas, fontSize: fontSizes['5xl'], color: colors.white, letterSpacing: 2 },
  subtitle: { fontFamily: fonts.mono, fontSize: fontSizes.xs, color: colors.lime, textTransform: 'uppercase', marginTop: 4, marginBottom: spacing.lg },

  filterScroll: { marginBottom: spacing.base },
  filterBtn: { paddingHorizontal: spacing.base, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.darkBorder, marginRight: spacing.xs },
  filterBtnActive: { backgroundColor: colors.white, borderColor: colors.white },
  filterText: { fontFamily: fonts.bebas, fontSize: fontSizes.sm, color: colors.grayDim, letterSpacing: 1 },
  filterTextActive: { color: colors.dark },

  libraryCard: { borderWidth: 1, borderColor: colors.darkBorder, marginBottom: spacing.xl },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.darkBorder },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  exerciseName: { fontFamily: fonts.bebas, fontSize: fontSizes.xl, color: colors.white },
  addedBadge: { backgroundColor: colors.lime, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2 },
  addedBadgeText: { fontFamily: fonts.mono, fontSize: 8, color: colors.dark, fontWeight: 'bold' },
  exerciseMeta: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayMuted, textTransform: 'uppercase' },
  addBtn: { width: 32, height: 32, borderWidth: 1, borderColor: colors.darkBorder, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  addBtnActive: { backgroundColor: colors.lime, borderColor: colors.lime },

  sessionCard: { backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.base, marginBottom: spacing.base },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.darkBorder, marginBottom: spacing.sm },
  sessionTitle: { fontFamily: fonts.bebas, fontSize: fontSizes['2xl'], color: colors.white },
  sessionCount: { fontFamily: fonts.bebas, fontSize: fontSizes.base, color: colors.lime },

  emptySession: { alignItems: 'center', paddingVertical: spacing['2xl'], opacity: 0.5 },
  emptyText: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayMuted, textTransform: 'uppercase', textAlign: 'center', marginTop: spacing.sm },

  sessionExercise: { backgroundColor: colors.darkSurface, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.sm, marginBottom: spacing.xs },
  sessionExerciseDone: { borderColor: 'rgba(204,255,0,0.3)', opacity: 0.7 },
  sessionExHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sessionExLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  checkBox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.grayMuted, alignItems: 'center', justifyContent: 'center' },
  checkBoxDone: { backgroundColor: colors.lime, borderColor: colors.lime },
  sessionExName: { fontFamily: fonts.bebas, fontSize: fontSizes.xl, color: colors.white },
  sessionExNameDone: { color: colors.grayMuted, textDecorationLine: 'line-through' },

  inputGrid: { flexDirection: 'row', gap: spacing.xs },
  inputLabel: { fontFamily: fonts.mono, fontSize: 7, color: colors.grayMuted, textTransform: 'uppercase', marginBottom: 2 },
  numInput: { backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.xs, fontFamily: fonts.mono, textAlign: 'center', fontSize: fontSizes.xs, color: colors.white },

  finishBtn: { backgroundColor: colors.lime, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.base },
  finishBtnDisabled: { opacity: 0.3 },
  finishBtnText: { fontFamily: fonts.bebas, fontSize: fontSizes.xl, color: colors.dark, letterSpacing: 2 },

  historyCard: { backgroundColor: colors.darkSurface, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.base, marginBottom: spacing.xl },
  historyLabel: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.sm, marginBottom: spacing.xs },
  historyDate: { fontFamily: fonts.mono, fontSize: 9, color: colors.grayMuted },
  historyExCount: { fontFamily: fonts.bebas, fontSize: fontSizes.base, color: colors.white },
  historyCal: { fontFamily: fonts.bebas, fontSize: fontSizes.base, color: colors.lime },
});
