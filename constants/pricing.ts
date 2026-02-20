// =============================================================================
// Cenovnik - din/sat
// Pon-Pet 08-17: 2000 | Pon-Pet 18-24: 2400
// Sub-Ned 08-17: 2600 | Sub-Ned 18-24: 3000
// Reket: 300 din
// TODO: Kasnije iz backend konfiguracije
// =============================================================================

export const PRICE_WEEKDAY_08_17 = 2000;
export const PRICE_WEEKDAY_18_24 = 2400;
export const PRICE_WEEKEND_08_17 = 2600;
export const PRICE_WEEKEND_18_24 = 3000;
export const PRICE_RACKET = 300;

/** 0 = nedelja, 1 = ponedeljak, ... 6 = subota */
export function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Cena po satu za dati sat (0-23) i dan u nedelji.
 * Pricing blocks: 08:00-17:00 = start hours 8..16, 18:00-24:00 = start hours 18..23.
 * e.g. 23:00-24:00 uses rate for hour 23 (18-24 block).
 * Unit check: 23:00-24:00 should be non-zero; 22:00-24:00 (2h) = rate(22)+rate(23).
 */
export function getHourlyPrice(hour: number, dayOfWeek: number): number {
  const weekend = isWeekend(dayOfWeek);
  if (hour >= 18 && hour <= 23) return weekend ? PRICE_WEEKEND_18_24 : PRICE_WEEKDAY_18_24;
  if (hour >= 8 && hour < 18) return weekend ? PRICE_WEEKEND_08_17 : PRICE_WEEKDAY_08_17;
  return weekend ? PRICE_WEEKEND_08_17 : PRICE_WEEKDAY_08_17;
}

/**
 * Izračunaj ukupnu cenu za period. Uses start hour to decide rate for each hour.
 * End time 24:00 = 1440 min (midnight same day). Internal use only; display uses 00:00.
 */
export function calculatePrice(
  startTime: string,
  endTime: string,
  dateISO: string,
  addRacket = false
): number {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (eh === 0 && em === 0) endMinutes = 1440;

  let total = 0;
  while (startMinutes < endMinutes) {
    const hour = Math.floor(startMinutes / 60);
    total += getHourlyPrice(hour, dayOfWeek);
    startMinutes += 60;
  }

  if (addRacket) total += PRICE_RACKET;
  return total;
}
