import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/store/useToastStore';
import {
  ReservationCard,
  EmptyState,
  ScreenGradient,
  CancelConfirmationModal,
} from '@/components/ui';
import type { DisplayStatus } from '@/components/ui/ReservationCard';

type HistoryTab = 'Predstojeći' | 'Završeni' | 'Otkazani';
import { StatCard } from '@/components/StatCard';
import type { Reservation } from '@/types';
import { combineDateAndTime, canCancelReservation, minutesUntil, formatTimeRemaining } from '@/utils/time';
import { SETTINGS } from '@/constants/settings';
import { isBefore, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useMyReservations, useCancelReservation } from '@/src/hooks/useReservations';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { getHiddenCancelledIds, addHiddenCancelledId } from '@/utils/hiddenCancelled';
import {
  getCalendarSettings,
  getCalendarEventId,
  getCalendarPermissionStatus,
  ensureCalendarPermission,
  addReservationToCalendar,
  removeReservationFromCalendar,
} from '@/src/services/calendar';

function getDisplayStatus(res: Reservation): DisplayStatus {
  if (res.status === 'Otkazano') return 'Otkazano';
  const start = combineDateAndTime(res.dateISO, res.startTime);
  return isBefore(start, new Date()) ? 'Završeno' : 'Predstojeće';
}

function computeStats(reservations: Reservation[], userEmail: string) {
  const mine = reservations.filter((r) => r.userEmail === userEmail);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let odigrani = 0;
  let predstojeci = 0;
  let mesecno = 0;

  for (const r of mine) {
    if (r.status === 'Otkazano') continue;
    const start = combineDateAndTime(r.dateISO, r.startTime);
    if (isBefore(start, now)) odigrani++;
    else predstojeci++;
    if (isWithinInterval(start, { start: monthStart, end: monthEnd })) mesecno++;
  }

  return { odigrani, predstojeci, mesecno };
}

const CANCEL_HELPER = 'Možeš otkazati najkasnije do 2h pre početka.';

