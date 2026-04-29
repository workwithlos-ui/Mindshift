// ============================================================
// MINDSHIFT AI — STORAGE LAYER
// Primary: localStorage. Secondary: Supabase sync (if enabled).
// ============================================================
import { supabaseEnabled, syncPush, syncPull } from './supabase';

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  createdAt: number;
}
export interface FitnessLog {
  id: string;
  date: string;
  activity: string;
  duration?: number;
  weight?: number;
  sleep?: number;
  energy?: number;
  createdAt: number;
}
export interface DailyProgress {
  date: string;
  revenueMoved: boolean;
  meaningfulActions: number;
  contentProduced: number;
  outreachActions: number;
  priority: string;
  notes?: string;
}
export interface WeeklyReview {
  weekStart: string;
  produced: string;
  wasted: string;
  remove: string;
  repeat: string;
  scale: string;
}
export interface WorkSession {
  date: string;
  duration: number;
  completedAt: number;
}
// AI memory — stored messages across sessions
export interface MemoryMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}
// User-provided context facts the AI should always know
export interface MemoryProfile {
  notes: string[];   // "King is building Los Silva community", etc.
  updatedAt: number;
}

// ── Generic helpers ──────────────────────────────────────────
function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function set<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  // Fire-and-forget sync. Never blocks the UI.
  if (supabaseEnabled) { void syncPush(key, value); }
}

