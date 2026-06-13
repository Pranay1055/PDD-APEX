import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppStore } from '../store';
import { colors, fonts, spacing, fontSizes } from '../theme';

type AuthTab = 'login' | 'register' | 'forgot';

export default function AuthScreen() {
  const { login, register, forgotPassword, showAlert } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const handleAuthAction = async () => {
    // Basic Validation
    if (!email.trim() || !email.includes('@')) {
      showAlert('Security Alert', 'Please enter a valid email address.');
      return;
    }

    if (activeTab === 'forgot') {
      setLoading(true);
      const res = await forgotPassword(email.trim());
      setLoading(false);
      if (res.success) {
        showAlert('Recovery Matrix', res.message || 'Recovery instructions launched.');
        setActiveTab('login');
      } else {
        showAlert('Protocol Failed', res.error || 'Password recovery failed.');
      }
      return;
    }

    if (!password || password.length < 6) {
      showAlert('Security Alert', 'Password must be at least 6 characters.');
      return;
    }

    if (activeTab === 'register') {
      if (!name.trim()) {
        showAlert('Security Alert', 'Please enter your name.');
        return;
      }
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        showAlert('Security Alert', 'Please enter a valid age metric.');
        return;
      }

      setLoading(true);
      const res = await register(email.trim(), password, name.trim(), ageNum);
      setLoading(false);
      if (!res.success) {
        showAlert('Registration Refused', res.error || 'Failed to establish profile.');
      }
    } else {
      setLoading(true);
      const res = await login(email.trim(), password);
      setLoading(false);
      if (!res.success) {
        showAlert('Authentication Refused', res.error || 'Invalid user parameters.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header HUD branding */}
        <View style={styles.brandingHeader}>
          <Text style={styles.brandingLogo}>APEX</Text>
          <View style={styles.hudSubline}>
            <View style={styles.hudIndicator} />
            <Text style={styles.brandingSlogan}>TACTICAL TELEMETRY PORTAL</Text>
          </View>
        </View>

        {/* Card Body with Glassmorphism / Dark Panel Styling */}
        <View style={styles.authPanel}>
          {activeTab !== 'forgot' ? (
            /* Tabs Header */
            <View style={styles.tabHeader}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'login' && styles.tabActive]}
                onPress={() => {
                  setActiveTab('login');
                  setPassword('');
                }}
                disabled={loading}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                  SIGN IN
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'register' && styles.tabActive]}
                onPress={() => {
                  setActiveTab('register');
                  setPassword('');
                }}
                disabled={loading}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                  CREATE ACCOUNT
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Forgot Mode Header */
            <View style={styles.forgotHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setActiveTab('login')}
                disabled={loading}
              >
                <Feather name="arrow-left" size={16} color={colors.lime} />
                <Text style={styles.backButtonText}>BACK TO LOGIN</Text>
              </TouchableOpacity>
              <Text style={styles.panelTitle}>RECOVER KEY CREDENTIALS</Text>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.formContent}>
            
            {activeTab === 'register' && (
              <>
                {/* Full Name field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL CODENAME / NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="user" size={16} color={colors.grayMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ENTER NAME"
                      placeholderTextColor={colors.grayMuted}
                      value={name}
                      onChangeText={setName}
                      selectionColor={colors.lime}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Age field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>AGE METRIC</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="activity" size={16} color={colors.grayMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="ENTER AGE (E.G. 25)"
                      placeholderTextColor={colors.grayMuted}
                      keyboardType="numeric"
                      value={age}
                      onChangeText={setAge}
                      selectionColor={colors.lime}
                      editable={!loading}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={16} color={colors.grayMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="USER@DOMAIN.COM"
                  placeholderTextColor={colors.grayMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  selectionColor={colors.lime}
                  editable={!loading}
                />
              </View>
            </View>

            {activeTab !== 'forgot' && (
              /* Password Field */
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>SECURITY PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={16} color={colors.grayMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { paddingRight: 45 }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.grayMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                    selectionColor={colors.lime}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={16} 
                      color={colors.lime} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'login' && (
              /* Forgot password trigger */
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => setActiveTab('forgot')}
                disabled={loading}
              >
                <Text style={styles.forgotBtnText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Action Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleAuthAction}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.dark} size="small" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {activeTab === 'login' 
                    ? 'AUTHORIZE LOGIN' 
                    : activeTab === 'register' 
                      ? 'EXECUTE REGISTRATION' 
                      : 'REQUEST RECOVERY KEY'}
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </View>

        {/* Footer legalities */}
        <Text style={styles.footerLegal}>
          APEX CYBERNETICS SECURITY COMPLIANT • v1.1.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingTop: 60,
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  brandingLogo: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['7xl'],
    color: colors.lime,
    letterSpacing: 8,
    textShadowColor: 'rgba(204, 255, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  hudSubline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
  },
  hudIndicator: {
    width: 6,
    height: 6,
    backgroundColor: colors.lime,
    borderRadius: 999,
  },
  brandingSlogan: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayDim,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  authPanel: {
    backgroundColor: colors.darker,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.lime,
    backgroundColor: colors.darker,
  },
  tabText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    color: colors.grayMuted,
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: colors.lime,
  },
  forgotHeader: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
    gap: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.lime,
    letterSpacing: 1,
  },
  panelTitle: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.lg,
    color: colors.white,
    letterSpacing: 1,
  },
  formContent: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayDim,
    letterSpacing: 1.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    height: 48,
    position: 'relative',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: colors.white,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
  },
  eyeToggle: {
    position: 'absolute',
    right: spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotBtnText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    letterSpacing: 1,
  },
  actionBtn: {
    backgroundColor: colors.lime,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  actionBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.lg,
    color: colors.dark,
    letterSpacing: 2,
  },
  footerLegal: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: spacing.xl,
    textTransform: 'uppercase',
  },
});
