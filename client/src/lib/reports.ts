// ============================================================
// MINDSHIFT AI — WEEKLY REPORT GENERATOR
// Runs automatically each Sunday. Cached for 7 days.
// ============================================================
import {
  getProgressHistory,
  getJournalEntries,
  getFitnessLogs,
  getReports,
  saveReport,
  type WeeklyReport,
} from './storage';
import { singleChat } from './ai';
import { kingSystemPrompt } from './content';

function isoDay(d: Date): string {
  return d.toISOString().split('T')[0];
}
export function weekStartIso(ref = new Date()): string {
  const d = new Date(ref);
  const day = d.getDay();               // 0=Sun
  const diff = d.getDate() - day;       // snap to Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return isoDay(d);
}
export function previousWeekStartIso(): string {
  const d = new Date(weekStartIso());
  d.setDate(d.getDate() - 7);
  return isoDay(d);
}

function daysOfWeek(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return isoDay(d);
  });
}

function longestStreak(dates: string[], hitOn: Set<string>): number {
  let best = 0, cur = 0;
  for (const d of dates) {
    if (hitOn.has(d)) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

export function computeReport(weekStart: string): WeeklyReport {
  const days = daysOfWeek(weekStart);
  const progress = getProgressHistory().filter(p => days.includes(p.date));
  const journal = getJournalEntries().filter(j => days.includes(j.date));
  const fitness = getFitnessLogs().filter(f => days.includes(f.date));

  const revenueDays = progress.filter(p => p.revenueMoved).length;
  const meaningfulActions = progress.reduce((a, p) => a + p.meaningfulActions, 0);
  const contentProduced = progress.reduce((a, p) => a + p.contentProduced, 0);
  const outreachActions = progress.reduce((a, p) => a + p.outreachActions, 0);
  const deepWorkMinutes = 0; // optional future integration

  const activeSet = new Set(
    progress.filter(p => p.meaningfulActions > 0 || p.revenueMoved).map(p => p.date),
  );
  const streak = longestStreak(days, activeSet);

  // Compare to previous week for trend
  const prevDays = daysOfWeek(previousWeekStartIso());
  const prev = getProgressHistory().filter(p => prevDays.includes(p.date));
  const prevScore = prev.reduce(
    (a, p) => a + (p.revenueMoved ? 1 : 0) + p.meaningfulActions + p.contentProduced, 0,
  );
  const curScore = revenueDays + meaningfulActions + contentProduced;
  const trend: WeeklyReport['trend'] =
    curScore > prevScore + 1 ? 'up'
    : curScore < prevScore - 1 ? 'down'
    : 'flat';

  const summary = buildHeuristicSummary({
    revenueDays, meaningfulActions, contentProduced,
    outreachActions, journal: journal.length, fitness: fitness.length, streak, trend,
  });

  return {
    weekStart,
    generatedAt: Date.now(),
    revenueDays,
    meaningfulActions,
    contentProduced,
    outreachActions,
    deepWorkMinutes,
    journalEntries: journal.length,
    fitnessEntries: fitness.length,
    longestStreak: streak,
    trend,
    summary,
  };
}

function buildHeuristicSummary(s: {
  revenueDays: number; meaningfulActions: number; contentProduced: number;
  outreachActions: number; journal: number; fitness: number;
  streak: number; trend: WeeklyReport['trend'];
}): string {
  const lines: string[] = [];
  if (s.revenueDays >= 5) lines.push(`Revenue moved on ${s.revenueDays}/7 days — this is the engine.`);
  else if (s.revenueDays >= 2) lines.push(`Revenue moved ${s.revenueDays}/7 days. Push for 5+ next week.`);
  else lines.push(`Revenue moved ${s.revenueDays}/7 days. Return to income-producing work first each day.`);

  if (s.meaningfulActions >= 15) lines.push(`${s.meaningfulActions} meaningful actions logged. High execution week.`);
  else if (s.meaningfulActions >= 7) lines.push(`${s.meaningfulActions} meaningful actions. Solid base — raise the floor.`);
  else lines.push(`${s.meaningfulActions} meaningful actions. Focus next week: 3 per day, nonnegotiable.`);

  if (s.contentProduced >= 4) lines.push(`${s.contentProduced} pieces of content shipped. Reach is expanding.`);
  else if (s.contentProduced >= 1) lines.push(`${s.contentProduced} piece(s) shipped. Daily publishing is the multiplier.`);
  else lines.push(`No content shipped. Reach stalls without output — fix first thing Monday.`);

  if (s.streak >= 5) lines.push(`Longest streak this week: ${s.streak} days. Momentum is compounding.`);
  if (s.trend === 'up') lines.push(`Trend: accelerating vs last week. Keep the pattern.`);
  else if (s.trend === 'down') lines.push(`Trend: softer than last week. Tighten the morning sequence.`);
  else lines.push(`Trend: flat vs last week. Introduce one new lever.`);

  if (s.fitness === 0) lines.push(`No fitness logs. Body is the foundation — log at least 3 next week.`);

  return lines.join(' ');
}

/**
 * Returns the most recent report, computing it if missing.
 * Always uses the current week's Sunday as the anchor.
 */
export function getOrComputeLatestReport(): WeeklyReport {
  const weekStart = previousWeekStartIso(); // last completed week
  const existing = getReports().find(r => r.weekStart === weekStart);
  if (existing) return existing;
  const r = computeReport(weekStart);
  saveReport(r);
  return r;
}

/** Attempt to enrich the latest report with an AI summary. */
export async function enrichLatestReportWithAi(): Promise<WeeklyReport | null> {
  const r = getOrComputeLatestReport();
  // Don't re-call AI if already enriched this session
  if (r.summary.length > 400) return r;
  try {
    const prose = await singleChat([
      { role: 'system', content: kingSystemPrompt },
      {
        role: 'user',
        content:
`Summarize King's week in 4-5 tight sentences. Direct tone. No fluff. No hype.
Numbers:
- Revenue days: ${r.revenueDays}/7
- Meaningful actions: ${r.meaningfulActions}
- Content produced: ${r.contentProduced}
- Outreach actions: ${r.outreachActions}
- Journal entries: ${r.journalEntries}
- Fitness entries: ${r.fitnessEntries}
- Longest streak: ${r.longestStreak} days
- Trend vs last week: ${r.trend}

End with one concrete focus for next week.`,
      },
    ]);
    const enriched: WeeklyReport = { ...r, summary: prose.trim() || r.summary };
    saveReport(enriched);
    return enriched;
  } catch {
    return r;
  }
}
