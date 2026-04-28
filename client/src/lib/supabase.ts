// ============================================================
// MINDSHIFT AI — SUPABASE SYNC LAYER
// Activates only when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// are present. Falls back silently to localStorage-only.
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;
if (URL && KEY) {
  try {
    client = createClient(URL, KEY, {
      auth: { persistSession: false },
    });
  } catch {
    client = null;
  }
}

export const supabaseEnabled = client !== null;

// A stable device id so King's data stays linked without accounts.
const DEVICE_ID_KEY = 'ms_device_id';
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      (globalThis.crypto && 'randomUUID' in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `d_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Push a full bucket to Supabase. `kind` identifies the dataset
 * (journal, progress, fitness, sessions, weekly, memory).
 * Table schema expected (create once in SQL editor):
 *
 *   create table mindshift_sync (
 *     device_id text not null,
 *     kind      text not null,
 *     payload   jsonb not null,
 *     updated_at timestamptz default now(),
 *     primary key (device_id, kind)
 *   );
 *   alter table mindshift_sync enable row level security;
 *   create policy "anon rw own device" on mindshift_sync
 *     for all using (true) with check (true);
 */
export async function syncPush(kind: string, payload: unknown): Promise<boolean> {
  if (!client) return false;
  try {
    const { error } = await client
      .from('mindshift_sync')
      .upsert({
        device_id: getDeviceId(),
        kind,
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'device_id,kind' });
    return !error;
  } catch {
    return false;
  }
}

export async function syncPull<T>(kind: string): Promise<T | null> {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('mindshift_sync')
      .select('payload')
      .eq('device_id', getDeviceId())
      .eq('kind', kind)
      .maybeSingle();
    if (error || !data) return null;
    return data.payload as T;
  } catch {
    return null;
  }
}
