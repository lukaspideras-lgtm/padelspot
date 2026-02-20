// =============================================================================
// Reservations service – Supabase RPC
// =============================================================================

import { supabase } from '@/src/lib/supabase';
import type { AdminReservation, Reservation } from '@/types';

function parseRpcError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: string }).message ?? '';
    if (msg.includes('conflict_overlap')) return 'Termin je zauzet. Izaberite drugi.';
    if (msg.includes('auth_required')) return 'Morate biti ulogovani.';
    if (msg.includes('booking_window')) return 'Rezervacije su dostupne do 30 dana unapred.';
    if (msg.includes('past_time')) return 'Termin je u prošlosti.';
    if (msg.includes('cancel_too_late')) return 'Termin se ne može otkazati manje od 2h pre početka.';
    if (msg.includes('not_found')) return 'Rezervacija nije pronađena.';
    if (msg.includes('already_cancelled')) return 'Rezervacija je već otkazana.';
    if (msg.includes('admin_required')) return 'Pristup samo za administratore.';
    return msg;
  }
  return 'Greška pri rezervaciji.';
}

export async function getAvailability(
  dateISO: string,
  courtId: string,
  durationMinutes: 60 | 120
): Promise<string[]> {
  const { data, error } = await supabase.rpc('list_availability', {
    date_iso: dateISO,
    court_id: courtId,
    duration_minutes: durationMinutes,
  });
  if (error) return [];
  return Array.isArray(data) ? data : [];
}

export async function create(params: {
  courtId: string;
  dateISO: string;
  startHHmm: string;
  durationMinutes: 60 | 120;
  racket?: boolean;
}): Promise<Reservation> {
  const { data, error } = await supabase.rpc('create_reservation', {
    p_court_id: params.courtId,
    p_date_iso: params.dateISO,
    p_start_hhmm: params.startHHmm,
    p_duration_minutes: params.durationMinutes,
    p_racket: params.racket ?? false,
  });

  if (error) throw new Error(parseRpcError(error));

  const row = data as { id: string; court_id: string; start_time: string; end_time: string };
  if (!row?.id) throw new Error('Rezervacija nije kreirana.');

  const { data: courtRow } = await supabase
    .from('courts')
    .select('name')
    .eq('id', row.court_id)
    .single();

  const startDate = new Date(row.start_time);
  const endDate = new Date(row.end_time);
  const dateISO = row.start_time.slice(0, 10);
  const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  return {
    id: row.id,
    userEmail: '',
    courtName: courtRow?.name ?? '',
    dateISO,
    startTime,
    endTime,
    status: 'Rezervisano',
  };
}

export async function cancel(reservationId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_reservation', {
    p_reservation_id: reservationId,
  });
  if (error) throw new Error(parseRpcError(error));
}

export async function listMine(): Promise<Reservation[]> {
  const { data, error } = await supabase.rpc('list_reservations_mine');
  if (error) return [];

  return (data ?? []).map((row: { id: string; user_email: string; court_name: string; date_iso: string; start_time: string; end_time: string; status: string; created_at?: string }) => ({
    id: row.id,
    userEmail: row.user_email ?? '',
    courtName: row.court_name ?? '',
    dateISO: row.date_iso ?? '',
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
    status: row.status as 'Rezervisano' | 'Otkazano',
    createdAt: row.created_at,
  }));
}

export async function listAllForAdmin(
  dateISO: string,
  search?: string | null
): Promise<AdminReservation[]> {
  const { data, error } = await supabase.rpc('list_reservations_admin', {
    p_date_iso: dateISO,
    p_search: search?.trim() || null,
  });
  if (error) return [];

  return (data ?? []).map((row: {
    id: string;
    court_name: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    status: string;
    price_din: number;
    racket: boolean;
    first_name: string;
    last_name: string;
    phone: string;
    no_show_count: number;
  }) => {
    const startDate = new Date(row.start_time);
    const endDate = new Date(row.end_time);
    const dateISO = row.start_time.slice(0, 10);
    const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    return {
      id: row.id,
      courtName: row.court_name ?? '',
      startTime,
      endTime,
      durationMinutes: row.duration_minutes ?? 60,
      status: row.status as 'booked' | 'cancelled' | 'no_show',
      priceDin: row.price_din ?? 0,
      racket: row.racket ?? false,
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      phone: row.phone ?? '',
      dateISO,
      noShowCount: row.no_show_count ?? 0,
    };
  });
}

export async function adminCancelReservation(reservationId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_cancel_reservation', {
    p_reservation_id: reservationId,
  });
  if (error) throw new Error(parseRpcError(error));
}

export async function adminMarkNoShow(reservationId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_mark_no_show', {
    p_reservation_id: reservationId,
  });
  if (error) throw new Error(parseRpcError(error));
}
