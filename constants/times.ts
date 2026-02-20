// =============================================================================
// Slotovi i radno vreme – koristi constants/settings.ts
// =============================================================================

import { SETTINGS } from './settings';

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

/**
 * Generiše slotove za izabrani period.
 * NIKAD ne generiše slot koji prelazi end vreme.
 */
export function generateSlots(
  start = SETTINGS.workingHoursStart,
  end = SETTINGS.workingHoursEnd,
  durationMinutes: number = SETTINGS.slotDurationMinutes
): TimeSlot[] {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: TimeSlot[] = [];
  let current = startMinutes;

  while (current + durationMinutes <= endMinutes) {
    const h1 = Math.floor(current / 60);
    const m1 = current % 60;
    const h2 = Math.floor((current + durationMinutes) / 60);
    const m2 = (current + durationMinutes) % 60;
    slots.push({
      start: `${h1.toString().padStart(2, '0')}:${m1.toString().padStart(2, '0')}`,
      end: `${h2.toString().padStart(2, '0')}:${m2.toString().padStart(2, '0')}`,
    });
    current += durationMinutes;
  }

  return slots;
}

// 1h slotovi: 09:00-10:00, 10:00-11:00, ... 23:00-24:00 (15 slotova)
export const TIME_SLOTS_1H = generateSlots(
  SETTINGS.workingHoursStart,
  SETTINGS.workingHoursEnd,
  60
);

/** @deprecated Koristiti TIME_SLOTS_1H ili generateSlots */
export const TIME_SLOTS = TIME_SLOTS_1H;
