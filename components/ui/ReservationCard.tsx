import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';
import type { Reservation } from '@/types';
import { formatTimeForDisplay } from '@/utils/time';

export type DisplayStatus = 'Otkazano' | 'Predstojeće' | 'Završeno';

interface ReservationCardProps {
  reservation: Reservation;
  displayStatus?: DisplayStatus;
  onCancel?: (id: string) => void;
  showCancelButton?: boolean;
  /** When true: show disabled Otkaži + helper text (e.g. < 2h left) */
  cancelDisabled?: boolean;
  cancelDisabledReason?: string;
  /** Za predstojeće: "Počinje za: Xh Ym" */
  timeRemaining?: string;
  /** For cancelled: show Obriši button and call onDelete on press */
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
  /** For upcoming: show Dodaj u kalendar button */
  showAddToCalendarButton?: boolean;
  addToCalendarState?: 'available' | 'added' | 'calendar_disabled' | 'permission_denied';
  onAddToCalendar?: (id: string) => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function ReservationCard({
  reservation,
  displayStatus,
  onCancel,
  showCancelButton = false,
  cancelDisabled = false,
  cancelDisabledReason,
  timeRemaining,
  onDelete,
  showDeleteButton = false,
  showAddToCalendarButton = false,
  addToCalendarState,
  onAddToCalendar,
}: ReservationCardProps) {
  const theme = useTheme();
  const status = displayStatus ?? (reservation.status === 'Otkazano' ? 'Otkazano' : 'Predstojeće');
  const isCancelled = status === 'Otkazano';
  const isFinished = status === 'Završeno';

  const statusColor = isCancelled
    ? theme.error
    : isFinished
      ? theme.textSecondary
      : theme.success;

  const showOtkazi = showCancelButton && !isCancelled;
  const showObrisi = showDeleteButton && isCancelled && !!onDelete;
  const showDodajUKalendar =
    showAddToCalendarButton && status === 'Predstojeće' && !!onAddToCalendar;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: isCancelled ? 0.7 : 1,
        },
      ]}>
      <Text style={[styles.courtName, { color: theme.text }]}>
        {reservation.courtName}
      </Text>
      <Text style={[styles.datetime, { color: theme.textSecondary }]}>
        {formatDate(reservation.dateISO)} • {formatTimeForDisplay(reservation.startTime)}–{formatTimeForDisplay(reservation.endTime)}
      </Text>
      {timeRemaining && status === 'Predstojeće' && (
        <Text style={[styles.timeRemaining, { color: theme.tint }]}>
          {timeRemaining}
        </Text>
      )}
      <View style={styles.footer}>
        <Text
          style={[
            styles.status,
            { color: statusColor, fontWeight: '600' },
          ]}>
          {status}
        </Text>
        {showOtkazi && onCancel && (
          <View style={styles.cancelSection}>
            {cancelDisabled && cancelDisabledReason ? (
              <Text
                style={[styles.helperText, { color: theme.textSecondary }]}
                numberOfLines={2}>
                {cancelDisabledReason}
              </Text>
            ) : null}
            <PrimaryButton
              title="Otkaži"
              onPress={() => !cancelDisabled && onCancel(reservation.id)}
              variant="outline"
              disabled={cancelDisabled}
              style={styles.cancelBtn}
            />
          </View>
        )}
        {showObrisi && (
          <PrimaryButton
            title="Obriši"
            onPress={() => onDelete(reservation.id)}
            variant="outline"
            style={[styles.cancelBtn, { borderColor: theme.error }]}
            textStyle={{ color: theme.error }}
          />
        )}
        {showDodajUKalendar && addToCalendarState === 'added' && (
          <PrimaryButton
            title="Dodato u kalendar"
            variant="outline"
            disabled
            style={[styles.cancelBtn, { opacity: 0.7 }]}
          />
        )}
        {showDodajUKalendar && addToCalendarState !== 'added' && (
          <PrimaryButton
            title="Dodaj u kalendar"
            onPress={() => onAddToCalendar(reservation.id)}
            variant="outline"
            style={styles.cancelBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  courtName: {
    ...typography.subtitle,
    fontSize: 17,
    marginBottom: 4,
  },
  datetime: {
    ...typography.body,
    marginBottom: 4,
  },
  timeRemaining: {
    ...typography.body,
    fontSize: 13,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  status: {
    ...typography.body,
  },
  cancelSection: {
    alignItems: 'flex-end',
  },
  helperText: {
    ...typography.overline,
    marginBottom: 4,
    textAlign: 'right',
    maxWidth: 180,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