// ── Journal ──────────────────────────────────────────────────
const JOURNAL_KEY = 'ms_journal';
export function getJournalEntries(): JournalEntry[] {
  return get<JournalEntry[]>(JOURNAL_KEY, []);
}
export function saveJournalEntry(content: string): JournalEntry {
  const entries = getJournalEntries();
  const entry: JournalEntry = {
    id: `j_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    content,
    createdAt: Date.now(),
  };
  entries.unshift(entry);
  set(JOURNAL_KEY, entries.slice(0, 90));
  return entry;
}
export function deleteJournalEntry(id: string): void {
  const entries = getJournalEntries().filter(e => e.id !== id);
  set(JOURNAL_KEY, entries);
}

// ── Fitness ──────────────────────────────────────────────────
const FITNESS_KEY = 'ms_fitness';
export function getFitnessLogs(): FitnessLog[] {
  return get<FitnessLog[]>(FITNESS_KEY, []);
}
export function saveFitnessLog(log: Omit<FitnessLog, 'id' | 'createdAt'>): FitnessLog {
  const logs = getFitnessLogs();
  const entry: FitnessLog = { ...log, id: `f_${Date.now()}`, createdAt: Date.now() };
  logs.unshift(entry);
  set(FITNESS_KEY, logs.slice(0, 180));
  return entry;
}

// ── Progress ─────────────────────────────────────────────────
const PROGRESS_KEY = 'ms_progress';
export function getTodayProgress(): DailyProgress {
  const all = get<DailyProgress[]>(PROGRESS_KEY, []);
  const today = new Date().toISOString().split('T')[0];
  return all.find(p => p.date === today) ?? {
    date: today,
    revenueMoved: false,
    meaningfulActions: 0,
    contentProduced: 0,
    outreachActions: 0,
    priority: '',
  };
}
export function saveTodayProgress(progress: DailyProgress): void {
  const all = get<DailyProgress[]>(PROGRESS_KEY, []);
  const idx = all.findIndex(p => p.date === progress.date);
  if (idx >= 0) all[idx] = progress;
  else all.unshift(progress);
  set(PROGRESS_KEY, all.slice(0, 90));
}
export function getProgressHistory(): DailyProgress[] {
  return get<DailyProgress[]>(PROGRESS_KEY, []);
}

// ── Weekly review ────────────────────────────────────────────
const WEEKLY_KEY = 'ms_weekly';
export function getWeeklyReviews(): WeeklyReview[] {
  return get<WeeklyReview[]>(WEEKLY_KEY, []);
}
export function saveWeeklyReview(review: WeeklyReview): void {
  const all = getWeeklyReviews();
  const idx = all.findIndex(r => r.weekStart === review.weekStart);
  if (idx >= 0) all[idx] = review;
  else all.unshift(review);
  set(WEEKLY_KEY, all.slice(0, 52));
}

// ── Priority ─────────────────────────────────────────────────
const PRIORITY_KEY = 'ms_priority';
export function getTodayPriority(): string {
  const stored = get<{ date: string; priority: string } | null>(PRIORITY_KEY, null);
  const today = new Date().toISOString().split('T')[0];
  return stored?.date === today ? stored.priority : '';
}
export function saveTodayPriority(priority: string): void {
  const today = new Date().toISOString().split('T')[0];
  set(PRIORITY_KEY, { date: today, priority });
}

// ── Deep work sessions ───────────────────────────────────────
const SESSIONS_KEY = 'ms_sessions';
export function saveWorkSession(duration: number): void {
  const all = get<WorkSession[]>(SESSIONS_KEY, []);
  all.unshift({ date: new Date().toISOString().split('T')[0], duration, completedAt: Date.now() });
  set(SESSIONS_KEY, all.slice(0, 90));
}
export function getTodaySessions(): WorkSession[] {
  const today = new Date().toISOString().split('T')[0];
  return get<WorkSession[]>(SESSIONS_KEY, []).filter(s => s.date === today);
}

// ── AI memory ────────────────────────────────────────────────
const MEMORY_KEY = 'ms_ai_memory';
const PROFILE_KEY = 'ms_ai_profile';
const MEMORY_CAP = 200; // keep last 200 turns

export function getMemory(): MemoryMessage[] {
  return get<MemoryMessage[]>(MEMORY_KEY, []);
}
export function appendMemory(msg: MemoryMessage): void {
  const all = getMemory();
  all.push(msg);
  set(MEMORY_KEY, all.slice(-MEMORY_CAP));
}
export function clearMemory(): void {
  set(MEMORY_KEY, []);
}
export function getProfile(): MemoryProfile {
  return get<MemoryProfile>(PROFILE_KEY, { notes: [], updatedAt: 0 });
}
export function addProfileNote(note: string): void {
  const p = getProfile();
  p.notes.unshift(note);
  p.notes = p.notes.slice(0, 40);
  p.updatedAt = Date.now();
  set(PROFILE_KEY, p);
}
export function setProfileNotes(notes: string[]): void {
  set(PROFILE_KEY, { notes: notes.slice(0, 40), updatedAt: Date.now() });
}

// ── Weekly auto-report ───────────────────────────────────────
export interface WeeklyReport {
  weekStart: string;
  generatedAt: number;
  revenueDays: number;
  meaningfulActions: number;
  contentProduced: number;
  outreachActions: number;
  deepWorkMinutes: number;
  journalEntries: number;
  fitnessEntries: number;
  longestStreak: number;
  trend: 'up' | 'flat' | 'down';
  summary: string;    // AI- or heuristic-generated prose
}
const REPORTS_KEY = 'ms_reports';
export function getReports(): WeeklyReport[] {
  return get<WeeklyReport[]>(REPORTS_KEY, []);
}
export function saveReport(r: WeeklyReport): void {
  const all = getReports();
  const idx = all.findIndex(x => x.weekStart === r.weekStart);
  if (idx >= 0) all[idx] = r;
  else all.unshift(r);
  set(REPORTS_KEY, all.slice(0, 26));
}

// ── One-time remote pull on first launch (Supabase → local) ──
export async function hydrateFromRemote(): Promise<void> {
  if (!supabaseEnabled) return;
  const keys = [
    JOURNAL_KEY, FITNESS_KEY, PROGRESS_KEY, WEEKLY_KEY,
    PRIORITY_KEY, SESSIONS_KEY, MEMORY_KEY, PROFILE_KEY, REPORTS_KEY,
  ];
  await Promise.all(keys.map(async k => {
    // Only overwrite if local is empty (first-install recovery case)
    const local = localStorage.getItem(k);
    if (local) return;
    const remote = await syncPull<unknown>(k);
    if (remote != null) {
      try { localStorage.setItem(k, JSON.stringify(remote)); } catch {}
    }
  }));
}


// ── User profile (onboarding) ────────────────────────────────
export type FocusArea = 'mind' | 'body' | 'business' | 'all';
export interface UserProfile {
  name: string;
  role: string;        // e.g. "Founder", "Creator", "Operator"
  focus: FocusArea;
  goals: string;       // free-form
  handle?: string;     // future: social identifier
  onboardedAt: number;
}
const USER_PROFILE_KEY = 'ms_user_profile';
export function getUserProfile(): UserProfile | null {
  return get<UserProfile | null>(USER_PROFILE_KEY, null);
}
export function saveUserProfile(p: UserProfile): void {
  set(USER_PROFILE_KEY, p);
}
export function hasOnboarded(): boolean {
  const p = getUserProfile();
  return !!(p && p.name);
}

// ── Behavior log (personalization engine) ────────────────────
export type BehaviorEvent =
  | 'view:today' | 'view:execute' | 'view:journal' | 'view:fitness' | 'view:progress' | 'view:assistant'
  | 'affirm:swipe' | 'affirm:complete'
  | 'timer:start' | 'timer:complete'
  | 'journal:save' | 'fitness:save' | 'progress:action'
  | 'reset:tap' | 'scorecard:share' | 'onboard:complete';

export interface BehaviorEntry {
  event: BehaviorEvent;
  ts: number;
  hour: number;         // 0-23 when event fired
  date: string;         // YYYY-MM-DD
  meta?: Record<string, string | number>;
}
const BEHAVIOR_KEY = 'ms_behavior';
const BEHAVIOR_CAP = 1000;

export function logBehavior(event: BehaviorEvent, meta?: Record<string, string | number>): void {
  const now = new Date();
  const entry: BehaviorEntry = {
    event,
    ts: now.getTime(),
    hour: now.getHours(),
    date: now.toISOString().split('T')[0],
    meta,
  };
  const all = get<BehaviorEntry[]>(BEHAVIOR_KEY, []);
  all.push(entry);
  set(BEHAVIOR_KEY, all.slice(-BEHAVIOR_CAP));
}
export function getBehavior(): BehaviorEntry[] {
  return get<BehaviorEntry[]>(BEHAVIOR_KEY, []);
}
