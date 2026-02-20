import React, { useEffect, useRef, useState } from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';

const COLLAPSED_HEIGHT = 64;
const EXPANDED_HEIGHT = 300;
const TAB_BAR_HEIGHT = 64;

interface BookingBottomSheetProps {
  courtName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  totalPrice: number;
  onReserve: () => void;
  disabled?: boolean;
  isEmpty?: boolean;
  accentColor?: string;
}

export function BookingBottomSheet({
  courtName,
  dateLabel,
  timeLabel,
  durationLabel,
  totalPrice,
  onReserve,
  disabled = false,
  isEmpty = true,
  accentColor,
}: BookingBottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const btnColor = accentColor ?? theme.tint;
  const [expanded, setExpanded] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const prevEmptyRef = useRef(isEmpty);

  useEffect(() => {
    if (isEmpty) {
      setExpanded(false);
      prevEmptyRef.current = true;
      Animated.timing(animValue, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    } else {
      if (prevEmptyRef.current) {
        setExpanded(true);
        Animated.spring(animValue, {
          toValue: 1,
          useNativeDriver: false,
          tension: 80,
          friction: 12,
        }).start();
      }
      prevEmptyRef.current = false;
    }
  }, [isEmpty, animValue]);

  const handleHeaderTap = () => {
    if (isEmpty) return;
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(animValue, {
      toValue,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  const paddingBottom = insets.bottom + TAB_BAR_HEIGHT + 12;
  const sheetHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_HEIGHT + paddingBottom, EXPANDED_HEIGHT + paddingBottom],
  });

  const expandedOpacity = animValue;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: sheetHeight,
          paddingBottom,
        },
      ]}>
      {/* Collapsed header - always visible */}
      <Pressable
        onPress={handleHeaderTap}
        style={styles.header}
        disabled={isEmpty}>
        <View style={styles.headerContent}>
          <View style={styles.grabHandleWrap}>
            <View style={[styles.grabHandle, { backgroundColor: theme.border }]} />
          </View>
          <View style={styles.collapsedRow}>
            <Text
              style={[styles.collapsedLabel, { color: theme.text }]}
              numberOfLines={1}>
              {isEmpty ? 'Izaberite termin' : 'Termin izabran'}
            </Text>
            <View style={styles.collapsedRight}>
              {!isEmpty && totalPrice > 0 && (
                <View style={[styles.pricePill, { backgroundColor: btnColor }]}>
                  <Text style={styles.pricePillText}>{totalPrice} din</Text>
                </View>
              )}
              {!isEmpty && (
                <View style={styles.chevronWrap}>
                  <Ionicons
                    name={expanded ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>

      {/* Expanded content */}
      {!isEmpty && (
        <Animated.View
          style={[
            styles.expandedContent,
            {
              opacity: expandedOpacity,
            },
          ]}
          pointerEvents={expanded ? 'auto' : 'none'}>
          <Text style={[styles.title, { color: theme.text }]}>Rezervacija</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Teren:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{courtName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Datum:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{dateLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Vreme:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{timeLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Trajanje:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{durationLabel}</Text>
          </View>
          <View style={[styles.row, styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Ukupno:</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>{totalPrice} din</Text>
          </View>
          <PrimaryButton
            title="Rezerviši"
            onPress={onReserve}
            disabled={disabled}
            style={[styles.btn, { backgroundColor: btnColor }]}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  header: {
    minHeight: COLLAPSED_HEIGHT,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  grabHandleWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsedLabel: {
    ...typography.subtitle,
    flex: 1,
  },
  collapsedRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  pricePillText: {
    ...typography.price,
    fontSize: 13,
    color: '#fff',
  },
  chevronWrap: {
    marginLeft: 8,
  },
  expandedContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    ...typography.title,
    fontSize: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: { ...typography.body },
  value: { ...typography.subtitle },
  totalLabel: { ...typography.subtitle, fontSize: 15 },
  totalValue: { ...typography.price, fontSize: 16 },
  btn: { marginBottom: 8 },
});
