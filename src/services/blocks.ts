// =============================================================================
// Blocks service – Supabase RPC
// =============================================================================

import { supabase } from '@/src/lib/supabase';
import type { AdminBlock } from '@/types';

function parseRpcError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: string }).message ?? '';
    if (msg.includes('block_overlap')) return 'Blokada se preklapa sa postojećom.';
    if (msg.includes('conflict_reservation')) return 'Na ovom terminu postoji rezervacija. Otkažite je pre blokade.';
    if (msg.includes('auth_required')) return 'Morate biti ulogovani.';
    if (msg.includes('admin_required')) return 'Pristup samo za administratore.';
    if (msg.includes('reason_required')) return 'Unesite razlog blokade.';
    if (msg.includes('not_found')) return 'Blokada nije pronađena.';
    if (msg.includes('already_cancelled')) return 'Blokada je već uklonjena.';
    return msg;
  }
  return 'Greška pri blokadi.';
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function listForAdmin(dateISO: string): Promise<AdminBlock[]> {
  const { data, error } = await supabase.rpc('list_blocks_admin', {
    p_date_iso: dateISO,
  });
  if (error) return [];

  return (data ?? []).map((row: {
    id: string;
    court_name: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    reason: string;
    status: string;
  }) => ({
    id: row.id,
    courtName: row.court_name ?? '',
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    durationMinutes: row.duration_minutes ?? 60,
    reason: row.reason ?? '',
    status: row.status as 'active' | 'cancelled',
    dateISO,
  }));
}

export async function createBlock(params: {
  courtId: string;
  dateISO: string;
  startHHmm: string;
  durationMinutes: 60 | 120;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.rpc('create_block', {
    p_court_id: params.courtId,
    p_date_iso: params.dateISO,
    p_start_hhmm: params.startHHmm,
    p_duration_minutes: params.durationMinutes,
    p_reason: params.reason.trim(),
  });
  if (error) throw new Error(parseRpcError(error));
}

export async function cancelBlock(blockId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_block', {
    p_block_id: blockId,
  });
  if (error) throw new Error(parseRpcError(error));
}

export async function getAdminDailyOverview(dateISO: string): Promise<
  Array<{ courtId: string; courtName: string; totalSlots: number; filledSlots: number }>
> {
  const { data, error } = await supabase.rpc('admin_daily_overview', {
    p_date_iso: dateISO,
  });
  if (error) return [];

  return (data ?? []).map((row: { court_id: string; court_name: string; total_slots: number; filled_slots: number }) => ({
    courtId: row.court_id,
    courtName: row.court_name ?? '',
    totalSlots: row.total_slots ?? 15,
    filledSlots: row.filled_slots ?? 0,
  }));
}

export async function createBlocksBulk(params: {
  courtId: string;
  dateISO: string;
  startTimes: string[];
  durationMinutes: 60 | 120;
  reason: string;
}): Promise<{ inserted: number; conflicts: number }> {
  const { data, error } = await supabase.rpc('create_blocks_bulk', {
    p_court_id: params.courtId,
    p_date_iso: params.dateISO,
    p_start_times: params.startTimes,
    p_duration_minutes: params.durationMinutes,
    p_reason: params.reason.trim(),
  });
  if (error) throw new Error(parseRpcError(error));
  const result = data as { inserted?: number; conflicts?: number };
  return { inserted: result?.inserted ?? 0, conflicts: result?.conflicts ?? 0 };
}

export async function cancelBlocksBulk(blockIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('cancel_blocks_bulk', {
    p_block_ids: blockIds,
  });
  if (error) throw new Error(parseRpcError(error));
}
