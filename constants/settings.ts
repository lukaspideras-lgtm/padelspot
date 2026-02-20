// =============================================================================
// Centralna podešavanja – mock config za frontend
// TODO: Later fetch from backend (e.g. GET /api/settings)
// =============================================================================

export const SETTINGS = {
  /** Maksimalno dana unapred za rezervacije (od danas) */
  maxDaysAhead: 30,

  /** Koliko sati pre početka je još dozvoljeno otkazivanje */
  cancelWindowHours: 2,

  /** Radno vreme – početak */
  workingHoursStart: '09:00',

  /** Radno vreme – kraj */
  workingHoursEnd: '24:00',

  /** Trajanje osnovnog slot-a u minutama (1h) */
  slotDurationMinutes: 60,

  /** Dev: kada true, prikaži OfflineState (za testiranje). TODO: zameniti sa realnom NetInfo. */
  simulateOffline: false,
} as const;
