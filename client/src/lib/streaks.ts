// ============================================================
// MINDSHIFT AI — STREAK LOGIC
// Detects missed days, unlocks Expansion Mode, fires nudges.
// ============================================================
import { getProgressHistory, type DailyProgress } from './storage';
import { fireStreakBreak, fireExpansion, permission } from './notifications';

const LAST_NUDGE_KEY = 'ms_last_nudge';

function isoDay(d: Date): string {
  return d.toISOString().split('T')[0];
}

function isActive(p: DailyProgress): boolean {
  return p.revenueMoved || p.meaningfulActions > 0 || p.contentProduced > 0;
}

export interface StreakState {
  current: number;         // consecutive days including today
  previous: number;        // the run just before
  missedYesterday: boolean;
  expansionUnlocked: boolean;
  justUnlockedExpansion: boolean;
}

export function computeStreak(): StreakState {
  const hist = getProgressHistory();
  const hit = new Set(hist.filter(isActive).map(p => p.date));

  const today = new Date();
  const todayIso = isoDay(today);
  const yIso = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return isoDay(d);
  })();

  // current streak counting backwards from today (or from yesterday if today empty)
  let cur = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = isoDay(d);
    if (hit.has(iso)) cur++;
    else if (iso === todayIso) continue; // today blank doesn't break
    else break;
  }

  // previous streak — last run before the current gap
  let prev = 0;
  // find most recent inactive day, then count backwards
  let foundGap = false;
  for (let i = 0; i < 120; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = isoDay(d);
    if (!foundGap) {
      if (!hit.has(iso) && iso !== todayIso) foundGap = true;
    } else {
      if (hit.has(iso)) prev++;
      else break;
    }
  }

  const missedYesterday = !hit.has(yIso);
  const expansionUnlocked = cur >= 7;

  // Fire unlock notification exactly once per streak entry to 7
  const wasUnlocked = localStorage.getItem('ms_expansion_unlocked') === 'true';
  const justUnlockedExpansion = expansionUnlocked && !wasUnlocked;
  localStorage.setItem('ms_expansion_unlocked', expansionUnlocked ? 'true' : 'false');

  return { current: cur, previous: prev, missedYesterday, expansionUnlocked, justUnlockedExpansion };
}

/**
 * Fires a streak-break nudge at most once per day.
 */
export function maybeNudge(state: StreakState): void {
  if (permission() !== 'granted') return;
  const today = new Date().toISOString().split('T')[0];
  const last = localStorage.getItem(LAST_NUDGE_KEY);
  if (last === today) return;

  if (state.missedYesterday && state.previous >= 3) {
    fireStreakBreak();
    localStorage.setItem(LAST_NUDGE_KEY, today);
  } else if (state.justUnlockedExpansion) {
    fireExpansion();
    localStorage.setItem(LAST_NUDGE_KEY, today);
  }
}
