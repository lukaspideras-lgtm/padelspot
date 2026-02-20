import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

interface BookingConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  dateLabel: string;
  courtName: string;
  timeLabel: string;
  durationLabel: string;
  totalPrice: number;
}

export function BookingConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  isLoading = false,
  dateLabel,
  courtName,
  timeLabel,
  durationLabel,
  totalPrice,
}: BookingConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={() => !isLoading && onCancel()}>
        <Pressable
          style={[styles.modal, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: theme.text }]}>
            Potvrda rezervacije
          </Text>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Datum
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>{dateLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Teren
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>{courtName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Vreme
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>{timeLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Trajanje
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {durationLabel}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Ukupna cena
            </Text>
            <Text style={[styles.value, styles.price, { color: theme.tint }]}>
              {totalPrice} din
            </Text>
          </View>

          <View style={styles.buttons}>
            <PrimaryButton
              title="Otkaži"
              onPress={onCancel}
              variant="outline"
              disabled={isLoading}
              style={styles.cancelBtn}
            />
            <PrimaryButton
              title={isLoading ? '' : 'Potvrdi'}
              onPress={onConfirm}
              loading={isLoading}
              disabled={isLoading}
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
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  label: { fontSize: 15 },
  value: { fontSize: 15, fontWeight: '600' },
  price: { fontSize: 18 },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: { flex: 1 },
  confirmBtn: { flex: 1 },
});
