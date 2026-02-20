import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useToastStore } from '@/store/useToastStore';
import {
  CourtList,
  SlotList,
  WeekDaySelector,
  DurationToggle,
  BookingMiniBar,
  ScreenGradient,
  BookingConfirmModal,
  SuccessOverlay,
} from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { SETTINGS } from '@/constants/settings';
import { calculatePrice } from '@/constants/pricing';
import * as Haptics from 'expo-haptics';
import { format, parseISO, startOfDay, startOfWeek, addWeeks, addDays } from 'date-fns';
import { formatTimeForDisplay } from '@/utils/time';
import { srLatn } from 'date-fns/locale';
import {
  useCourts,
  useAvailability,
  useCreateReservation,
} from '@/src/hooks/useReservations';
import { useAppStore } from '@/store/useAppStore';
import {
  getCalendarSettings,
  ensureCalendarPermission,
  addReservationToCalendar,
} from '@/src/services/calendar';

function formatDateISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function getWeekStart(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function formatDateDisplay(iso: string): string {
  return format(parseISO(iso), 'd. MMMM yyyy.', { locale: srLatn });
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalM = h * 60 + m + minutes;
  if (totalM === 1440) return '24:00';
  const nh = Math.floor(totalM / 60) % 24;
  const nm = totalM % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

export default function ReserveScreen() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayISO = formatDateISO(today);

  const [weekStart, setWeekStart] = React.useState<Date>(() => getWeekStart(today));
  const [selectedDateISO, setSelectedDateISO] = React.useState<string>(todayISO);
  const [selectedCourtId, setSelectedCourtId] = React.useState<string>('');
  const [durationMinutes, setDurationMinutes] = React.useState<60 | 120>(60);
  const [selectedSlot, setSelectedSlot] = React.useState<{ start: string; end: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = React.useState(false);
  const isShowingSuccessRef = React.useRef(false);

  const scrollRef = useRef<ScrollView>(null);

  const { show: showToast } = useToastStore();
  const { currentUser } = useAppStore();
  const theme = useTheme();

  const { data: courts = [], isLoading: courtsLoading } = useCourts();
  const effectiveCourtId = selectedCourtId || (courts[0]?.id ?? '');
  const court = courts.find((c) => c.id === effectiveCourtId);
  const courtName = court?.name ?? 'Zeleni teren';
  const courtAccentColor = court?.color ?? theme.tint;
  const dateISO = selectedDateISO;

  const { data: availability = [], isLoading: availabilityLoading } = useAvailability(
    dateISO,
    effectiveCourtId,
    durationMinutes
  );

  const createMutation = useCreateReservation();

  useEffect(() => {
    if (courts.length > 0 && !selectedCourtId) {
      setSelectedCourtId(courts[0].id);
    }
  }, [courts, selectedCourtId]);


  const effectiveSlot = selectedSlot
    ? { start: selectedSlot.start, end: addMinutesToTime(selectedSlot.start, durationMinutes) }
    : null;

  const basePrice = useMemo(() => {
    if (!effectiveSlot) return 0;
    return calculatePrice(
      effectiveSlot.start,
      effectiveSlot.end,
      selectedDateISO,
      false
    );
  }, [effectiveSlot?.start, effectiveSlot?.end, selectedDateISO]);

  const handleSelectSlot = (start: string, end: string) => {
    const next = selectedSlot?.start === start ? null : { start, end };
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSlot(next);
  };

  const handleReservePress = () => {
    if (!selectedSlot) return;
    setShowConfirmModal(true);
  };

  const handleConfirmReserve = async (addRacket: boolean) => {
    if (!effectiveSlot || !effectiveCourtId) return;
    if (isShowingSuccessRef.current) return;
    try {
      const reservation = await createMutation.mutateAsync({
        courtId: effectiveCourtId,
        dateISO,
        startHHmm: effectiveSlot.start,
        durationMinutes,
        racket: addRacket,
      });
      if (isShowingSuccessRef.current) return;
      isShowingSuccessRef.current = true;
      setShowConfirmModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessOverlay(true);

      if (currentUser?.email) {
        const settings = await getCalendarSettings(currentUser.email);
        if (settings.calendarEnabled) {
          const granted = await ensureCalendarPermission();
          if (granted) {
            const eventId = await addReservationToCalendar(reservation, {
              courtName,
              racket: addRacket,
            });
            if (!eventId) {
              showToast('Termin je rezervisan, ali nije dodat u kalendar.', 'error');
            }
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Termin je zauzet. Izaberite drugi.';
      showToast(msg, 'error');
    }
  };

  const handleSuccessDismiss = useCallback(() => {
    isShowingSuccessRef.current = false;
    setShowSuccessOverlay(false);
    setSelectedSlot(null);
  }, []);

  useEffect(() => {
    if (selectedSlot && scrollRef.current) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 100, animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [selectedSlot]);

  const maxDateISO = format(addDays(today, SETTINGS.maxDaysAhead), 'yyyy-MM-dd');
  const handlePrevWeek = () => setWeekStart((w) => addWeeks(w, -1));
  const handleNextWeek = () => setWeekStart((w) => addWeeks(w, 1));

  const isReserving = createMutation.isPending;
  const slotsLoading = courtsLoading || (!!effectiveCourtId && availabilityLoading);

  return (
    <ScreenGradient>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <WeekDaySelector
          selectedDateISO={selectedDateISO}
          onSelect={setSelectedDateISO}
          weekStart={weekStart}
          todayISO={todayISO}
          maxDateISO={maxDateISO}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Teren</Text>
          {courtsLoading ? (
            <ActivityIndicator size="small" color={theme.tint} style={styles.loader} />
          ) : (
            <CourtList
              courts={courts}
              selectedCourtId={effectiveCourtId}
              onSelect={setSelectedCourtId}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Trajanje</Text>
          {durationMinutes === 120 && (
            <Text style={[styles.durationHint, { color: theme.textSecondary }]}>
              Za 2h je potrebno da oba sata budu slobodna.
            </Text>
          )}
          <DurationToggle
            value={durationMinutes}
            onChange={(nextDuration) => {
              if (nextDuration === 120 && selectedSlot) {
                const nextHour = addMinutesToTime(selectedSlot.start, 60);
                const bothAvailable =
                  availability.includes(selectedSlot.start) && availability.includes(nextHour);
                if (!bothAvailable) {
                  setSelectedSlot(null);
                  showToast('Izabrani termin nije dostupan za 2h. Izaberite drugi.', 'error');
                }
              }
              setDurationMinutes(nextDuration);
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Dostupni termini</Text>
          {slotsLoading ? (
            <ActivityIndicator size="small" color={theme.tint} style={styles.loader} />
          ) : (
            <SlotList
              courtAccentColor={courtAccentColor}
              durationMinutes={durationMinutes}
              availableStarts={availability}
              onSelectSlot={handleSelectSlot}
              selectedSlot={selectedSlot}
            />
          )}
        </View>
      </ScrollView>

      <BookingMiniBar
        onContinue={handleReservePress}
        isEmpty={!effectiveSlot}
        accentColor={courtAccentColor}
      />

      <BookingConfirmModal
        visible={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmReserve}
        isLoading={isReserving}
        dateLabel={formatDateDisplay(dateISO)}
        courtName={courtName}
        courtAccentColor={courtAccentColor}
        timeLabel={
          effectiveSlot
            ? `${formatTimeForDisplay(effectiveSlot.start)} – ${formatTimeForDisplay(effectiveSlot.end)}`
            : ''
        }
        durationLabel={durationMinutes === 60 ? '1h' : '2h'}
        basePrice={basePrice}
        racketPrice={300}
      />

      <SuccessOverlay
        visible={showSuccessOverlay}
        onDismiss={handleSuccessDismiss}
        duration={1500}
      />
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 24 },
  label: { ...typography.subtitle, marginBottom: 12 },
  durationHint: { ...typography.caption, marginBottom: 8 },
  loader: { padding: 20 },
});
