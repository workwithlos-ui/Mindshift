// ============================================================
// MINDSHIFT AI — SUPABASE BACKEND (auth + per-table sync)
// Activates when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are present.
// All operations are best-effort: if disabled or offline, falls back
// to localStorage silently.
// ============================================================
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;
if (URL && KEY) {
  try {
    client = createClient(URL, KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'ms_auth',
      },
    });
  } catch {
    client = null;
  }
}

export const supabase = client;
export const supabaseEnabled = client !== null;

// ============================================================
// AUTH
// ============================================================
export type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; user: User };

export async function getCurrentUser(): Promise<User | null> {
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  if (!client) {
    cb(null);
    return () => {};
  }
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signUp(email: string, password: string, name?: string) {
  if (!client) return { ok: false, error: 'Backend not configured.' };
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : {} },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user, needsConfirm: !data.session };
}

export async function signIn(email: string, password: string) {
  if (!client) return { ok: false, error: 'Backend not configured.' };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user };
}

export async function signOut() {
  if (!client) return;
  await client.auth.signOut();
}

// ============================================================
// PROFILE
// ============================================================
export interface CloudProfile {
  user_id: string;
  name?: string | null;
  role?: string | null;
  goals?: string | null;
  focus?: string | null;
  onboarded_at?: string | null;
}

export async function pushProfile(p: Omit<CloudProfile, 'user_id'>) {
  if (!client) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const { error } = await client
    .from('profiles')
    .upsert({ user_id: u.id, ...p, updated_at: new Date().toISOString() });
  return !error;
}

export async function pullProfile(): Promise<CloudProfile | null> {
  if (!client) return null;
  const u = await getCurrentUser();
  if (!u) return null;
  const { data, error } = await client.from('profiles').select('*').eq('user_id', u.id).maybeSingle();
  if (error || !data) return null;
  return data as CloudProfile;
}

// ============================================================
// JOURNAL
// ============================================================
export interface CloudJournalRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export async function pushJournal(rows: { id: string; body: string; created_at: string }[]) {
  if (!client || rows.length === 0) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const payload = rows.map(r => ({ ...r, user_id: u.id }));
  const { error } = await client.from('journal_entries').upsert(payload);
  return !error;
}

export async function pullJournal(): Promise<CloudJournalRow[]> {
  if (!client) return [];
  const u = await getCurrentUser();
  if (!u) return [];
  const { data, error } = await client
    .from('journal_entries')
    .select('*')
    .eq('user_id', u.id)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as CloudJournalRow[];
}

export async function deleteJournal(id: string) {
  if (!client) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const { error } = await client.from('journal_entries').delete().eq('id', id).eq('user_id', u.id);
  return !error;
}

// ============================================================
// PROGRESS
// ============================================================
export interface CloudProgressRow {
  user_id: string;
  date: string;
  built: boolean;
  revenue: boolean;
  content: boolean;
  outreach: boolean;
  health: boolean;
  notes?: string | null;
}

export async function pushProgressDay(day: Omit<CloudProgressRow, 'user_id'>) {
  if (!client) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const { error } = await client
    .from('progress_days')
    .upsert({ ...day, user_id: u.id, updated_at: new Date().toISOString() });
  return !error;
}

export async function pullProgress(): Promise<CloudProgressRow[]> {
  if (!client) return [];
  const u = await getCurrentUser();
  if (!u) return [];
  const { data, error } = await client
    .from('progress_days')
    .select('*')
    .eq('user_id', u.id)
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data as CloudProgressRow[];
}

// ============================================================
// FITNESS
// ============================================================
export interface CloudFitnessRow {
  id: string;
  user_id: string;
  kind: string;
  payload: unknown;
  created_at: string;
}

export async function pushFitness(rows: { id: string; kind: string; payload: unknown; created_at: string }[]) {
  if (!client || rows.length === 0) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const data = rows.map(r => ({ ...r, user_id: u.id }));
  const { error } = await client.from('fitness_logs').upsert(data);
  return !error;
}

export async function pullFitness(): Promise<CloudFitnessRow[]> {
  if (!client) return [];
  const u = await getCurrentUser();
  if (!u) return [];
  const { data, error } = await client
    .from('fitness_logs')
    .select('*')
    .eq('user_id', u.id)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as CloudFitnessRow[];
}

// ============================================================
// CHAT HISTORY
// ============================================================
export interface CloudChatRow {
  id: string;
  user_id: string;
  agent: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: unknown;
  created_at: string;
}

export async function pushChat(rows: { id: string; agent: string; role: 'user'|'assistant'; content: string; meta?: unknown; created_at: string }[]) {
  if (!client || rows.length === 0) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const data = rows.map(r => ({ ...r, user_id: u.id }));
  const { error } = await client.from('chat_history').upsert(data);
  return !error;
}

export async function pullChat(agent?: string): Promise<CloudChatRow[]> {
  if (!client) return [];
  const u = await getCurrentUser();
  if (!u) return [];
  let q = client.from('chat_history').select('*').eq('user_id', u.id);
  if (agent) q = q.eq('agent', agent);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as CloudChatRow[];
}

// ============================================================
// AGENT MEMORY (persistent + behavioral + team brief + per-agent)
// ============================================================
export async function pushMemory(scope: string, payload: unknown) {
  if (!client) return false;
  const u = await getCurrentUser();
  if (!u) return false;
  const { error } = await client
    .from('agent_memory')
    .upsert({ user_id: u.id, scope, payload, updated_at: new Date().toISOString() });
  return !error;
}

export async function pullMemory<T>(scope: string): Promise<T | null> {
  if (!client) return null;
  const u = await getCurrentUser();
  if (!u) return null;
  const { data, error } = await client
    .from('agent_memory')
    .select('payload')
    .eq('user_id', u.id)
    .eq('scope', scope)
    .maybeSingle();
  if (error || !data) return null;
  return data.payload as T;
}
