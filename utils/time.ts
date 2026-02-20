/**
 * Time utilities - timezone-safe using device local time.
 */

import type { Reservation } from '@/types';

/**
 * Format time for display: 24:00 → 00:00 (midnight). Internal computations use 24:00.
 */
export function formatTimeForDisplay(timeHHmm: string): string {
  return timeHHmm === '24:00' ? '00:00' : timeHHmm;
}
import { SETTINGS } from '@/constants/settings';

/**
 * Combines date (YYYY-MM-DD) and time (HH:mm) into a local Date.
 */
export function combineDateAndTime(dateISO: string, timeHHmm: string): Date {
  const [year, month, day] = dateISO.split('-').map(Number);
  const [hours, minutes] = timeHHmm.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Minutes from now until the given date/time.
 * Positive = future, negative = past, 0 = now.
 */
export function minutesUntil(dateISO: string, timeHHmm: string): number {
  const target = combineDateAndTime(dateISO, timeHHmm);
  const now = Date.now();
  return Math.floor((target.getTime() - now) / 60_000);
}

/**
 * Formatira preostalo vreme do početka (npr. "Počinje za: 2h 30m").
 */
export function formatTimeRemaining(dateISO: string, timeHHmm: string): string {
  const mins = minutesUntil(dateISO, timeHHmm);
  if (mins < 0) return 'Prošlo';
  if (mins < 60) return `Počinje za: ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `Počinje za: ${h}h`;
  return `Počinje za: ${h}h ${m}m`;
}

/**
 * Returns true only if:
 * - status is "Rezervisano" (booked)
 * - reservation start is in the future
 * - at least cancelWindowHours remain until start
 */
export function canCancelReservation(reservation: Reservation): boolean {
  if (reservation.status !== 'Rezervisano') return false;
  const mins = minutesUntil(reservation.dateISO, reservation.startTime);
  const windowMins = SETTINGS.cancelWindowHours * 60;
  return mins >= windowMins;
}
