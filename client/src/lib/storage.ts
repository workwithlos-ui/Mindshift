// ============================================================
// MINDSHIFT AI — LOCAL STORAGE LAYER
// ============================================================

export interface JournalEntry {
  id: string;
  date: string;        // ISO date string
  content: string;
  createdAt: number;
}

export interface FitnessLog {
  id: string;
  date: string;
  activity: string;
  duration?: number;   // minutes
  weight?: number;     // lbs
  sleep?: number;      // hours
  energy?: number;     // 1-5
  createdAt: number;
}

export interface DailyProgress {
  date: string;
  revenueMoved: boolean;
  meaningfulActions: number;
  contentProduced: number;
  outreachActions: number;
  priority: string;    // ONE priority for the day
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

// ── Generic helpers ──────────────────────────────────────────
function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function set<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
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
  set(JOURNAL_KEY, entries.slice(0, 90)); // keep 90 days
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

export interface WorkSession {
  date: string;
  duration: number; // seconds
  completedAt: number;
}

export function saveWorkSession(duration: number): void {
  const all = get<WorkSession[]>(SESSIONS_KEY, []);
  all.unshift({ date: new Date().toISOString().split('T')[0], duration, completedAt: Date.now() });
  set(SESSIONS_KEY, all.slice(0, 90));
}

export function getTodaySessions(): WorkSession[] {
  const today = new Date().toISOString().split('T')[0];
  return get<WorkSession[]>(SESSIONS_KEY, []).filter(s => s.date === today);
}
