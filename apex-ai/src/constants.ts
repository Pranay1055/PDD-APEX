export const EXERCISES = [
  { name: 'Bench Press', group: 'Strength', sets: 3, reps: 10, duration: 15 },
  { name: 'Squats', group: 'Strength', sets: 3, reps: 10, duration: 15 },
  { name: 'Deadlift', group: 'Strength', sets: 3, reps: 8, duration: 20 },
  { name: 'Pull-ups', group: 'Strength', sets: 3, reps: 8, duration: 10 },
  { name: 'Treadmill Run', group: 'Cardio', sets: 1, reps: 1, duration: 30 },
  { name: 'Cycling', group: 'Cardio', sets: 1, reps: 1, duration: 45 },
  { name: 'Jump Rope', group: 'Cardio', sets: 1, reps: 1, duration: 10 },
  { name: 'Yoga Flow', group: 'Flexibility', sets: 1, reps: 1, duration: 20 },
  { name: 'Stretching', group: 'Flexibility', sets: 1, reps: 1, duration: 15 },
  { name: 'Burpees', group: 'HIIT', sets: 4, reps: 15, duration: 10 },
  { name: 'Mountain Climbers', group: 'HIIT', sets: 4, reps: 20, duration: 5 },
  { name: 'Kettlebell Swings', group: 'HIIT', sets: 4, reps: 15, duration: 10 },
  { name: 'Bicep Curls', group: 'Strength', sets: 3, reps: 12, duration: 10 },
  { name: 'Tricep Dips', group: 'Strength', sets: 3, reps: 12, duration: 10 },
  { name: 'Leg Press', group: 'Strength', sets: 3, reps: 12, duration: 15 },
];

export const BMI_CATEGORIES = [
  { max: 18.5, label: 'Underweight', color: '#3b82f6' },
  { max: 24.9, label: 'Normal', color: '#22c55e' },
  { max: 29.9, label: 'Overweight', color: '#facc15' },
  { max: 100, label: 'Obese', color: '#ef4444' },
];

import { Platform } from 'react-native';


export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

