import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAppStore } from '../store';
import { colors, fonts, spacing, fontSizes } from '../theme';

export default function ThemedDialog() {
  const { dialogConfig, setDialogConfig } = useAppStore();

  if (!dialogConfig.visible) return null;

  const handleButtonPress = (onPress?: () => void) => {
    // Close dialog
    setDialogConfig({ ...dialogConfig, visible: false });
    // Execute callback
    if (onPress) onPress();
  };

  const isMultiButton = dialogConfig.buttons.length === 2;

  return (
    <Modal
      visible={dialogConfig.visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setDialogConfig({ ...dialogConfig, visible: false })}
    >
      <View style={styles.overlay}>
        <View style={styles.alertCard}>
          {/* Top subtle lime accent bar */}
          <View style={styles.accentBar} />
          
          {/* Title */}
          {dialogConfig.title ? (
            <Text style={styles.title}>{dialogConfig.title.toUpperCase()}</Text>
          ) : null}

          {/* Message */}
          <Text style={styles.message}>{dialogConfig.message}</Text>

          {/* Buttons Layout */}
          <View style={[styles.buttonContainer, isMultiButton ? styles.rowLayout : styles.columnLayout]}>
            {dialogConfig.buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              let btnStyle = styles.defaultBtn;
              let txtStyle = styles.defaultBtnText;

              if (isDestructive) {
                btnStyle = styles.destructiveBtn;
                txtStyle = styles.destructiveBtnText;
              } else if (isCancel) {
                btnStyle = styles.cancelBtn;
                txtStyle = styles.cancelBtnText;
              }

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btnBase,
                    btnStyle,
                    isMultiButton ? { flex: 1 } : { width: '100%', alignSelf: 'stretch' }
                  ]}
                  onPress={() => handleButtonPress(btn.onPress)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnTextBase, txtStyle]}>{btn.text.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  alertCard: {
    width: '90%',
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.darkBorder,
    borderRadius: 6,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.lime,
  },
  title: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes['2xl'],
    color: colors.lime,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: fontSizes.sm,
    color: colors.grayDim,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnLayout: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  btnBase: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    minHeight: 44,
  },
  btnTextBase: {
    fontFamily: fonts.bebas,
    fontSize: fontSizes.md,
    letterSpacing: 1.5,
  },
  // Default/Lime styling
  defaultBtn: {
    backgroundColor: colors.lime,
  },
  defaultBtnText: {
    color: colors.dark,
  },
  // Destructive styling
  destructiveBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.red,
  },
  destructiveBtnText: {
    color: colors.redMuted,
  },
  // Cancel styling
  cancelBtn: {
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  cancelBtnText: {
    color: colors.white,
  },
});
