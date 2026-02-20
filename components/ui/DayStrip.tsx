import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ListRenderItem } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { format, addDays, startOfDay } from 'date-fns';

const DAY_NAMES = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
const INITIAL_DAYS = 60;

interface DayItem {
  date: Date;
  iso: string;
}

function createDayItems(fromIndex: number, count: number): DayItem[] {
  const result: DayItem[] = [];
  const today = startOfDay(new Date());
  for (let i = 0; i < count; i++) {
    const d = addDays(today, fromIndex + i);
    result.push({
      date: d,
      iso: format(d, 'yyyy-MM-dd'),
    });
  }
  return result;
}

interface DayStripProps {
  selectedDateISO: string;
  onSelect: (dateISO: string) => void;
}

export function DayStrip({ selectedDateISO, onSelect }: DayStripProps) {
  const theme = useTheme();
  const [days, setDays] = useState<DayItem[]>(() => createDayItems(0, INITIAL_DAYS));

  const handleEndReached = useCallback(() => {
    setDays((prev) => {
      const lastIndex = prev.length;
      return [...prev, ...createDayItems(lastIndex, INITIAL_DAYS)];
    });
  }, []);

  const renderItem: ListRenderItem<DayItem> = useCallback(
    ({ item }) => {
      const isSelected = selectedDateISO === item.iso;
      const dayName = DAY_NAMES[item.date.getDay()];
      const dayNum = item.date.getDate();

      return (
        <Pressable
          onPress={() => onSelect(item.iso)}
          style={[
            styles.card,
            { backgroundColor: isSelected ? theme.cardSelected : theme.surface },
          ]}>
          <Text style={[styles.dayName, { color: theme.textSecondary }]}>{dayName}</Text>
          <Text style={[styles.dayNum, { color: theme.text }]}>{dayNum}</Text>
        </Pressable>
      );
    },
    [selectedDateISO, onSelect, theme]
  );

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Izaberite dan</Text>
      <FlatList
        data={days}
        keyExtractor={(item) => item.iso}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  scroll: { gap: 10, paddingRight: 20 },
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
  },
  dayName: { fontSize: 12 },
  dayNum: { fontSize: 18, fontWeight: '700' },
});
