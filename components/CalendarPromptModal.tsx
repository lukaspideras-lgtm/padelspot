import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

interface CalendarPromptModalProps {
  visible: boolean;
  onDismiss: () => void;
  onAllow: () => void;
  onNotNow: () => void;
}

export function CalendarPromptModal({
  visible,
  onDismiss,
  onAllow,
  onNotNow,
}: CalendarPromptModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}>
      <Pressable
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onDismiss}>
        <Pressable
          style={[styles.modal, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>
            Kalendar
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Želite li da aplikacija automatski dodaje vaše termine u kalendar i podseti vas pre početka?
          </Text>
          <View style={styles.buttons}>
            <PrimaryButton
              title="Ne sada"
              onPress={onNotNow}
              variant="outline"
              style={styles.cancelBtn}
            />
            <PrimaryButton
              title="Dozvoli"
              onPress={onAllow}
              variant="primary"
              style={styles.confirmBtn}
            />
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
});
