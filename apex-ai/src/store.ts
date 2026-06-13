import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './constants';

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: string;
  date: string;
}

export interface ExerciseEntry {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number; // in mins
  completed: boolean;
  group?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: ExerciseEntry[];
  totalCalories: number;
}

export interface AppState {
  profile: {
    name: string;
    age: number;
    gender: 'M' | 'F';
    height: number;
    weight: number;
    targetWeight: number;
    unitSystem: 'metric' | 'imperial';
    bmi: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    calorieOffset: number;
    profileCompleted: boolean;
    beforePhoto: string | null;
    afterPhoto: string | null;
  };
  weightHistory: WeightEntry[];
  meals: MealEntry[];
  workouts: WorkoutSession[];
  profileModalOpen: boolean;
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    age: number;
  } | null;
}

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface DialogConfig {
  visible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
}

const defaultState: AppState = {
  profile: {
    name: '',
    age: 25,
    gender: 'M',
    height: 180,
    weight: 75,
    targetWeight: 75,
    unitSystem: 'metric',
    bmi: 23.1,
    activityLevel: 'moderate',
    calorieOffset: 500,
    profileCompleted: false,
    beforePhoto: null,
    afterPhoto: null,
  },
  weightHistory: [],
  meals: [],
  workouts: [],
  profileModalOpen: false, // Default false until auth succeeds
  token: null,
  user: null,
};

const STORAGE_KEY = 'apex_fitness_data';

