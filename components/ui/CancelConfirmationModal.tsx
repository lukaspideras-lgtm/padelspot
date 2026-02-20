import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { PrimaryButton } from './PrimaryButton';

interface CancelConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** When true, show only one "OK" button (uses cancelLabel) */
  singleButton?: boolean;
}

export function CancelConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  title = 'Potvrda otkazivanja',
  message = 'Da li ste sigurni da želite da otkažete termin?',
  cancelLabel = 'Ne',
  confirmLabel = 'Da, otkaži',
  singleButton = false,
}: CancelConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onCancel}>
        <Pressable
          style={[styles.modal, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>
          <Text
            style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.buttons}>
            <PrimaryButton
              title={cancelLabel}
              onPress={onCancel}
              variant={singleButton ? 'primary' : 'outline'}
              style={singleButton ? styles.singleBtn : styles.cancelBtn}
            />
            {!singleButton && (
              <PrimaryButton
                title={confirmLabel}
                onPress={onConfirm ?? onCancel}
                variant="primary"
                style={[styles.confirmBtn, { backgroundColor: theme.error }]}
                textStyle={{ color: '#fff' }}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    ...typography.title,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: { flex: 1 },
  confirmBtn: { flex: 1 },
  singleBtn: { flex: 1 },
});
