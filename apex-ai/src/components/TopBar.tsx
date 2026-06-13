import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { colors, fonts, fontSizes, spacing } from '../theme';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const { setProfileModalOpen, state } = useAppStore();

  return (
    <View 
      style={[styles.container, { paddingTop: insets.top + spacing.base }]}
      pointerEvents="box-none"
    >
      <Text style={styles.logo} pointerEvents="none">APEX</Text>
      
      {state.token && (
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => setProfileModalOpen(true)}
          activeOpacity={0.7}
        >
          <Feather name="user" size={18} color={colors.lime} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['3xl'],
    color: colors.lime,
    letterSpacing: 4,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
});