export interface AppStoreContextType {
  state: AppState;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;
  dialogConfig: DialogConfig;
  setDialogConfig: (cfg: DialogConfig) => void;
  showAlert: (title: string, message: string, buttons?: DialogButton[]) => void;
  updateProfile: (profileUpdate: Partial<AppState['profile']>) => void;
  addWeightLog: (weight: number, date: string) => void;
  deleteWeightLog: (id: string) => void;
  addMeal: (meal: Omit<MealEntry, 'id'>) => void;
  deleteMeal: (id: string) => void;
  addWorkout: (workout: Omit<WorkoutSession, 'id'>) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, age: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });
  const [loaded, setLoaded] = useState(false);

  const profileModalOpen = state.profileModalOpen;
  const setProfileModalOpen = (open: boolean) => {
    setState(s => ({ ...s, profileModalOpen: open }));
  };

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(async (stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const mergedProfile = {
            ...defaultState.profile,
            ...parsed.profile,
          };
          const isCompleted = mergedProfile.profileCompleted;
          
          let updatedState = {
            ...defaultState,
            ...parsed,
            profile: mergedProfile,
            profileModalOpen: parsed.profileModalOpen !== undefined ? parsed.profileModalOpen : (!isCompleted && !!parsed.token),
          };

          // If there is a token, try to validate and sync from server
          if (parsed.token) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${parsed.token}`
                }
              });
              if (res.ok) {
                const data = await res.json();
                updatedState.user = data.user;
                if (data.profile) {
                  updatedState.profile = {
                    ...updatedState.profile,
                    ...data.profile,
                    profileCompleted: data.profile.profileCompleted ?? true
                  };
                }
              } else {
                // Token invalid/expired - clear token/user
                updatedState.token = null;
                updatedState.user = null;
              }
            } catch (err) {
              console.error("Auth status validation failed, using cached:", err);
            }
          }

          setState(updatedState);
        } catch {
          /* ignore parse errors */
        }
      }
      setLoaded(true);
    });
  }, []);

  // Persist whenever state changes
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, loaded]);

  const showAlert = (title: string, message: string, buttons?: DialogButton[]) => {
    setDialogConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
    });
  };

  const updateProfile = (profileUpdate: Partial<AppState['profile']>) => {
    setState(s => {
      const newProfile = { ...s.profile, ...profileUpdate } as AppState['profile'];

      let bmi = 0;
      if (newProfile.height > 0 && newProfile.weight > 0) {
        if (newProfile.unitSystem === 'metric') {
          bmi = newProfile.weight / Math.pow(newProfile.height / 100, 2);
        } else {
          bmi = (newProfile.weight / Math.pow(newProfile.height, 2)) * 703;
        }
      }

      const finalProfile = { ...newProfile, bmi: Number(bmi.toFixed(1)) };

      // Sync to backend in background if token is present
      if (s.token) {
        fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${s.token}`
          },
          body: JSON.stringify(finalProfile)
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            // Keep user name/age synchronized in state too
            setState(current => ({
              ...current,
              user: data.user
            }));
          }
        })
        .catch(err => console.error("Failed to sync profile with server:", err));
      }

      return { ...s, profile: finalProfile };
    });
  };

  const addWeightLog = (weight: number, date: string) => {
    setState(s => {
      const baseHistory = s.weightHistory.filter(w => w.date !== date);
      const newWeightHistory = [
        ...baseHistory,
        { id: Date.now().toString(), date, weight },
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const newProfile = { ...s.profile, weight } as AppState['profile'];
      let bmi = 0;
      if (newProfile.height > 0 && newProfile.weight > 0) {
        if (newProfile.unitSystem === 'metric') {
          bmi = newProfile.weight / Math.pow(newProfile.height / 100, 2);
        } else {
          bmi = (newProfile.weight / Math.pow(newProfile.height, 2)) * 703;
        }
      }
      newProfile.bmi = Number(bmi.toFixed(1));

      return {
        ...s,
        weightHistory: newWeightHistory,
        profile: newProfile,
      };
    });
  };

  const deleteWeightLog = (id: string) => {
    setState(s => ({ ...s, weightHistory: s.weightHistory.filter(w => w.id !== id) }));
  };

  const addMeal = (meal: Omit<MealEntry, 'id'>) => {
    setState(s => ({
      ...s,
      meals: [...s.meals, { ...meal, id: Date.now().toString() }],
    }));
  };

  const deleteMeal = (id: string) => {
    setState(s => ({ ...s, meals: s.meals.filter(m => m.id !== id) }));
  };

  const addWorkout = (workout: Omit<WorkoutSession, 'id'>) => {
    setState(s => ({
      ...s,
      workouts: [...s.workouts, { ...workout, id: Date.now().toString() }],
    }));
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login verification failed.' };
      }
      
      setState(s => {
        const mergedProfile = data.profile 
          ? { ...s.profile, ...data.profile, profileCompleted: data.profile.profileCompleted ?? true }
          : { ...s.profile, name: data.user.name, age: data.user.age };

        return {
          ...s,
          token: data.token,
          user: data.user,
          profile: mergedProfile,
          profileModalOpen: data.profile ? !data.profile.profileCompleted : true,
        };
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection to server failed.' };
    }
  };

  const register = async (email: string, password: string, name: string, age: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, age }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Account creation failed.' };
      }

      setState(s => ({
        ...s,
        token: data.token,
        user: data.user,
        profile: {
          ...s.profile,
          name: data.user.name,
          age: data.user.age,
          profileCompleted: false
        },
        profileModalOpen: true, // open profile modal to calibrate height/weight
      }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection to server failed.' };
    }
  };

  const logout = async () => {
    setState(s => ({
      ...s,
      token: null,
      user: null,
      profile: defaultState.profile,
      weightHistory: [],
      meals: [],
      workouts: [],
      profileModalOpen: false,
    }));
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!state.token) return { success: false, error: 'Not authenticated.' };
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Password update failed.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection to server failed.' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Password recovery failed.' };
      }
      return { success: true, message: data.message + (data.resetCode ? `\nCode: ${data.resetCode}` : '') };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection to server failed.' };
    }
  };

  return React.createElement(AppStoreContext.Provider, {
    value: {
      state,
      profileModalOpen,
      setProfileModalOpen,
      dialogConfig,
      setDialogConfig,
      showAlert,
      updateProfile,
      addWeightLog,
      deleteWeightLog,
      addMeal,
      deleteMeal,
      addWorkout,
      login,
      register,
      logout,
      changePassword,
      forgotPassword,
    }
  }, children);
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
}
