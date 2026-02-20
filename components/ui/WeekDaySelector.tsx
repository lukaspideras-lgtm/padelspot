import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { format, addDays, parseISO, isBefore, addWeeks } from 'date-fns';

const DAY_NAMES = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

function getMonthLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const m1 = weekStart.getMonth();
  const m2 = weekEnd.getMonth();
  if (m1 === m2) return MONTH_NAMES[m1];
  return `${MONTH_NAMES[m1]} / ${MONTH_NAMES[m2]}`;
}

interface WeekDaySelectorProps {
  selectedDateISO: string;
  onSelect: (dateISO: string) => void;
  weekStart: Date;
  todayISO: string;
  maxDateISO: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeekDaySelector({
  selectedDateISO,
  onSelect,
  weekStart,
  todayISO,
  maxDateISO,
  onPrevWeek,
  onNextWeek,
}: WeekDaySelectorProps) {
  const theme = useTheme();
  const today = parseISO(todayISO);
  const maxDate = parseISO(maxDateISO);
  const weekEnd = addDays(weekStart, 6);
  const prevWeekEnd = addDays(addWeeks(weekStart, -1), 6);
  const nextWeekStart = addDays(weekEnd, 1);
  const canGoPrev = !isBefore(prevWeekEnd, today);
  const canGoNext = !isBefore(maxDate, nextWeekStart);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthLabel = getMonthLabel(weekStart);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        {canGoPrev ? (
          <Pressable onPress={onPrevWeek} style={styles.arrowLeft} hitSlop={12}>
            <Text style={[styles.arrowText, { color: theme.text }]}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.arrowPlaceholder} />
        )}
        <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
        {canGoNext ? (
          <Pressable onPress={onNextWeek} style={styles.arrowRight} hitSlop={12}>
            <Text style={[styles.arrowText, { color: theme.text }]}>→</Text>
          </Pressable>
        ) : (
          <View style={[styles.arrowPlaceholder, { flex: 1 }]}>
            <Text
              style={[styles.hint, { color: theme.textSecondary }]}
              numberOfLines={2}>
              Rezervacije su dostupne do 30 dana unapred.
            </Text>
          </View>
        )}
      </View>
      <View style={styles.daysRow}>
        {days.map((date) => {
          const iso = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDateISO === iso;
          const dayName = DAY_NAMES[date.getDay()];
          const dayNum = date.getDate();
          const isSelectable =
            (iso >= todayISO && iso <= maxDateISO);

          return (
            <Pressable
              key={iso}
              onPress={() => isSelectable && onSelect(iso)}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? theme.cardSelected : theme.surface,
                  opacity: isSelectable ? 1 : 0.6,
                },
              ]}>
              <Text style={[styles.dayName, { color: theme.textSecondary }]}>{dayName}</Text>
              <Text style={[styles.dayNum, { color: theme.text }]}>{dayNum}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  arrowLeft: { padding: 8, minWidth: 40, alignItems: 'flex-start' },
  arrowRight: { padding: 8, minWidth: 40, alignItems: 'flex-end' },
  arrowPlaceholder: { padding: 8, minWidth: 40, alignItems: 'flex-start' },
  arrowText: { ...typography.subtitle, fontSize: 20 },
  hint: { ...typography.overline, fontSize: 10, textAlign: 'right', maxWidth: 140 },
  monthLabel: { ...typography.subtitle },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dayName: { ...typography.overline },
  dayNum: { ...typography.subtitle },
});
