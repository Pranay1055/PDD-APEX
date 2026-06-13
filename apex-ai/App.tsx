import 'react-native-gesture-handler'; // must be first import
import React from 'react';
import { View, StatusBar, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/components/AuthScreen';
import TopBar from './src/components/TopBar';
import ProfileModal from './src/components/ProfileModal';
import ThemedDialog from './src/components/ThemedDialog';
import { AppStoreProvider, useAppStore } from './src/store';
import { colors } from './src/theme';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null; // keep splash screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStoreProvider>
          <AppContent onLayoutRootView={onLayoutRootView} />
        </AppStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  const { state } = useAppStore();

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.dark}
        translucent={false}
      />

      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.lime,
            background: colors.dark,
            card: colors.darker,
            text: '#ffffff',
            border: colors.darkBorder,
            notification: colors.lime,
          },
          fonts: {
            regular: { fontFamily: 'DMSans_400Regular', fontWeight: '400' },
            medium: { fontFamily: 'DMSans_500Medium', fontWeight: '500' },
            bold: { fontFamily: 'DMSans_400Regular', fontWeight: '700' },
            heavy: { fontFamily: 'BebasNeue_400Regular', fontWeight: '400' },
          },
        }}
      >
        {/* APEX logo overlaid on every screen — matches web TopBar */}
        <TopBar />
        {state.token ? <AppNavigator /> : <AuthScreen />}
        <ProfileModal />
        <ThemedDialog />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },
});
