import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store';
import { colors, fonts, spacing, fontSizes } from '../theme';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'SEDENTARY (LITTLE/NO EXERCISE)', multiplier: 1.2 },
  { value: 'light', label: 'LIGHT ACTIVE (EXERCISE 1-3 DAYS/WK)', multiplier: 1.375 },
  { value: 'moderate', label: 'MODERATE ACTIVE (EXERCISE 3-5 DAYS/WK)', multiplier: 1.55 },
  { value: 'active', label: 'VERY ACTIVE (EXERCISE 6-7 DAYS/WK)', multiplier: 1.725 },
  { value: 'very_active', label: 'EXTRA ACTIVE (PHYSICAL JOB & EXERCISE)', multiplier: 1.9 },
] as const;

export default function ProfileModal() {
  const { state, profileModalOpen, setProfileModalOpen, updateProfile, addWeightLog, showAlert, logout, changePassword } = useAppStore();
  const profile = state.profile;

  const isMandatory = !profile.profileCompleted;
  const isVisible = profileModalOpen;

  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(String(profile.age || ''));
  const [gender, setGender] = useState<'M' | 'F'>(profile.gender || 'M');
  const [height, setHeight] = useState(String(profile.height || ''));
  const [weight, setWeight] = useState(String(profile.weight || ''));
  const [targetWeight, setTargetWeight] = useState(String(profile.targetWeight || profile.weight || ''));
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel || 'moderate');
  const [weeklyGoalKg, setWeeklyGoalKg] = useState(String((profile.calorieOffset || 500) / 1000));
  const [beforePhoto, setBeforePhoto] = useState<string | null>(profile.beforePhoto || null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(profile.afterPhoto || null);
  
  const [showActivityPicker, setShowActivityPicker] = useState(false);

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Sync state with profile when it opens
  useEffect(() => {
    if (isVisible) {
      setName(profile.name);
      setAge(String(profile.age || ''));
      setGender(profile.gender || 'M');
      setHeight(String(profile.height || ''));
      setWeight(String(profile.weight || ''));
      setTargetWeight(String(profile.targetWeight || profile.weight || ''));
      setActivityLevel(profile.activityLevel || 'moderate');
      setWeeklyGoalKg(String((profile.calorieOffset || 500) / 1000));
      setBeforePhoto(profile.beforePhoto || null);
      setAfterPhoto(profile.afterPhoto || null);
      
      // Reset password fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    }
  }, [isVisible, profile]);

  const captureFromCamera = async (type: 'before' | 'after') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permission required', 'Permission to access camera is required to capture progress photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        if (type === 'before') {
          setBeforePhoto(selectedUri);
        } else {
          setAfterPhoto(selectedUri);
        }
      }
    } catch (err) {
      showAlert('Capture Failed', 'Failed to capture image.');
    }
  };

  const pickFromGallery = async (type: 'before' | 'after') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permission required', 'Permission to access camera roll is required to select progress photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        if (type === 'before') {
          setBeforePhoto(selectedUri);
        } else {
          setAfterPhoto(selectedUri);
        }
      }
    } catch (err) {
      showAlert('Selection Failed', 'Failed to select image.');
    }
  };

  const pickImage = (type: 'before' | 'after') => {
    showAlert('Select Source', 'Choose image source for telemetry calibration:', [
      { text: 'Take Photo', onPress: () => captureFromCamera(type) },
      { text: 'Choose Gallery', onPress: () => pickFromGallery(type) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert('Credential Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Credential Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Credential Error', 'Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    const res = await changePassword(oldPassword, newPassword);
    setChangingPassword(false);

    if (res.success) {
      showAlert('Credentials Calibrated', 'Security password successfully modified.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } else {
      showAlert('Security Rejection', res.error || 'Failed to modify credentials.');
    }
  };

  const handleLogout = () => {
    showAlert('System Shutdown', 'Are you sure you want to terminate this session?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Terminate (Log Out)', 
        style: 'destructive', 
        onPress: () => {
          logout();
          setProfileModalOpen(false);
        } 
      }
    ]);
  };

  const handleSave = () => {
    const ageNum = Number(age);
    const heightNum = Number(height);
    const weightNum = Number(weight);
    const targetWeightNum = Number(targetWeight);
    
    const goalKgNum = Number(weeklyGoalKg);
    if (isNaN(goalKgNum) || goalKgNum < 0.1 || goalKgNum > 1.5) {
      showAlert('Invalid Input', 'Please enter a valid weekly target rate between 0.1 and 1.5 kg.');
      return;
    }
    const offsetNum = Math.round(goalKgNum * 1000);

    if (!name.trim()) {
      showAlert('Invalid Input', 'Please enter your name.');
      return;
    }
    if (isNaN(ageNum) || ageNum <= 0) {
      showAlert('Invalid Input', 'Please enter a valid age.');
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      showAlert('Invalid Input', 'Please enter a valid height in cm.');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      showAlert('Invalid Input', 'Please enter a valid weight in kg.');
      return;
    }
    if (isNaN(targetWeightNum) || targetWeightNum <= 0 || targetWeightNum > 700) {
      showAlert('Invalid Input', 'Please enter a valid target weight in kg (1-700).');
      return;
    }

    // Save profile metadata
    updateProfile({
      name: name.trim(),
      age: ageNum,
      gender,
      height: heightNum,
      weight: weightNum,
      targetWeight: targetWeightNum,
      activityLevel,
      calorieOffset: offsetNum,
      profileCompleted: true,
      beforePhoto,
      afterPhoto,
    });

    const getLocalDateString = (date: Date = new Date()) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const todayStr = getLocalDateString();
    addWeightLog(weightNum, todayStr);

    // Close modal
    setProfileModalOpen(false);
  };

  const selectedActivity = ACTIVITY_OPTIONS.find(o => o.value === activityLevel) || ACTIVITY_OPTIONS[2];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setProfileModalOpen(false);
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.title}>{isMandatory ? 'SYSTEM INITIALIZATION' : 'PROFILE EDIT'}</Text>
                <Text style={styles.subtitle}>
                  {state.user 
                    ? `OPERATOR: ${state.user.name.toUpperCase()} (${state.user.email.toLowerCase()})` 
                    : (isMandatory ? 'Establish your vital telemetry baseline.' : 'Calibrate your system metrics.')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProfileModalOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Name Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="CODENAME / REAL NAME"
                  placeholderTextColor={colors.grayMuted}
                  selectionColor={colors.lime}
                />
              </View>

              {/* Age & Sex Grid */}
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>AGE</Text>
                  <TextInput
                    style={styles.input}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor={colors.grayMuted}
                    selectionColor={colors.lime}
                  />
                </View>

                <View style={styles.halfField}>
                  <Text style={styles.label}>BIOLOGICAL SEX</Text>
                  <View style={styles.genderRow}>
                    {(['M', 'F'] as const).map(g => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                        onPress={() => setGender(g)}
                      >
                        <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                          {g === 'M' ? 'MALE' : 'FEMALE'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Height Field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>HEIGHT (CM)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="180"
                  placeholderTextColor={colors.grayMuted}
                  selectionColor={colors.lime}
                />
              </View>

              {/* Weight Grid */}
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>CURRENT WEIGHT (KG)</Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="75.0"
                    placeholderTextColor={colors.grayMuted}
                    selectionColor={colors.lime}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>TARGET WEIGHT (KG)</Text>
                  <TextInput
                    style={styles.input}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="numeric"
                    placeholder="75.0"
                    placeholderTextColor={colors.grayMuted}
                    selectionColor={colors.lime}
                  />
                </View>
              </View>

              {/* Activity Level Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>ACTIVITY MULTIPLIER</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setShowActivityPicker(!showActivityPicker)}
                >
                  <Text style={styles.dropdownValue}>{selectedActivity.label}</Text>
                  <Feather
                    name={showActivityPicker ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.lime}
                  />
                </TouchableOpacity>

                {showActivityPicker && (
                  <View style={styles.dropdownOptions}>
                    {ACTIVITY_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.dropdownOption,
                          activityLevel === opt.value && styles.dropdownOptionActive,
                        ]}
                        onPress={() => {
                          setActivityLevel(opt.value);
                          setShowActivityPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            activityLevel === opt.value && styles.dropdownOptionTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Weekly target weight rate */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>WEEKLY TARGET WEIGHT CHANGE RATE (KG)</Text>
                <Text style={styles.hint}>TARGET WEEKLY RATE FOR GAIN OR LOSS (E.G., 0.50 KG)</Text>
                <TextInput
                  style={styles.input}
                  value={weeklyGoalKg}
                  onChangeText={setWeeklyGoalKg}
                  keyboardType="numeric"
                  placeholder="0.50"
                  placeholderTextColor={colors.grayMuted}
                  selectionColor={colors.lime}
                />
              </View>

              {/* Visual Progress Section */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>VISUAL TELEMETRY BASES (BEFORE / AFTER)</Text>
                <Text style={styles.hint}>CALIBRATE BODY RECOMPOSITION PROGRESS PHOTOMETRICS</Text>
                <View style={styles.photoContainer}>
                  
                  {/* Before Photo Card */}
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoSlotLabel}>BEFORE / BASELINE</Text>
                    <TouchableOpacity 
                      style={[styles.photoButton, beforePhoto && styles.photoButtonWithImage]}
                      onPress={() => pickImage('before')}
                      activeOpacity={0.7}
                    >
                      {beforePhoto ? (
                        <Image source={{ uri: beforePhoto }} style={styles.photoPreview} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Feather name="image" size={24} color={colors.grayMuted} />
                          <Text style={styles.photoBtnText}>CHOOSE PHOTO</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {beforePhoto && (
                      <TouchableOpacity 
                        style={styles.photoDeleteBtn}
                        onPress={() => setBeforePhoto(null)}
                        activeOpacity={0.7}
                      >
                        <Feather name="trash-2" size={12} color={colors.redMuted} />
                        <Text style={styles.photoDeleteText}>CLEAR</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* After Photo Card */}
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoSlotLabel}>AFTER / MILESTONE</Text>
                    <TouchableOpacity 
                      style={[styles.photoButton, afterPhoto && styles.photoButtonWithImage]}
                      onPress={() => pickImage('after')}
                      activeOpacity={0.7}
                    >
                      {afterPhoto ? (
                        <Image source={{ uri: afterPhoto }} style={styles.photoPreview} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Feather name="trending-up" size={24} color={colors.grayMuted} />
                          <Text style={styles.photoBtnText}>CHOOSE PHOTO</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {afterPhoto && (
                      <TouchableOpacity 
                        style={styles.photoDeleteBtn}
                        onPress={() => setAfterPhoto(null)}
                        activeOpacity={0.7}
                      >
                        <Feather name="trash-2" size={12} color={colors.redMuted} />
                        <Text style={styles.photoDeleteText}>CLEAR</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>CALIBRATE & ENGAGE</Text>
              </TouchableOpacity>

              {/* Security Credentials & Action Settings */}
              {!isMandatory && (
                <View style={styles.separator} />
              )}

              {!isMandatory && (
                <View style={styles.fieldGroup}>
                  <TouchableOpacity 
                    style={styles.secBtn} 
                    onPress={() => setShowChangePassword(!showChangePassword)}
                    activeOpacity={0.7}
                  >
                    <Feather name="shield" size={14} color={colors.lime} />
                    <Text style={styles.secBtnText}>
                      {showChangePassword ? 'HIDE CREDENTIALS CALIBRATION' : 'MODIFY SECURITY CREDENTIALS'}
                    </Text>
                  </TouchableOpacity>

                  {showChangePassword && (
                    <View style={styles.changePassContainer}>
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>CURRENT PASSWORD</Text>
                        <TextInput
                          style={styles.input}
                          value={oldPassword}
                          onChangeText={setOldPassword}
                          secureTextEntry
                          placeholder="••••••••"
                          placeholderTextColor={colors.grayMuted}
                          selectionColor={colors.lime}
                        />
                      </View>
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>NEW PASSWORD</Text>
                        <TextInput
                          style={styles.input}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                          placeholder="MINIMUM 6 CHARACTERS"
                          placeholderTextColor={colors.grayMuted}
                          selectionColor={colors.lime}
                        />
                      </View>
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                        <TextInput
                          style={styles.input}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
                          placeholder="RE-ENTER PASSWORD"
                          placeholderTextColor={colors.grayMuted}
                          selectionColor={colors.lime}
                        />
                      </View>
                      <TouchableOpacity 
                        style={styles.secSubmitBtn} 
                        onPress={handleChangePassword}
                        disabled={changingPassword}
                        activeOpacity={0.8}
                      >
                        {changingPassword ? (
                          <ActivityIndicator color={colors.dark} size="small" />
                        ) : (
                          <Text style={styles.secSubmitBtnText}>COMMIT CREDENTIALS UPDATE</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Feather name="log-out" size={14} color={colors.redMuted} />
                <Text style={styles.logoutBtnText}>TERMINATE SESSION (LOGOUT)</Text>
              </TouchableOpacity>
            </ScrollView>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: spacing.base,
  },
  modalContent: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 8,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['3xl'],
    color: colors.lime,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['2xs'],
    color: colors.grayMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
  },
  scrollContainer: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  fieldGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  halfField: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSizes['2xs'],
    color: colors.grayDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hint: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    color: colors.white,
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    borderRadius: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    borderRadius: 4,
  },
  genderBtnActive: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  genderBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    color: colors.white,
    letterSpacing: 1,
  },
  genderBtnTextActive: {
    color: colors.dark,
  },
  dropdownTrigger: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 4,
  },
  dropdownValue: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  dropdownOptions: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  dropdownOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
  },
  dropdownOptionText: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.xs,
    color: colors.grayDim,
  },
  dropdownOptionTextActive: {
    color: colors.lime,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: colors.lime,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  saveBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.xl,
    color: colors.dark,
    letterSpacing: 2,
  },
  photoContainer: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: 4,
  },
  photoSlot: {
    flex: 1,
    gap: spacing.xs,
    alignItems: 'center',
  },
  photoSlotLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.grayDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  photoButton: {
    width: '100%',
    height: 200,
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  photoButtonWithImage: {
    borderStyle: 'solid',
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoBtnText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.grayMuted,
    textTransform: 'uppercase',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  photoDeleteText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.redMuted,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: colors.darkBorder,
    marginVertical: spacing.sm,
  },
  secBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    backgroundColor: colors.darkSurface,
    justifyContent: 'center',
    borderRadius: 4,
  },
  secBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.sm,
    color: colors.lime,
    letterSpacing: 1.5,
  },
  changePassContainer: {
    marginTop: spacing.sm,
    gap: spacing.base,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    padding: spacing.base,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  secSubmitBtn: {
    backgroundColor: colors.lime,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  secSubmitBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    color: colors.dark,
    letterSpacing: 1.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.red,
    justifyContent: 'center',
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  logoutBtnText: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    color: colors.redMuted,
    letterSpacing: 1.5,
  },
});