export default function MyReservationsScreen() {
  const { currentUser } = useAppStore();
  const { show: showToast } = useToastStore();
  const [cancelModalReservationId, setCancelModalReservationId] = useState<string | null>(null);
  const [deleteModalReservationId, setDeleteModalReservationId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [eventIds, setEventIds] = useState<Set<string>>(new Set());
  const [historyTab, setHistoryTab] = useState<HistoryTab>('Predstojeći');

  const theme = useTheme();
  const { data: reservations = [], isLoading, error, refetch } = useMyReservations();
  const cancelMutation = useCancelReservation();

  const loadCalendarState = useCallback(async () => {
    if (!currentUser?.email) return;
    const [settings, perm] = await Promise.all([
      getCalendarSettings(currentUser.email),
      getCalendarPermissionStatus(),
    ]);
    setCalendarEnabled(settings.calendarEnabled);
    setCalendarPermission(perm);
  }, [currentUser?.email]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      getHiddenCancelledIds().then(setHiddenIds);
      loadCalendarState();
    }, [refetch, loadCalendarState])
  );

  const upcomingIdsKey = reservations
    .filter((r) => {
      if (r.status === 'Otkazano') return false;
      const start = combineDateAndTime(r.dateISO, r.startTime);
      return start > new Date();
    })
    .map((r) => r.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!upcomingIdsKey) {
      setEventIds(new Set());
      return;
    }
    const ids = upcomingIdsKey.split(',').filter(Boolean);
    const loadEventIds = async () => {
      const found = new Set<string>();
      for (const id of ids) {
        const eid = await getCalendarEventId(id);
        if (eid) found.add(id);
      }
      setEventIds(found);
    };
    loadEventIds();
  }, [upcomingIdsKey]);

  const myReservations = useMemo(() => {
    const now = new Date();
    let list = reservations.filter((r) => {
      if (historyTab === 'Otkazani') return r.status === 'Otkazano' && !hiddenIds.includes(r.id);
      if (r.status === 'Otkazano') return false;
      const start = combineDateAndTime(r.dateISO, r.startTime);
      const end = combineDateAndTime(r.dateISO, r.endTime);
      if (historyTab === 'Predstojeći') return start > now;
      return end < now;
    });
    const ts = (a: Reservation) => combineDateAndTime(a.dateISO, a.startTime).getTime();
    return historyTab === 'Predstojeći'
      ? [...list].sort((a, b) => ts(a) - ts(b))
      : [...list].sort((a, b) => ts(b) - ts(a));
  }, [reservations, hiddenIds, historyTab]);

  const handleDeletePress = useCallback((id: string) => {
    setDeleteModalReservationId(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModalReservationId) return;
    await addHiddenCancelledId(deleteModalReservationId);
    setHiddenIds((prev) => (prev.includes(deleteModalReservationId) ? prev : [...prev, deleteModalReservationId]));
    setDeleteModalReservationId(null);
  }, [deleteModalReservationId]);

  const handleDeleteDismiss = useCallback(() => {
    setDeleteModalReservationId(null);
  }, []);

  const getAddToCalendarState = useCallback(
    (r: Reservation): 'available' | 'added' | 'calendar_disabled' | 'permission_denied' => {
      const displayStatus = getDisplayStatus(r);
      if (displayStatus !== 'Predstojeće') return 'calendar_disabled';
      if (eventIds.has(r.id)) return 'added';
      if (!calendarEnabled) return 'calendar_disabled';
      if (calendarPermission !== 'granted') return 'permission_denied';
      return 'available';
    },
    [calendarEnabled, calendarPermission, eventIds]
  );

  const handleAddToCalendar = useCallback(
    async (id: string) => {
      const r = reservations.find((x) => x.id === id);
      if (!r) return;
      const state = getAddToCalendarState(r);
      if (state === 'added') return;
      if (state === 'calendar_disabled') {
        showToast('Uključite kalendar u Profilu.', 'error');
        return;
      }
      if (state === 'permission_denied') {
        const granted = await ensureCalendarPermission();
        if (!granted) {
          showToast('Dozvola za kalendar nije odobrena.', 'error');
          return;
        }
        setCalendarPermission('granted');
      }
      const eventId = await addReservationToCalendar(r, {
        courtName: r.courtName,
      });
      if (eventId) {
        setEventIds((prev) => new Set([...prev, id]));
      } else {
        showToast('Termin nije dodat u kalendar.', 'error');
      }
    },
    [reservations, getAddToCalendarState, showToast]
  );

  const stats = computeStats(reservations, currentUser?.email ?? '');

  const handleCancelPress = (id: string) => {
    setCancelModalReservationId(id);
  };

  const handleCancelConfirm = async () => {
    if (!cancelModalReservationId) return;
    try {
      await cancelMutation.mutateAsync(cancelModalReservationId);
      const res = await removeReservationFromCalendar(cancelModalReservationId);
      setCancelModalReservationId(null);
      if (!res.ok) {
        if (res.reason === 'permission_denied') {
          showToast('Termin je otkazan. Kalendar nije dostupan za brisanje.', 'error');
        } else if (res.reason === 'not_found') {
          showToast('Termin je otkazan. Stavka u kalendaru nije pronađena.', 'error');
        } else {
          showToast('Termin je otkazan.', 'success');
        }
      } else {
        showToast('Termin je otkazan.', 'success');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Greška pri otkazivanju.';
      showToast(msg, 'error');
    }
  };

  const handleCancelDismiss = () => {
    setCancelModalReservationId(null);
  };

  const getCancelProps = (r: Reservation) => {
    const displayStatus = getDisplayStatus(r);
    const isBookedFuture = r.status === 'Rezervisano' && displayStatus === 'Predstojeće';
    const canCancel = canCancelReservation(r);
    const mins = minutesUntil(r.dateISO, r.startTime);
    const windowMins = SETTINGS.cancelWindowHours * 60;

    return {
      showCancelButton: isBookedFuture,
      cancelDisabled: isBookedFuture && !canCancel,
      cancelDisabledReason:
        isBookedFuture && mins >= 0 && mins < windowMins ? CANCEL_HELPER : undefined,
    };
  };

  if (isLoading) {
    return (
      <ScreenGradient>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </ScreenGradient>
    );
  }

  if (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
    if (__DEV__) console.error('[Istorija] listMine error:', error);
    return (
      <ScreenGradient>
        <View style={styles.loading}>
          <Text style={{ color: '#ef4444', marginBottom: 12, paddingHorizontal: 20 }}>
            Greška pri učitavanju: {errMsg}
          </Text>
        </View>
      </ScreenGradient>
    );
  }

  return (
    <ScreenGradient>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {(['Predstojeći', 'Završeni', 'Otkazani'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setHistoryTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: historyTab === tab ? theme.tint : theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.tabText,
                    { color: historyTab === tab ? '#fff' : theme.text },
                  ]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.statsRow}>
            <StatCard value={stats.odigrani} label="Odigrani" />
            <StatCard value={stats.predstojeci} label="Predstojeći" />
            <StatCard value={stats.mesecno} label="Mesečno" />
          </View>

          {myReservations.length === 0 ? (
            <EmptyState
              message={
                historyTab === 'Predstojeći'
                  ? 'Nema predstojećih rezervacija.'
                  : historyTab === 'Završeni'
                    ? 'Nema završenih rezervacija.'
                    : 'Nema otkazanih rezervacija.'
              }
            />
          ) : (
            myReservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                displayStatus={getDisplayStatus(r)}
                onCancel={handleCancelPress}
                onDelete={handleDeletePress}
                showDeleteButton={getDisplayStatus(r) === 'Otkazano'}
                showAddToCalendarButton={r.status === 'Rezervisano'}
                addToCalendarState={getAddToCalendarState(r)}
                onAddToCalendar={handleAddToCalendar}
                timeRemaining={
                  getDisplayStatus(r) === 'Predstojeće'
                    ? formatTimeRemaining(r.dateISO, r.startTime)
                    : undefined
                }
                {...getCancelProps(r)}
              />
            ))
          )}
        </ScrollView>
      </View>

      <CancelConfirmationModal
        visible={!!cancelModalReservationId}
        onCancel={handleCancelDismiss}
        onConfirm={handleCancelConfirm}
      />
      <CancelConfirmationModal
        visible={!!deleteModalReservationId}
        onCancel={handleDeleteDismiss}
        onConfirm={handleDeleteConfirm}
        title="Brisanje termina"
        message="Da li želite da obrišete ovaj otkazani termin iz istorije?"
        cancelLabel="Odustani"
        confirmLabel="Obriši"
      />
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: { ...typography.button, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
