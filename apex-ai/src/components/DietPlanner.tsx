import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { API_BASE_URL } from '../constants';
import { colors, fonts, spacing, fontSizes } from '../theme';

function calcCalorieGoal(profile: { age: number; weight: number; targetWeight?: number; height: number; gender: string; unitSystem?: 'metric' | 'imperial' }): number {
  const { age, weight, targetWeight, height, gender, unitSystem } = profile;
  const wKg = unitSystem === 'imperial' ? weight * 0.453592 : weight;
  const hCm = unitSystem === 'imperial' ? height * 2.54 : height;
  const bmr = gender === 'F'
    ? (10 * wKg) + (6.25 * hCm) - (5 * age) - 161
    : (10 * wKg) + (6.25 * hCm) - (5 * age) + 5;
  
  let maintenance = bmr * 1.55;
  
  // Adjust based on goal weight
  if (targetWeight && targetWeight > 0) {
    const wDiff = targetWeight - weight;
    if (wDiff < -1) {
      maintenance -= 500; // deficit
    } else if (wDiff > 1) {
      maintenance += 400; // surplus
    }
  }

  const goal = Math.round(maintenance);
  return Math.min(4000, Math.max(1200, goal));
}

const MEAL_FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function DietPlanner() {
  const { state, addMeal, deleteMeal, showAlert } = useAppStore();
  const CALORIE_GOAL = calcCalorieGoal(state.profile);
  const [nlInput, setNlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [isParsing, setIsParsing] = useState(false);
  const [filter, setFilter] = useState('All');

  const getLocalDateString = (date: Date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = getLocalDateString();
  const todaysMeals = state.meals.filter(m => m.date === todayStr);
  const filteredMeals = filter === 'All' ? todaysMeals : todaysMeals.filter(m => m.mealType === filter);

  const totals = todaysMeals.reduce(
    (acc, m) => ({ cal: acc.cal + m.calories, pro: acc.pro + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { cal: 0, pro: 0, carbs: 0, fat: 0 }
  );

  const handleParseMeal = async () => {
    if (!nlInput) return;
    setIsParsing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/parse-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlInput }),
      });
      const data = await res.json();
      if (data.isValidFood === false || data.name === 'invalid') {
        showAlert('Invalid Input', 'Please enter a valid meal description or food item.');
      } else if (data.name) {
        addMeal({
          name: data.name,
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          mealType: selectedCategory,
          date: todayStr,
        });
        setNlInput('');
      } else {
        showAlert('Error', data.error || 'Failed to parse meal details. Check server or key.');
      }
    } catch (e) {
      showAlert('Connection Issue', 'The server is currently unavailable. Please try again after some time.');
    } finally {
      setIsParsing(false);
    }
  };

  const protoPct = Math.min((totals.pro * 4 / CALORIE_GOAL) * 100, 100);
  const carbsPct = Math.min((totals.carbs * 4 / CALORIE_GOAL) * 100, 100);
  const fatPct = Math.min((totals.fat * 9 / CALORIE_GOAL) * 100, 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={filteredMeals}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={
            <View style={styles.content}>
              {/* Header */}
              <Text style={styles.title}>DIET PLANNER</Text>
              <Text style={styles.titleAccent}>Fuel the machine.</Text>

              {/* AI Logging */}
              <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <Feather name="zap" size={18} color={colors.lime} />
                  <Text style={styles.aiTitle}> AI LOGGING</Text>
                </View>
                <Text style={styles.aiSubtitle}>TYPE NATURALLY. WE CALCULATE THE REST.</Text>
                <TextInput
                  style={styles.textarea}
                  value={nlInput}
                  onChangeText={setNlInput}
                  placeholder="e.g. 3 scrambled eggs with 2 slices of whole wheat toast..."
                  placeholderTextColor={colors.grayMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  selectionColor={colors.lime}
                />

                <Text style={styles.sectionLabel}>LOG AS MEAL TYPE</Text>
                <View style={styles.categoryPicker}>
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catPickerBtn,
                        selectedCategory === cat && styles.catPickerBtnActive,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.catPickerText,
                          selectedCategory === cat && styles.catPickerTextActive,
                        ]}
                      >
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.logBtn, (!nlInput || isParsing) && styles.logBtnDisabled]}
                  onPress={handleParseMeal}
                  disabled={isParsing || !nlInput}
                >
                  {isParsing ? (
                    <ActivityIndicator color={colors.dark} size="small" />
                  ) : (
                    <Text style={styles.logBtnText}>LOG MEAL</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Daily Fuel */}
              <View style={styles.fuelCard}>
                <Text style={styles.cardTitle}>DAILY FUEL</Text>
                <View style={styles.calRow}>
                  <Text style={styles.calVal}>{totals.cal}</Text>
                  <Text style={styles.calGoal}>/ {CALORIE_GOAL} KCAL</Text>
                </View>

                {/* Stacked bar */}
                <View style={styles.macroBar}>
                  <View style={[styles.macroBarSegment, { width: `${protoPct}%`, backgroundColor: colors.blue }]} />
                  <View style={[styles.macroBarSegment, { width: `${carbsPct}%`, backgroundColor: colors.yellow }]} />
                  <View style={[styles.macroBarSegment, { width: `${fatPct}%`, backgroundColor: colors.redMuted }]} />
                </View>

                <View style={styles.macroRow}>
                  {[
                    { label: 'PRO', val: totals.pro, color: colors.blue },
                    { label: 'CARB', val: totals.carbs, color: colors.yellow },
                    { label: 'FAT', val: totals.fat, color: colors.redMuted },
                  ].map(m => (
                    <View key={m.label} style={styles.macroItem}>
                      <Text style={[styles.macroLabel, { color: m.color }]}>{m.label}</Text>
                      <Text style={styles.macroVal}>{m.val}g</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Filter tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {MEAL_FILTERS.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                      {f.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {filteredMeals.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>NO MEALS LOGGED FOR THIS CATEGORY TODAY.</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.mealCard}>
              <View style={styles.mealTypeBadge}>
                <Text style={styles.mealTypeText}>{item.mealType}</Text>
              </View>
              <Text style={styles.mealName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.mealCal}>{item.calories} KCAL</Text>
              <View style={styles.mealMacros}>
                <Text style={styles.mealMacroText}>P: <Text style={{ color: colors.white }}>{item.protein}g</Text></Text>
                <Text style={styles.mealMacroText}>C: <Text style={{ color: colors.white }}>{item.carbs}g</Text></Text>
                <Text style={styles.mealMacroText}>F: <Text style={{ color: colors.white }}>{item.fat}g</Text></Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  showAlert('Delete', 'Remove this meal?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMeal(item.id) },
                  ]);
                }}
              >
                <Feather name="trash-2" size={14} color={colors.redMuted} />
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darker },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing['4xl'] },
  title: { fontFamily: fonts.bebas, fontSize: fontSizes['5xl'], color: colors.white, letterSpacing: 2 },
  titleAccent: { fontFamily: fonts.mono, fontSize: fontSizes.xs, color: colors.lime, textTransform: 'uppercase', marginTop: 4, marginBottom: spacing.xl },

  aiCard: { backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.base, marginBottom: spacing.base },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aiTitle: { fontFamily: fonts.bebas, fontSize: fontSizes['2xl'], color: colors.lime },
  aiSubtitle: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayMuted, textTransform: 'uppercase', marginBottom: spacing.sm },
  textarea: { backgroundColor: colors.darkSurface, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.sm, color: colors.white, fontFamily: fonts.sans, fontSize: fontSizes.sm, minHeight: 80, marginBottom: spacing.sm },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 8, color: colors.grayMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  categoryPicker: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.base },
  catPickerBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: colors.darkBorder, backgroundColor: colors.darkSurface, alignItems: 'center', borderRadius: 4 },
  catPickerBtnActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  catPickerText: { fontFamily: fonts.bebas, fontSize: fontSizes.xs, color: colors.grayDim, letterSpacing: 1 },
  catPickerTextActive: { color: colors.dark },
  logBtn: { backgroundColor: colors.lime, paddingVertical: spacing.sm, alignItems: 'center' },
  logBtnDisabled: { opacity: 0.5 },
  logBtnText: { fontFamily: fonts.bebas, fontSize: fontSizes.xl, color: colors.dark, letterSpacing: 2 },

  fuelCard: { backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.base, marginBottom: spacing.base },
  cardTitle: { fontFamily: fonts.bebas, fontSize: fontSizes['2xl'], color: colors.white, marginBottom: spacing.sm },
  calRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
  calVal: { fontFamily: fonts.bebas, fontSize: fontSizes['4xl'], color: colors.lime, letterSpacing: 2 },
  calGoal: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayMuted, marginLeft: spacing.xs },
  macroBar: { flexDirection: 'row', height: 10, backgroundColor: colors.darkSurface, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.base },
  macroBarSegment: { height: '100%' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroLabel: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], textTransform: 'uppercase', marginBottom: 2 },
  macroVal: { fontFamily: fonts.sans, fontSize: fontSizes.sm, color: colors.white },

  filterScroll: { marginBottom: spacing.base },
  filterBtn: { paddingHorizontal: spacing.base, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.darkBorder, marginRight: spacing.xs },
  filterBtnActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  filterText: { fontFamily: fonts.bebas, fontSize: fontSizes.base, color: colors.white, letterSpacing: 1 },
  filterTextActive: { color: colors.dark },

  emptyState: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.darkBorder, paddingVertical: spacing['3xl'], alignItems: 'center', marginBottom: spacing.base },
  emptyText: { fontFamily: fonts.mono, fontSize: fontSizes.xs, color: colors.grayMuted, textTransform: 'uppercase' },

  mealCard: { backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.darkBorder, padding: spacing.base, marginHorizontal: spacing.base, marginBottom: spacing.sm, position: 'relative' },
  mealTypeBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.lime, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  mealTypeText: { fontFamily: fonts.bebas, fontSize: fontSizes.xs, color: colors.dark },
  mealName: { fontFamily: fonts.bebas, fontSize: fontSizes.xl, color: colors.white, marginTop: spacing.sm, marginBottom: 4, paddingRight: spacing['3xl'] },
  mealCal: { fontFamily: fonts.bebas, fontSize: fontSizes['3xl'], color: colors.lime, marginBottom: spacing.xs },
  mealMacros: { flexDirection: 'row', gap: spacing.base },
  mealMacroText: { fontFamily: fonts.mono, fontSize: fontSizes['2xs'], color: colors.grayDim, textTransform: 'uppercase' },
  deleteBtn: { position: 'absolute', bottom: spacing.sm, right: spacing.sm },
});
