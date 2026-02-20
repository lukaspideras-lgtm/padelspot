import { combineDateAndTime } from './time';

/**
 * Proverava da li je slot u prošlosti.
 * Koristi lokalno vreme uređaja.
 */
export function isSlotInPast(
  selectedDateISO: string,
  slotStartTime: string
): boolean {
  const slotStart = combineDateAndTime(selectedDateISO, slotStartTime);
  return slotStart.getTime() < Date.now();
}
