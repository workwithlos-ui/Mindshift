// ============================================================
// MINDSHIFT AI — STORAGE LAYER
// Primary: localStorage. Secondary: Supabase sync (if enabled).
// ============================================================
import {
  supabaseEnabled,
  pushJournal, pullJournal, deleteJournal as cloudDeleteJournal,
  pushProgressDay, pullProgress,
  pushFitness, pullFitness,
  pushChat, pullChat,
  pushMemory, pullMemory,
  pushProfile, pullProfile,
  getCurrentUser,
} from './supabase';

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
  // Per-key fire-and-forget cloud sync (only if signed in).
  if (supabaseEnabled) { void cloudSyncKey(key, value); }
}

// Map a localStorage key change to its appropriate Supabase write.
async function cloudSyncKey(key: string, value: unknown): Promise<void> {
  try {
    const u = await getCurrentUser();
    if (!u) return;
    switch (key) {
      case JOURNAL_KEY:
        await pushJournal((value as JournalEntry[]).map(e => ({
          id: e.id, body: e.content, created_at: new Date(e.createdAt).toISOString(),
        })));
        return;
      case FITNESS_KEY:
        await pushFitness((value as FitnessLog[]).map(l => ({
          id: l.id, kind: l.activity, payload: l, created_at: new Date(l.createdAt).toISOString(),
        })));
        return;
      case PROGRESS_KEY:
        await Promise.all((value as DailyProgress[]).map(p =>
          pushProgressDay({
            date: p.date,
            built: p.meaningfulActions > 0,
            revenue: p.revenueMoved,
            content: p.contentProduced > 0,
            outreach: p.outreachActions > 0,
            health: false,
            notes: p.notes ?? null,
          })
        ));
        return;
      case USER_PROFILE_KEY: {
        const p = value as UserProfile | null;
        if (!p) return;
        await pushProfile({
          name: p.name, role: p.role, goals: p.goals, focus: p.focus,
          onboarded_at: new Date(p.onboardedAt).toISOString(),
        });
        return;
      }
      // Memory + behavior + sessions + reports + priority + weekly all go to agent_memory by scope
      case MEMORY_KEY:    await pushMemory('chat_history_legacy', value); return;
      case PROFILE_KEY:   await pushMemory('persistent_facts', value); return;
      case SESSIONS_KEY:  await pushMemory('work_sessions', value); return;
      case PRIORITY_KEY:  await pushMemory('today_priority', value); return;
      case WEEKLY_KEY:    await pushMemory('weekly_reviews', value); return;
      case REPORTS_KEY:   await pushMemory('weekly_reports', value); return;
      case BEHAVIOR_KEY:  await pushMemory('behavior_log', value); return;
    }
  } catch { /* silent */ }
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
  if (supabaseEnabled) { void cloudDeleteJournal(id); }
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

// ── Hydrate local from remote on sign-in (Supabase → local) ──
// Always runs after a successful login. Cloud is the source of truth
// for the signed-in user — local is a cache + offline buffer.
export async function hydrateFromRemote(): Promise<void> {
  if (!supabaseEnabled) return;
  const u = await getCurrentUser();
  if (!u) return;
  try {
    // Profile
    const profile = await pullProfile();
    if (profile) {
      const local: UserProfile = {
        name: profile.name ?? '',
        role: profile.role ?? '',
        focus: (profile.focus as FocusArea) ?? 'all',
        goals: profile.goals ?? '',
        onboardedAt: profile.onboarded_at ? new Date(profile.onboarded_at).getTime() : Date.now(),
      };
      try { localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(local)); } catch {}
    }

    // Journal
    const journal = await pullJournal();
    if (journal.length) {
      const local: JournalEntry[] = journal.map(r => ({
        id: r.id,
        content: r.body,
        date: r.created_at.split('T')[0],
        createdAt: new Date(r.created_at).getTime(),
      }));
      try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(local)); } catch {}
    }

    // Progress
    const progress = await pullProgress();
    if (progress.length) {
      const local: DailyProgress[] = progress.map(p => ({
        date: p.date,
        revenueMoved: p.revenue,
        meaningfulActions: p.built ? 1 : 0,
        contentProduced: p.content ? 1 : 0,
        outreachActions: p.outreach ? 1 : 0,
        priority: '',
        notes: p.notes ?? undefined,
      }));
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(local)); } catch {}
    }

    // Fitness
    const fitness = await pullFitness();
    if (fitness.length) {
      const local: FitnessLog[] = fitness.map(f => {
        const p = (f.payload ?? {}) as Partial<FitnessLog>;
        return {
          id: f.id,
          date: f.created_at.split('T')[0],
          activity: f.kind,
          duration: p.duration,
          weight: p.weight,
          sleep: p.sleep,
          energy: p.energy,
          createdAt: new Date(f.created_at).getTime(),
        };
      });
      try { localStorage.setItem(FITNESS_KEY, JSON.stringify(local)); } catch {}
    }

    // Chat history
    const chat = await pullChat();
    if (chat.length) {
      const local: MemoryMessage[] = chat.map(c => ({
        role: c.role,
        content: c.content,
        ts: new Date(c.created_at).getTime(),
      }));
      try { localStorage.setItem(MEMORY_KEY, JSON.stringify(local.slice(-MEMORY_CAP))); } catch {}
    }

    // Persistent facts (profile notes)
    const facts = await pullMemory<MemoryProfile>('persistent_facts');
    if (facts) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(facts)); } catch {} }

    // Misc memory scopes
    for (const [scope, key] of [
      ['work_sessions',   SESSIONS_KEY],
      ['today_priority',  PRIORITY_KEY],
      ['weekly_reviews',  WEEKLY_KEY],
      ['weekly_reports',  REPORTS_KEY],
      ['behavior_log',    BEHAVIOR_KEY],
    ] as const) {
      const remote = await pullMemory<unknown>(scope);
      if (remote != null) { try { localStorage.setItem(key, JSON.stringify(remote)); } catch {} }
    }
  } catch { /* silent — keep local as-is on failure */ }
}

