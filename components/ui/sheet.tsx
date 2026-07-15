import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Bottom sheet: dims the screen, slides up a rounded panel with a grab handle.
 *
 * The dim layer is an absolute-fill Pressable rendered *behind* the panel (not a
 * parent wrapping it). Wrapping the content in a touchable made buttons need two
 * taps while the keyboard was open — the first tap was swallowed to dismiss the
 * keyboard. As a sibling, taps on Cancel/Save register on the first press.
 */
export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.sheetBorder }]}>
            <View style={[styles.handle, { backgroundColor: theme.mutedBorder }]} />
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Centered dialog for confirmations / share cards. */
export function Dialog({
  visible,
  onClose,
  children,
  padding = 24,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  padding?: number;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogOverlay}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]} onPress={onClose} />
        <View style={[styles.dialog, { backgroundColor: theme.sheet, borderColor: theme.sheetBorder, padding }]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  dialogOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
  },
});
