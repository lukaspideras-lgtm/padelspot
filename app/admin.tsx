import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { format, startOfDay, startOfWeek, addWeeks, addDays, parseISO } from 'date-fns';
import debounce from 'lodash.debounce';
import * as Linking from 'expo-linking';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AdminDateSelector, ScreenGradient, CancelConfirmationModal } from '@/components/ui';
import { PrimaryButton } from '@/components/ui';
import { formatTimeForDisplay } from '@/utils/time';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import {
  useCourts,
  useAdminReservations,
  useAdminBlocks,
  useAdminDailyOverview,
  useAvailability,
  useCreateBlocksBulk,
  useCancelBlock,
  useCancelBlocksBulk,
  useAdminCancelReservation,
  useAdminMarkNoShow,
} from '@/src/hooks/useReservations';
import { useToastStore } from '@/store/useToastStore';
import type { AdminReservation, AdminBlock } from '@/types';
import { CourtList } from '@/components/ui/CourtList';
import { generateSlots } from '@/constants/times';

function formatDateISO(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function getWeekStart(d: Date) {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function getDurationLabel(minutes: number): string {
  return minutes >= 120 ? '2h' : '1h';
}

function phoneToDial(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('381')) return `+${digits}`;
  if (digits.startsWith('0')) return `+381${digits.slice(1)}`;
  return digits.length >= 9 ? `+381${digits}` : phone;
}

function formatUserName(firstName: string, lastName: string): string {
  const fn = (firstName || '').trim();
  const ln = (lastName || '').trim();
  if (!fn && !ln) return 'Nepoznato';
  return `${fn} ${ln}`.trim();
}

type TabMode = 'rezervacije' | 'blokade';
type StatusFilterVal = 'sve' | 'predstojece' | 'zavrseno' | 'otkazano' | 'no_show';

export default function AdminScreen() {
  const theme = useTheme();
  const { show: showToast } = useToastStore();
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayISO = formatDateISO(today);

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today));
  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO);
  const [tab, setTab] = useState<TabMode>('rezervacije');
  const [courtFilter, setCourtFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterVal>('predstojece');

  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const debouncedSetSearch = useMemo(
    () => debounce((v: string) => setSearchDebounced(v), 300),
    []
  );
  useEffect(() => {
    debouncedSetSearch(searchInput);
    return () => debouncedSetSearch.cancel();
  }, [searchInput, debouncedSetSearch]);

  const [blockCourtId, setBlockCourtId] = useState<string>('');
  const [blockDateISO, setBlockDateISO] = useState<string>(todayISO);
  const [blockDuration, setBlockDuration] = useState<60 | 120>(60);
  const [blockSelectedSlots, setBlockSelectedSlots] = useState<Set<string>>(new Set());
  const [blocksToRemove, setBlocksToRemove] = useState<Set<string>>(new Set());
  const [blockReason, setBlockReason] = useState('');
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [isCancellingBulk, setIsCancellingBulk] = useState(false);
  const [showNoShowWarningModal, setShowNoShowWarningModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);


  const { data: courts = [] } = useCourts();
  const effectiveBlockCourtId = blockCourtId || (courts[0]?.id ?? '');
  React.useEffect(() => {
    if (courts.length > 0 && !blockCourtId) setBlockCourtId(courts[0].id);
  }, [courts, blockCourtId]);

  React.useEffect(() => {
    setBlockSelectedSlots(new Set());
  }, [effectiveBlockCourtId, blockDateISO, blockDuration]);

  React.useEffect(() => {
    if (tab === 'rezervacije') setBlocksToRemove(new Set());
  }, [tab]);

  const { data: reservations = [], isLoading: reservationsLoading } = useAdminReservations(
    selectedDateISO,
    searchDebounced || null
  );
  const { data: blocks = [], isLoading: blocksLoading } = useAdminBlocks(selectedDateISO);
  const { data: dailyOverview = [] } = useAdminDailyOverview(selectedDateISO);
  const { data: blockAvailability = [] } = useAvailability(
    blockDateISO,
    effectiveBlockCourtId,
    blockDuration
  );
  const createBlocksBulkMutation = useCreateBlocksBulk();
  const cancelBlockMutation = useCancelBlock();
  const cancelBlocksBulkMutation = useCancelBlocksBulk();
  const adminCancelMutation = useAdminCancelReservation();
  const adminMarkNoShowMutation = useAdminMarkNoShow();

  const slots1h = useMemo(() => generateSlots('09:00', '24:00', 60), []);
  const slots2h = useMemo(() => generateSlots('09:00', '24:00', 120), []);
  const blockSlots = blockDuration === 60 ? slots1h : slots2h;
  const availableStarts = new Set(blockAvailability);
  const selectableSlots = blockSlots.filter((s) => availableStarts.has(s.start));

  const filteredReservations = useMemo(() => {
    let list = reservations;
    if (courtFilter !== 'all') {
      const court = courts.find((c) => c.id === courtFilter || c.name === courtFilter);
      const name = court?.name ?? courtFilter;
      list = list.filter((r) => r.courtName === name);
    }
    const now = new Date();
    if (statusFilter === 'predstojece') {
      list = list.filter((r) => r.status === 'booked' && new Date(`${r.dateISO}T${r.startTime}`) > now);
    } else if (statusFilter === 'zavrseno') {
      list = list.filter((r) => r.status === 'booked' && new Date(`${r.dateISO}T${r.endTime}`) < now);
    } else if (statusFilter === 'otkazano') {
      list = list.filter((r) => r.status === 'cancelled');
    } else if (statusFilter === 'no_show') {
      list = list.filter((r) => r.status === 'no_show');
    }
    return list;
  }, [reservations, courtFilter, statusFilter, courts]);

  const activeBlocks = blocks.filter((b) => b.status === 'active');
  const filteredBlocks = useMemo(() => {
    if (courtFilter === 'all') return activeBlocks;
    const court = courts.find((c) => c.id === courtFilter || c.name === courtFilter);
    const name = court?.name ?? courtFilter;
    return activeBlocks.filter((b) => b.courtName === name);
  }, [activeBlocks, courtFilter, courts]);

  const mixedItems = useMemo(() => {
    const items: Array<
      | { type: 'reservation'; data: AdminReservation }
      | { type: 'block'; data: AdminBlock }
    > = [];
    filteredReservations.forEach((r) => {
      items.push({ type: 'reservation', data: r });
    });
    filteredBlocks.forEach((b) => {
      items.push({ type: 'block', data: b });
    });
    items.sort((a, b) => {
      const timeA = a.type === 'reservation' ? a.data.startTime : a.data.startTime;
      const timeB = b.type === 'reservation' ? b.data.startTime : b.data.startTime;
      return timeA.localeCompare(timeB);
    });
    return items;
  }, [filteredReservations, filteredBlocks]);

  const handleCancelBlock = async (blockId: string) => {
    try {
      await cancelBlockMutation.mutateAsync(blockId);
      showToast('Blokada uklonjena.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Greška.', 'error');
    }
  };

  const handleCall = (phone: string) => {
    const dial = phoneToDial(phone);
    if (dial) Linking.openURL(`tel:${dial}`);
  };

  const handleAdminCancel = async (reservationId: string) => {
    try {
      await adminCancelMutation.mutateAsync(reservationId);
      showToast('Rezervacija otkazana.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Greška.', 'error');
    }
  };

  const handleAdminMarkNoShow = async (reservationId: string) => {
    try {
      await adminMarkNoShowMutation.mutateAsync(reservationId);
      showToast('Označeno kao nepojavljivanje.', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Greška.', 'error');
    }
  };

  const handleCreateBlocksBulk = async () => {
    const starts = Array.from(blockSelectedSlots);
    if (!effectiveBlockCourtId || starts.length === 0 || !blockReason.trim()) {
      showToast('Izaberite teren, bar jedan termin i unesite razlog.', 'error');
      return;
    }
    setIsCreatingBulk(true);
    try {
      const result = await createBlocksBulkMutation.mutateAsync({
        courtId: effectiveBlockCourtId,
        dateISO: blockDateISO,
        startTimes: starts,
        durationMinutes: blockDuration,
        reason: blockReason.trim(),
      });
      const msg =
        result.conflicts > 0
          ? `${result.inserted} termina blokirana, ${result.conflicts} konflikt(a)`
          : `${result.inserted} termina blokirana.`;
      showToast(msg, result.conflicts > 0 ? 'info' : 'success');
      setBlockSelectedSlots(new Set());
      setBlockReason('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Greška pri blokadi.', 'error');
    } finally {
      setIsCreatingBulk(false);
    }
  };

  const toggleBlockSlot = (start: string) => {
    setBlockSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(start)) next.delete(start);
      else next.add(start);
      return next;
    });
  };

  const toggleBlockToRemove = (blockId: string) => {
    setBlocksToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const handleCancelBlocksBulk = async () => {
    const ids = Array.from(blocksToRemove);
    if (ids.length === 0) return;
    setIsCancellingBulk(true);
    try {
      await cancelBlocksBulkMutation.mutateAsync(ids);
      showToast(`${ids.length} blokada uklonjeno.`, 'success');
      setBlocksToRemove(new Set());
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Greška.', 'error');
    } finally {
      setIsCancellingBulk(false);
    }
  };

  const getCourtShortName = (name: string) => name.replace(' teren', '');

  const isLoading = reservationsLoading || blocksLoading;

  if (isLoading && tab === 'rezervacije') {
    return (
      <ScreenGradient>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </ScreenGradient>
    );
  }

  return (
    <ScreenGradient>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, tab === 'blokade' && styles.contentBlocks]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Admin panel</Text>
          <Pressable
            onPress={() => setShowHelpModal(true)}
            style={[styles.helpBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            hitSlop={8}>
            <Ionicons name="help-circle-outline" size={28} color={theme.tint} />
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab('rezervacije')}
            style={[
              styles.tab,
              tab === 'rezervacije' && { backgroundColor: theme.tint },
            ]}>
            <Text style={[styles.tabText, { color: tab === 'rezervacije' ? '#fff' : theme.text }]}>
              Rezervacije
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('blokade')}
            style={[styles.tab, tab === 'blokade' && { backgroundColor: '#f97316' }]}>
            <Text style={[styles.tabText, { color: tab === 'blokade' ? '#fff' : theme.text }]}>
              Blokade
            </Text>
          </Pressable>
        </View>

        {tab === 'rezervacije' && (
          <View style={[styles.searchSection, { marginBottom: 16 }]}>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Pretraži ime ili telefon…"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.searchInput,
                { backgroundColor: theme.surfaceMuted, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>
        )}

        {tab === 'rezervacije' && dailyOverview.length > 0 && (
          <View style={[styles.overviewSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {dailyOverview.map((o) => (
              <View key={o.courtId} style={styles.overviewRow}>
                <Text style={[styles.overviewLabel, { color: theme.text }]}>
                  {getCourtShortName(o.courtName)}: {o.filledSlots}/{o.totalSlots} popunjeno
                </Text>
                <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, (o.filledSlots / o.totalSlots) * 100)}%`,
                        backgroundColor: theme.tint,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Datum</Text>
          <AdminDateSelector
            selectedDateISO={selectedDateISO}
            onSelect={(d) => {
              setSelectedDateISO(d);
              setWeekStart(getWeekStart(parseISO(d)));
              if (tab === 'blokade') setBlockDateISO(d);
            }}
            weekStart={weekStart}
            todayISO={todayISO}
            onPrevWeek={() => setWeekStart((w) => addWeeks(w, -1))}
            onNextWeek={() => setWeekStart((w) => addWeeks(w, 1))}
          />
        </View>

        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Teren:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <Pressable
              onPress={() => setCourtFilter('all')}
              style={[
                styles.filterChip,
                { borderColor: theme.border },
                courtFilter === 'all' && { backgroundColor: theme.tint },
              ]}>
              <Text style={[styles.filterChipText, { color: courtFilter === 'all' ? '#fff' : theme.text }]}>
                Svi
              </Text>
            </Pressable>
            {courts.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCourtFilter(c.id)}
                style={[
                  styles.filterChip,
                  { borderColor: theme.border },
                  courtFilter === c.id && { backgroundColor: c.color },
                ]}>
                <Text style={[styles.filterChipText, { color: courtFilter === c.id ? '#fff' : theme.text }]}>
                  {c.name.replace(' teren', '')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {tab === 'rezervacije' && (
          <>
            <View style={styles.filterRow}>
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {(['sve', 'predstojece', 'zavrseno', 'otkazano', 'no_show'] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatusFilter(s)}
                    style={[
                      styles.filterChip,
                      { borderColor: theme.border },
                      statusFilter === s && { backgroundColor: theme.tint },
                    ]}>
                    <Text style={[styles.filterChipText, { color: statusFilter === s ? '#fff' : theme.text }]}>
                      {s === 'sve'
                        ? 'Sve'
                        : s === 'predstojece'
                          ? 'Predstojeće'
                          : s === 'zavrseno'
                            ? 'Završeno'
                            : s === 'otkazano'
                              ? 'Otkazano'
                              : 'Nije se pojavio'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Rezervacije i blokade</Text>
              {mixedItems.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Nema unosa za ovaj datum.
                </Text>
              ) : (
                mixedItems.map((item) => {
                  if (item.type === 'block') {
                    const b = item.data;
                    const courtColor = courts.find((c) => c.name === b.courtName)?.color ?? '#f97316';
                    return (
                      <View
                        key={`block-${b.id}`}
                        style={[styles.row, styles.rowCompact, styles.blockRow, { backgroundColor: '#fff3e0', borderColor: '#f97316' }]}>
                        <View style={[styles.courtStrip, { backgroundColor: courtColor }]} />
                        <View style={styles.rowContent}>
                          <View style={styles.rowMain}>
                            <View style={[styles.badge, { backgroundColor: '#f97316' }]}>
                              <Text style={styles.badgeText}>BLOKIRANO</Text>
                            </View>
                            <Text style={[styles.rowTitle, styles.blockCardText]}>
                              {formatTimeForDisplay(b.startTime)}–{formatTimeForDisplay(b.endTime)} ({getDurationLabel(b.durationMinutes)})
                            </Text>
                            <Text style={[styles.rowSub, styles.blockCardTextSecondary]}>{b.reason}</Text>
                          </View>
                          <PrimaryButton
                            title="Ukloni"
                            onPress={() => handleCancelBlock(b.id)}
                            variant="outline"
                            style={StyleSheet.flatten([styles.actionBtn, { borderColor: '#f97316' }])}
                            textStyle={{ color: '#f97316' }}
                          />
                        </View>
                      </View>
                    );
                  }
                  const r = item.data;
                  const fullName = formatUserName(r.firstName, r.lastName);
                  const canCall = !!r.phone?.trim();
                  const courtColor = courts.find((c) => c.name === r.courtName)?.color ?? theme.tint;
                  const statusConfig = {
                    booked: { label: 'Predstojeće', color: theme.tint },
                    cancelled: { label: 'Otkazano', color: theme.error },
                    no_show: { label: 'Nije se pojavio', color: '#f97316' },
                  };
                  const sc = { ...statusConfig[r.status] ?? statusConfig.booked };
                  const now = new Date();
                  const startDt = new Date(`${r.dateISO}T${r.startTime}`);
                  const endDt = new Date(`${r.dateISO}T${r.endTime}`);
                  if (r.status === 'booked') {
                    if (endDt < now) {
                      sc.label = 'Završeno';
                      sc.color = '#6b7280';
                    } else if (startDt > now) {
                      sc.label = 'Predstojeće';
                    } else {
                      sc.label = 'U toku';
                    }
                  }
                  const canAdminAction = r.status === 'booked' && startDt > now;

                  return (
                    <View
                      key={`res-${r.id}`}
                      style={[
                        styles.row,
                        canAdminAction ? styles.rowWithActions : styles.rowCompact,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}>
                      <View style={[styles.courtStrip, { backgroundColor: courtColor }]} />
                      <View style={styles.rowContent}>
                        <View style={styles.rowMain}>
                          <View style={styles.rowHeader}>
                            <View style={styles.rowTitleWrap}>
                              <Text style={[styles.rowTitle, { color: theme.text }]}>{fullName}</Text>
                              {(r.noShowCount ?? 0) > 0 && (
                                <Pressable
                                  onPress={() => setShowNoShowWarningModal(true)}
                                  hitSlop={8}>
                                  <Text style={styles.noShowWarn}> ⚠️</Text>
                                </Pressable>
                              )}
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: sc.color }]}>
                              <Text style={styles.statusBadgeText}>{sc.label}</Text>
                            </View>
                          </View>
                          <Text style={[styles.rowTime, { color: theme.text }]}>
                            {formatTimeForDisplay(r.startTime)}–{formatTimeForDisplay(r.endTime)} ({getDurationLabel(r.durationMinutes)})
                          </Text>
                          <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                            {r.courtName}
                            {r.racket && ' • Reket'}
                            {r.priceDin > 0 && ` • ${r.priceDin} din`}
                          </Text>
                          <View style={styles.rowActions}>
                            <View style={styles.reservationActionsRow}>
                              {canCall && (
                                <Pressable
                                  onPress={() => handleCall(r.phone)}
                                  style={[styles.reservationActionBtn, { backgroundColor: theme.tint }]}>
                                  <Text style={styles.reservationActionText}>Pozovi</Text>
                                </Pressable>
                              )}
                              {canAdminAction && (
                                <>
                                  <Pressable
                                    onPress={() => handleAdminCancel(r.id)}
                                    style={[styles.reservationActionBtn, styles.reservationActionBtnOutline, { borderColor: theme.error }]}>
                                    <Text style={[styles.reservationActionTextOutline, { color: theme.error }]}>Otkaži termin</Text>
                                  </Pressable>
                                  <Pressable
                                    onPress={() => handleAdminMarkNoShow(r.id)}
                                    style={[styles.reservationActionBtn, styles.reservationActionBtnOutline, { borderColor: '#f97316' }]}>
                                    <Text style={[styles.reservationActionTextOutline, { color: '#f97316' }]}>Nije se pojavio</Text>
                                  </Pressable>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        {tab === 'blokade' && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Nova blokada</Text>
            <View style={[styles.blockForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Teren</Text>
              <CourtList
                courts={courts}
                selectedCourtId={effectiveBlockCourtId}
                onSelect={(id) => setBlockCourtId(id)}
              />
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Trajanje</Text>
              <View style={styles.durationRow}>
                <Pressable
                  onPress={() => setBlockDuration(60)}
                  style={[
                    styles.durChip,
                    { borderColor: theme.border },
                    blockDuration === 60 && { backgroundColor: theme.tint },
                  ]}>
                  <Text style={{ color: blockDuration === 60 ? '#fff' : theme.text }}>1h</Text>
                </Pressable>
                <Pressable
                  onPress={() => setBlockDuration(120)}
                  style={[
                    styles.durChip,
                    { borderColor: theme.border },
                    blockDuration === 120 && { backgroundColor: theme.tint },
                  ]}>
                  <Text style={{ color: blockDuration === 120 ? '#fff' : theme.text }}>2h</Text>
                </Pressable>
              </View>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Termini (više izbora)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
                {selectableSlots.map((s) => {
                  const sel = blockSelectedSlots.has(s.start);
                  return (
                    <Pressable
                      key={s.start}
                      onPress={() => toggleBlockSlot(s.start)}
                      style={[
                        styles.slotChip,
                        { borderColor: theme.border },
                        sel && { backgroundColor: '#f97316', borderColor: '#f97316' },
                      ]}>
                      <Text style={{ color: sel ? '#fff' : theme.text }}>
                        {formatTimeForDisplay(s.start)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Razlog blokade</Text>
              <TextInput
                value={blockReason}
                onChangeText={setBlockReason}
                placeholder="npr. Održavanje"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.reasonInput,
                  { backgroundColor: theme.surfaceMuted, color: theme.text, borderColor: theme.border },
                ]}
              />
              <PrimaryButton
                title="Blokiraj odabrane termine"
                onPress={handleCreateBlocksBulk}
                loading={isCreatingBulk}
                disabled={!blockCourtId || blockSelectedSlots.size === 0 || !blockReason.trim()}
                style={StyleSheet.flatten([styles.blockBtn, { backgroundColor: '#f97316' }])}
              />
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: 24 }]}>Aktivne blokade</Text>
            {blocksToRemove.size > 0 && (
              <PrimaryButton
                title="Ukloni odabrane blokade"
                onPress={handleCancelBlocksBulk}
                loading={isCancellingBulk}
                style={StyleSheet.flatten([styles.bulkRemoveBtn, { backgroundColor: theme.error }])}
              />
            )}
            {filteredBlocks.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nema aktivnih blokada.</Text>
            ) : (
              filteredBlocks.map((b) => {
                const isSelected = blocksToRemove.has(b.id);
                return (
                  <View
                    key={b.id}
                    style={[
                      styles.row,
                      styles.rowCompact,
                      styles.blockRow,
                      { backgroundColor: isSelected ? '#ffebcd' : '#fff3e0', borderColor: '#f97316' },
                    ]}>
                    <Pressable style={styles.blockRowSelectable} onPress={() => toggleBlockToRemove(b.id)}>
                      <View style={[styles.blockSelectIndicator, { backgroundColor: isSelected ? theme.tint : theme.border }]} />
                      <View style={styles.rowContent}>
                        <View style={styles.rowMain}>
                          <View style={[styles.badge, { backgroundColor: '#f97316' }]}>
                            <Text style={styles.badgeText}>BLOKIRANO</Text>
                          </View>
                          <Text style={[styles.rowTitle, styles.blockCardText]}>
                            {b.courtName} • {formatTimeForDisplay(b.startTime)}–{formatTimeForDisplay(b.endTime)}
                          </Text>
                          <Text style={[styles.rowSub, styles.blockCardTextSecondary]}>{b.reason}</Text>
                        </View>
                      </View>
                    </Pressable>
                    <PrimaryButton
                      title="Ukloni"
                      onPress={() => handleCancelBlock(b.id)}
                      variant="outline"
                      style={StyleSheet.flatten([styles.actionBtn, { borderColor: '#f97316' }])}
                      textStyle={{ color: '#f97316' }}
                    />
                  </View>
                );
              })
            )}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CancelConfirmationModal
        visible={showNoShowWarningModal}
        onCancel={() => setShowNoShowWarningModal(false)}
        title="Upozorenje"
        message="Korisnik ima prethodna nepojavljivanja."
        cancelLabel="OK"
        singleButton
      />

      <Modal
        visible={showHelpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelpModal(false)}>
        <View style={[styles.helpOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowHelpModal(false)}
          />
          <View style={[styles.helpModal, { backgroundColor: theme.surface }]}>
            <View style={styles.helpModalContent}>
              <Text style={[styles.helpTitle, { color: theme.text }]}>Pomoć – Admin panel</Text>
              <GestureScrollView
                style={styles.helpScroll}
                contentContainerStyle={styles.helpScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled">
              <Text style={[styles.helpSection, { color: theme.text }]}>Rezervacije</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Pregled rezervacija i blokada za izabrani datum. Pretraga po imenu ili broju telefona.
                Filteri: Teren (svi ili pojedinačni), Status (Sve, Predstojeće, Završeno, Otkazano, Nije se pojavio).
              </Text>
              <Text style={[styles.helpSection, { color: theme.text }]}>Kartice rezervacija</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '600' }}>Pozovi</Text> – otvara poziv na broj korisnika.{'\n'}
                <Text style={{ fontWeight: '600' }}>Otkaži termin</Text> – otkazuje rezervaciju.{'\n'}
                <Text style={{ fontWeight: '600' }}>Nije se pojavio</Text> – označava da korisnik nije došao na termin.
              </Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Ikona ⚠️ pored imena – korisnik ima prethodna nepojavljivanja. Dodirnite da vidite detalje.
              </Text>
              <Text style={[styles.helpSection, { color: theme.text }]}>Blokade</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Kreiranje blokada: izaberite teren, trajanje (1h ili 2h), termine i razlog. Blokirani termini nisu dostupni za rezervaciju.
                Možete ukloniti pojedinačne blokade ili više odjednom (označite ih pa „Ukloni odabrane blokade“).
              </Text>
              <Text style={[styles.helpSection, { color: theme.text }]}>Pregled popunjenosti</Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                Prikazuje koliko je termina popunjeno po terenu za izabrani dan.
              </Text>
              </GestureScrollView>
              <PrimaryButton
                title="Zatvori"
                onPress={() => setShowHelpModal(false)}
                style={styles.helpCloseBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { ...typography.title, fontSize: 24 },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  helpModal: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'stretch',
    height: '80%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  helpModalContent: { flex: 1, minHeight: 0 },
  helpTitle: { ...typography.title, marginBottom: 16, textAlign: 'center' },
  helpScroll: { flex: 1, minHeight: 0, marginBottom: 16 },
  helpScrollContent: { padding: 16, paddingBottom: 48, flexGrow: 1 },
  helpSection: { ...typography.subtitle, marginTop: 12, marginBottom: 4 },
  helpText: { ...typography.body, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  helpCloseBtn: { marginTop: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: { ...typography.button },
  section: { marginBottom: 24 },
  label: { ...typography.subtitle, marginBottom: 12 },
  searchSection: {},
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
    fontSize: 16,
  },
  overviewSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  overviewRow: { marginBottom: 12 },
  overviewLabel: { ...typography.subtitle, fontSize: 14, marginBottom: 4 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  filterLabel: { ...typography.body },
  filterScroll: { flex: 1 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: { ...typography.body },
  emptyText: { ...typography.body },
  row: {
    flexDirection: 'row',
    padding: 0,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  rowCompact: {},
  rowWithActions: { minHeight: 270 },
  courtStrip: { width: 6 },
  rowContent: { flex: 1, padding: 16, paddingBottom: 16 },
  rowMain: { flex: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  rowTitleWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowTitle: { ...typography.subtitle, fontSize: 17 },
  rowTime: { ...typography.body, fontSize: 15, marginBottom: 2 },
  rowSub: { ...typography.body, fontSize: 13, marginBottom: 8 },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  noShowWarn: {},
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { color: '#fff', ...typography.overline },
  phoneLink: { marginRight: 8 },
  pozoviBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pozoviText: { color: '#fff', ...typography.subtitle, fontSize: 13 },
  blockRow: {},
  blockCardText: { color: '#1f2937' },
  blockCardTextSecondary: { color: '#6b7280' },
  blockRowSelectable: { flex: 1, flexDirection: 'row' },
  blockSelectIndicator: { width: 6 },
  bulkRemoveBtn: { marginBottom: 16 },
  contentBlocks: { paddingBottom: 200 },
  reservationActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  reservationActionBtn: {
    height: 42,
    minWidth: 100,
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationActionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  reservationActionText: { color: '#fff', ...typography.subtitle, fontSize: 13, textAlign: 'center' },
  reservationActionTextOutline: { ...typography.subtitle, fontSize: 13, textAlign: 'center' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: '#fff', ...typography.overline },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  blockForm: { padding: 16, borderRadius: 12, borderWidth: 1 },
  fieldLabel: { ...typography.subtitle, fontSize: 14, marginBottom: 8, marginTop: 12 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  durChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  slotScroll: { marginBottom: 12 },
  slotChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...typography.body,
    marginBottom: 16,
  },
  blockBtn: { marginTop: 4 },
});