// Push every local bucket to remote (manual or post-signin sync up).
export async function pushAllToRemote(): Promise<void> {
  if (!supabaseEnabled) return;
  const u = await getCurrentUser();
  if (!u) return;
  await Promise.all([
    cloudSyncKey(USER_PROFILE_KEY, getUserProfile()),
    cloudSyncKey(JOURNAL_KEY, getJournalEntries()),
    cloudSyncKey(FITNESS_KEY, getFitnessLogs()),
    cloudSyncKey(PROGRESS_KEY, getProgressHistory()),
    cloudSyncKey(MEMORY_KEY, getMemory()),
    cloudSyncKey(PROFILE_KEY, getProfile()),
    cloudSyncKey(SESSIONS_KEY, get<WorkSession[]>(SESSIONS_KEY, [])),
    cloudSyncKey(PRIORITY_KEY, get<{date:string;priority:string}|null>(PRIORITY_KEY, null)),
    cloudSyncKey(WEEKLY_KEY, getWeeklyReviews()),
    cloudSyncKey(REPORTS_KEY, getReports()),
    cloudSyncKey(BEHAVIOR_KEY, getBehavior()),
  ]);
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
  // Use onboardedAt so skip-via-nav also counts as onboarded
  return !!(p && p.onboardedAt);
}

// ── Behavior log (personalization engine) ────────────────────
export type BehaviorEvent =
  | 'view:today' | 'view:execute' | 'view:journal' | 'view:fitness' | 'view:progress' | 'view:assistant'
  | 'affirm:swipe' | 'affirm:complete'
  | 'timer:start' | 'timer:complete'
  | 'journal:save' | 'fitness:save' | 'progress:action'
  | 'reset:tap' | 'scorecard:share' | 'onboard:complete' | 'onboard:skipped-via-nav';

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
