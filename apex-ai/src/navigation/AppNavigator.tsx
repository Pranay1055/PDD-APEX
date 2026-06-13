import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Hero from '../components/Hero';
import BmiCalculator from '../components/BmiCalculator';
import WeightTracker from '../components/WeightTracker';
import DietPlanner from '../components/DietPlanner';
import WorkoutPlanner from '../components/WorkoutPlanner';
import AiRecommendations from '../components/AiRecommendations';
import Dashboard from '../components/Dashboard';
import { colors, fonts, fontSizes, spacing } from '../theme';

// ─── Route ↔ Screen mapping (mirrors web routes 1:1) ────────────────────────
//  /             → HomeTab      (Hero)
//  /bmi          → BmiTab       (BmiCalculator)
//  /weight       → WeightTab    (WeightTracker)
//  /diet         → DietTab      (DietPlanner)
//  /workout      → WorkoutTab   (WorkoutPlanner)
//  /ai           → AiTab        (AiRecommendations)
//  /dashboard    → DashTab      (Dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export type RootTabParamList = {
  HomeTab: undefined;
  BmiTab: undefined;
  WeightTab: undefined;
  DietTab: undefined;
  WorkoutTab: undefined;
  AiTab: undefined;
  DashTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const TAB_LINKS: {
  name: keyof RootTabParamList;
  label: string;
  icon: FeatherIconName;
  component: React.ComponentType<any>;
}[] = [
  { name: 'HomeTab',    label: 'Home',    icon: 'home',          component: Hero },
  { name: 'BmiTab',     label: 'BMI',     icon: 'activity',      component: BmiCalculator },
  { name: 'WeightTab',  label: 'Weight',  icon: 'trending-down', component: WeightTracker },
  { name: 'DietTab',    label: 'Diet',    icon: 'coffee',        component: DietPlanner },
  { name: 'WorkoutTab', label: 'Workout', icon: 'target',        component: WorkoutPlanner },
  { name: 'AiTab',      label: 'AI',      icon: 'zap',           component: AiRecommendations },
  { name: 'DashTab',    label: 'Dash',    icon: 'grid',          component: Dashboard },
];

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const link = TAB_LINKS.find(t => t.name === route.name)!;
        return {
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(5,5,5,0.95)',
            borderTopColor: colors.darkBorder,
            borderTopWidth: 1,
            height: 58 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 4,
          },
          tabBarActiveTintColor: colors.lime,
          tabBarInactiveTintColor: '#6b7280',
          tabBarLabelStyle: {
            fontFamily: fonts.mono,
            fontSize: 8,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            marginTop: 2,
          },
          tabBarIcon: ({ focused, color }) => (
            <Feather name={link.icon} size={18} color={color} />
          ),
          tabBarLabel: link.label,
        };
      }}
    >
      {TAB_LINKS.map(link => (
        <Tab.Screen
          key={link.name}
          name={link.name}
          component={link.component}
        />
      ))}
    </Tab.Navigator>
  );
}
