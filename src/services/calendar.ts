// =============================================================================
// Calendar integration – optional, never blocks booking
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import type { Reservation } from '@/types';
import { combineDateAndTime } from '@/utils/time';

const PREFIX = 'padelspot_calendar_';
const EVENT_ID_PREFIX = 'padelspot_reservation_event_';

function keyEnabled(userId: string) {
  return `${PREFIX}calendarEnabled:${userId}`;
}

function keyPromptSeen(userId: string) {
  return `${PREFIX}calendarPromptSeen:${userId}`;
}

function keyEventId(reservationId: string) {
  return `${EVENT_ID_PREFIX}${reservationId}`;
}

export interface CalendarSettings {
  calendarEnabled: boolean;
  calendarPromptSeen: boolean;
}

export async function getCalendarSettings(userId: string): Promise<CalendarSettings> {
  if (!userId) return { calendarEnabled: false, calendarPromptSeen: false };
  try {
    const [enabledRaw, promptRaw] = await Promise.all([
      AsyncStorage.getItem(keyEnabled(userId)),
      AsyncStorage.getItem(keyPromptSeen(userId)),
    ]);
    return {
      calendarEnabled: enabledRaw === 'true',
      calendarPromptSeen: promptRaw === 'true',
    };
  } catch {
    return { calendarEnabled: false, calendarPromptSeen: false };
  }
}

export async function setCalendarEnabled(userId: string, enabled: boolean): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(keyEnabled(userId), enabled ? 'true' : 'false');
}

export async function setCalendarPromptSeen(userId: string, seen: boolean): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(keyPromptSeen(userId), seen ? 'true' : 'false');
}

/** Request calendar permission. Returns true if granted. */
export async function ensureCalendarPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Check calendar permission without requesting. */
export async function getCalendarPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'denied';
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'denied';
  }
}

/** Check if calendar API is available (iOS/Android only). */
export async function isCalendarAvailable(): Promise<boolean> {
  try {
    return await Calendar.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getCalendarEventId(reservationId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(keyEventId(reservationId));
  } catch {
    return null;
  }
}

async function setCalendarEventId(reservationId: string, eventId: string): Promise<void> {
  await AsyncStorage.setItem(keyEventId(reservationId), eventId);
}

async function removeCalendarEventId(reservationId: string): Promise<void> {
  await AsyncStorage.removeItem(keyEventId(reservationId));
}

export type RemoveCalendarResult =
  | { ok: true }
  | { ok: false; reason: 'permission_denied' }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'no_mapping' };

/**
 * Remove reservation from calendar when cancelled.
 * Always removes local mapping. Never throws.
 */
export async function removeReservationFromCalendar(
  reservationId: string
): Promise<RemoveCalendarResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'no_mapping' };
  try {
    const eventId = await getCalendarEventId(reservationId);
    if (!eventId) return { ok: false, reason: 'no_mapping' };

    const perm = await getCalendarPermissionStatus();
    if (perm !== 'granted') {
      await removeCalendarEventId(reservationId);
      return { ok: false, reason: 'permission_denied' };
    }

    try {
      await Calendar.deleteEventAsync(eventId);
      await removeCalendarEventId(reservationId);
      return { ok: true };
    } catch {
      await removeCalendarEventId(reservationId);
      return { ok: false, reason: 'not_found' };
    }
  } catch {
    return { ok: false, reason: 'no_mapping' };
  }
}

export interface AddToCalendarOptions {
  courtName: string;
  racket?: boolean;
}

const LOCATION = 'Padel Spot, Knjaževačka bb, Niš, Serbia, 18000';
const MAPS_LINK = 'https://maps.app.goo.gl/mNKmuUtQcqia2bsR8';

/**
 * Add a reservation to the device calendar.
 * Returns eventId on success, null on failure. Never throws.
 */
export async function addReservationToCalendar(
  reservation: Reservation,
  options: AddToCalendarOptions
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const available = await Calendar.isAvailableAsync();
    if (!available) return null;

    const calendarId = await getDefaultCalendarId();
    if (!calendarId) return null;

    const startDate = combineDateAndTime(reservation.dateISO, reservation.startTime);
    const endDate = combineDateAndTime(reservation.dateISO, reservation.endTime);

    const racketLine = options.racket != null
      ? `Reket: ${options.racket ? 'Da' : 'Ne'}\n`
      : '';

    const notes = [
      `Datum: ${reservation.dateISO}`,
      `Vreme: ${reservation.startTime}–${reservation.endTime}`,
      `Teren: ${reservation.courtName}`,
      racketLine,
      `Maps: ${MAPS_LINK}`,
    ]
      .filter(Boolean)
      .join('\n');

    const alarms: Calendar.Alarm[] = [
      { relativeOffset: -1440 }, // 24h before
      { relativeOffset: -120 },  // 2h before
    ];

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `Padel Spot — ${options.courtName}`,
      startDate,
      endDate,
      location: LOCATION,
      notes,
      alarms,
    });

    await setCalendarEventId(reservation.id, eventId);
    return eventId;
  } catch {
    return null;
  }
}

async function getDefaultCalendarId(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios') {
      const cal = await Calendar.getDefaultCalendarAsync();
      return cal?.id ?? null;
    }
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const primary = cals.find((c) => c.isPrimary ?? false) ?? cals[0];
    return primary?.id ?? null;
  } catch {
    return null;
  }
}
