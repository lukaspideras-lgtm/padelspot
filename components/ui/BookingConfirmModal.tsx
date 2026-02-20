import React, { useState, useEffect } from 'react';
import { typography } from '@/src/theme/typography';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

interface BookingConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (addRacket: boolean) => void;
  isLoading?: boolean;
  dateLabel: string;
  courtName: string;
  courtAccentColor: string;
  timeLabel: string;
  durationLabel: string;
  basePrice: number;
  racketPrice: number;
}

export function BookingConfirmModal({
  visible,
  onCancel,
  onConfirm,
  isLoading = false,
  dateLabel,
  courtName,
  courtAccentColor,
  timeLabel,
  durationLabel,
  basePrice,
  racketPrice,
}: BookingConfirmModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [addRacket, setAddRacket] = useState(false);

  useEffect(() => {
    if (visible) setAddRacket(false);
  }, [visible]);

  const totalPrice = basePrice + (addRacket ? racketPrice : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}>
      <Pressable
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={() => !isLoading && onCancel()}>
        <Pressable
          style={[
            styles.modal,
            {
              backgroundColor: theme.surface,
              paddingBottom: Math.max(insets.bottom, 24) + 24,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.text }]}>
              Potvrda rezervacije
            </Text>
            <View style={[styles.titleAccent, { backgroundColor: `${courtAccentColor}99` }]} />
          </View>

          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Teren</Text>
            <View style={[styles.courtBadge, { backgroundColor: `${courtAccentColor}22`, borderColor: courtAccentColor }]}>
              <Text style={[styles.courtBadgeText, { color: courtAccentColor }]}>{courtName}</Text>
            </View>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Datum</Text>
            <Text style={[styles.value, { color: theme.text }]}>{dateLabel}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Vreme</Text>
            <View style={[styles.timeChip, { borderColor: courtAccentColor }]}>
              <Text style={[styles.value, { color: theme.text }]}>{timeLabel}</Text>
            </View>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Trajanje</Text>
            <Text style={[styles.value, { color: theme.text }]}>{durationLabel}</Text>
          </View>

          <Pressable
            onPress={() => setAddRacket((v) => !v)}
            style={[
              styles.racketRow,
              {
                backgroundColor: theme.surfaceMuted,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.racketLabel, { color: theme.text }]}>
              Reket (+{racketPrice} din)
            </Text>
            <View
              style={[
                styles.checkbox,
                { borderColor: theme.border },
                addRacket && { backgroundColor: courtAccentColor, borderColor: courtAccentColor },
              ]}>
              {addRacket && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </Pressable>

          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Ukupno</Text>
            <Text style={[styles.totalValue, { color: courtAccentColor }]}>{totalPrice} din</Text>
          </View>

          <View style={styles.buttons}>
            <PrimaryButton
              title="Otkaži"
              onPress={onCancel}
              variant="primary"
              disabled={isLoading}
              style={[styles.cancelBtn, { backgroundColor: '#DC2626', borderWidth: 0 }]}
              textStyle={{ color: '#FFF' }}
            />
            <PrimaryButton
              title={isLoading ? '' : 'Potvrdi rezervaciju'}
              onPress={() => onConfirm(addRacket)}
              loading={isLoading}
              disabled={isLoading}
              style={[styles.confirmBtn, { backgroundColor: courtAccentColor }]}
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
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...typography.title,
  },
  titleAccent: {
    width: 60,
    height: 3,
    borderRadius: 999,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { ...typography.body },
  value: { ...typography.subtitle },
  courtBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  courtBadgeText: { ...typography.subtitle },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  racketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  racketLabel: { ...typography.body },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { ...typography.body, color: '#fff' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { ...typography.subtitle, fontSize: 17 },
  totalValue: { ...typography.price },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: { flex: 1, minHeight: 48 },
  confirmBtn: { flex: 1, minHeight: 48 },
});
