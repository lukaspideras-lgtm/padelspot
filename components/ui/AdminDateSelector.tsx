// =============================================================================
// Admin date selector – beskonačna navigacija + brzi dugmići
// =============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { format, addDays, parseISO, addWeeks } from 'date-fns';

const DAY_NAMES = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

function getMonthLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const m1 = weekStart.getMonth();
  const m2 = weekEnd.getMonth();
  if (m1 === m2) return MONTH_NAMES[m1];
  return `${MONTH_NAMES[m1]} / ${MONTH_NAMES[m2]}`;
}

interface AdminDateSelectorProps {
  selectedDateISO: string;
  onSelect: (dateISO: string) => void;
  weekStart: Date;
  todayISO: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function AdminDateSelector({
  selectedDateISO,
  onSelect,
  weekStart,
  todayISO,
  onPrevWeek,
  onNextWeek,
}: AdminDateSelectorProps) {
  const theme = useTheme();
  const today = parseISO(todayISO);
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthLabel = getMonthLabel(weekStart);

  const yesterdayISO = format(addDays(today, -1), 'yyyy-MM-dd');
  const tomorrowISO = format(addDays(today, 1), 'yyyy-MM-dd');
  const isYesterday = selectedDateISO === yesterdayISO;
  const isToday = selectedDateISO === todayISO;
  const isTomorrow = selectedDateISO === tomorrowISO;

  return (
    <View style={styles.wrapper}>
      <View style={styles.quickRow}>
        <Pressable
          onPress={() => onSelect(yesterdayISO)}
          style={[
            styles.quickBtn,
            { borderColor: theme.border },
            isYesterday && { backgroundColor: theme.tint, borderWidth: 0 },
          ]}>
          <Text style={[styles.quickText, { color: isYesterday ? '#fff' : theme.text }]}>Juče</Text>
        </Pressable>
        <Pressable
          onPress={() => onSelect(todayISO)}
          style={[
            styles.quickBtn,
            { borderColor: theme.border },
            isToday && { backgroundColor: theme.tint, borderWidth: 0 },
          ]}>
          <Text style={[styles.quickText, { color: isToday ? '#fff' : theme.text }]}>Danas</Text>
        </Pressable>
        <Pressable
          onPress={() => onSelect(tomorrowISO)}
          style={[
            styles.quickBtn,
            { borderColor: theme.border },
            isTomorrow && { backgroundColor: theme.tint, borderWidth: 0 },
          ]}>
          <Text style={[styles.quickText, { color: isTomorrow ? '#fff' : theme.text }]}>Sutra</Text>
        </Pressable>
      </View>
      <View style={styles.header}>
        <Pressable onPress={onPrevWeek} style={styles.arrowLeft} hitSlop={12}>
          <Text style={[styles.arrowText, { color: theme.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
        <Pressable onPress={onNextWeek} style={styles.arrowRight} hitSlop={12}>
          <Text style={[styles.arrowText, { color: theme.text }]}>→</Text>
        </Pressable>
      </View>
      <View style={styles.daysRow}>
        {days.map((date) => {
          const iso = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDateISO === iso;
          const dayName = DAY_NAMES[date.getDay()];
          const dayNum = date.getDate();

          return (
            <Pressable
              key={iso}
              onPress={() => onSelect(iso)}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? theme.tint : theme.surface,
                  opacity: 1,
                },
              ]}>
              <Text style={[styles.dayName, { color: isSelected ? 'rgba(255,255,255,0.9)' : theme.textSecondary }]}>{dayName}</Text>
              <Text style={[styles.dayNum, { color: isSelected ? '#fff' : theme.text }]}>{dayNum}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickText: { ...typography.subtitle },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  arrowLeft: { padding: 8, minWidth: 40, alignItems: 'flex-start' },
  arrowRight: { padding: 8, minWidth: 40, alignItems: 'flex-end' },
  arrowText: { ...typography.subtitle, fontSize: 20 },
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
