// =============================================================================
// Courts service – Supabase
// =============================================================================

import { supabase } from '@/src/lib/supabase';

export interface Court {
  id: string;
  name: string;
  accent: string;
  color: string;
}

const ACCENT_TO_COLOR: Record<string, string> = {
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
};

export async function listActive(): Promise<Court[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('id, name, accent')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message ?? 'Greška pri učitavanju terena.');

  const list = data ?? [];
  if (__DEV__ && list.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[PadelSpot] No courts found; run init.sql seed in Supabase SQL Editor.');
  }

  return list.map((row) => ({
    id: row.id,
    name: row.name,
    accent: row.accent ?? 'green',
    color: ACCENT_TO_COLOR[row.accent as string] ?? '#22c55e',
  }));
}
