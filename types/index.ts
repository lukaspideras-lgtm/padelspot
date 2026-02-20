// =============================================================================
// Tipovi za PadelSpot aplikaciju
// TODO: Kasnije će se sinhronizovati sa Supabase/Firebase backend schemom
// =============================================================================

export type UserRole = 'user' | 'admin';

export interface User {
  email: string;
  ime: string;
  prezime: string;
  telefon: string;
  role: UserRole;
  /** From profiles.has_seen_tutorial; undefined = not fetched, false = show tutorial */
  hasSeenTutorial?: boolean;
}

export type ReservationStatus = 'Rezervisano' | 'Otkazano';

export interface Reservation {
  id: string;
  userEmail: string;
  courtName: string;
  dateISO: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  createdAt?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  reservationId?: string;
}

/** Admin panel – status rezervacije (DB: booked, cancelled, no_show) */
export type AdminReservationStatus = 'booked' | 'cancelled' | 'no_show';

/** Admin panel – rezervacija sa imenom, telefonom (ne email) */
export interface AdminReservation {
  id: string;
  courtName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AdminReservationStatus;
  priceDin: number;
  racket: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  dateISO: string;
  noShowCount?: number;
}

/** Admin panel – blokada */
export interface AdminBlock {
  id: string;
  courtName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  reason: string;
  status: 'active' | 'cancelled';
  dateISO: string;
}
