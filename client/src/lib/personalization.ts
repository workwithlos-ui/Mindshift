// ============================================================
// MINDSHIFT AI — PERSONALIZATION ENGINE
// Heuristic-only, no backend. Reads behavior log + progress history.
// Produces an adaptive briefing signal used by Today + Assistant.
// ============================================================
import { getBehavior, getProgressHistory, getUserProfile, type BehaviorEntry } from './storage';
import { computeStreak } from './streaks';

function computeLongest(): number {
  const hist = getProgressHistory();
  const active = new Set(
    hist.filter(p => p.revenueMoved || p.meaningfulActions > 0 || p.contentProduced > 0).map(p => p.date)
  );
  if (active.size === 0) return 0;
  const sorted = Array.from(active).sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000);
    if (diff === 1) { run++; longest = Math.max(longest, run); } else { run = 1; }
  }
  return longest;
}

function getStreak() {
  const s = computeStreak();
  return { current: s.current, longest: Math.max(computeLongest(), s.current) };
}

export interface BriefingSignal {
  greeting: string;       // "Good morning, King." or adaptive variant
  topLine: string;        // the one-line insight
  nudge?: string;         // optional gentle nudge
  accent: 'peach' | 'amethyst' | 'teal' | 'mint' | 'coral';
}

function partOfDay(h: number): 'morning' | 'midday' | 'evening' {
  if (h < 11) return 'morning';
  if (h < 17) return 'midday';
  return 'evening';
}

function recentEntries(days: number): BehaviorEntry[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return getBehavior().filter(b => b.ts >= cutoff);
}

export interface BehaviorStats {
  morningEngagement: number;  // 0-1: fraction of last 7 days with a morning open
  eveningEngagement: number;
  journalRate: number;        // 0-1: days with a journal save over last 7
  executeRate: number;        // 0-1: days with a timer started over last 7
  mostUsedView: 'today' | 'execute' | 'journal' | 'fitness' | 'progress' | 'assistant';
  daysActive: number;         // distinct active days in last 14
  lastMissedDay: string | null;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function analyzeBehavior(): BehaviorStats {
  const recent = recentEntries(7);
  const byDate = new Map<string, BehaviorEntry[]>();
  recent.forEach(e => {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  });
  const dates = Array.from(byDate.keys());

  let morningDays = 0, eveningDays = 0, journalDays = 0, executeDays = 0;
  dates.forEach(d => {
    const entries = byDate.get(d)!;
    if (entries.some(e => partOfDay(e.hour) === 'morning')) morningDays++;
    if (entries.some(e => partOfDay(e.hour) === 'evening')) eveningDays++;
    if (entries.some(e => e.event === 'journal:save')) journalDays++;
    if (entries.some(e => e.event === 'timer:start' || e.event === 'timer:complete')) executeDays++;
  });

  const viewCounts: Record<string, number> = {};
  recent.forEach(e => {
    if (e.event.startsWith('view:')) {
      const v = e.event.split(':')[1];
      viewCounts[v] = (viewCounts[v] ?? 0) + 1;
    }
  });
  const mostUsedView = (Object.entries(viewCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'today') as BehaviorStats['mostUsedView'];

  // Find last day without any activity (within last 14, before today)
  const history = getProgressHistory().slice(0, 14).map(p => p.date);
  const behaviorDates = new Set(recentEntries(14).map(e => e.date));
  let lastMissedDay: string | null = null;
  const today = new Date().toISOString().split('T')[0];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (!behaviorDates.has(d) && !history.includes(d)) {
      lastMissedDay = d;
      break;
    }
  }

  const daysActive = new Set(recentEntries(14).map(e => e.date)).size;
  const daysSample = Math.max(1, Math.min(7, dates.length));

  return {
    morningEngagement: morningDays / 7,
    eveningEngagement: eveningDays / 7,
    journalRate: journalDays / 7,
    executeRate: executeDays / 7,
    mostUsedView,
    daysActive,
    lastMissedDay,
  };
  void daysSample; void daysBetween;
}

export function getBriefing(): BriefingSignal {
  const hour = new Date().getHours();
  const pod = partOfDay(hour);
  const profile = getUserProfile();
  const name = profile?.name ?? 'King';
  const stats = analyzeBehavior();
  const streak = getStreak();

  const greetingBase =
    pod === 'morning' ? `Good morning, ${name}.` :
    pod === 'midday' ? `Good afternoon, ${name}.` :
    `Late night, ${name}.`;

  const accent: BriefingSignal['accent'] =
    pod === 'morning' ? 'peach' : pod === 'midday' ? 'amethyst' : 'teal';

  // Adaptive top-line
  let topLine = 'Begin now. Momentum compounds quickly.';
  let nudge: string | undefined;

  // First-week user — lean on focus area
  if (stats.daysActive < 3 && profile?.focus) {
    const focusMsg: Record<string, string> = {
      mind: 'Identity first. Action follows.',
      body: 'Strong body. Clear mind. Sharp decisions.',
      business: 'Pick one lever. Pull it. Measure it.',
      all: 'One protocol at a time. Stack the wins.',
    };
    topLine = focusMsg[profile.focus];
  }

  // Streak logic
  if (streak.current >= 7) {
    topLine = 'Expansion Mode. Your pace becomes the new standard.';
  } else if (streak.current >= 3) {
    topLine = `Day ${streak.current} of the streak. Protect it.`;
  }

  // Behavioral nudges
  if (pod === 'morning' && stats.morningEngagement < 0.4 && stats.daysActive >= 3) {
    nudge = 'You show up stronger in the afternoon. Try a lighter morning today.';
  } else if (pod === 'evening' && stats.eveningEngagement < 0.3 && stats.daysActive >= 3) {
    nudge = 'Two minutes now: what did you build? What moved money?';
  } else if (stats.journalRate < 0.2 && stats.mostUsedView === 'execute') {
    nudge = 'You execute well. Journaling once a week locks in the lessons.';
  } else if (stats.lastMissedDay) {
    nudge = 'Yesterday was quiet. One action now rebuilds the streak.';
  }

  return { greeting: greetingBase, topLine, nudge, accent };
}

/**
 * A small insight snippet injected into AI system prompts so the assistant
 * adapts tone based on actual behavior.
 */
export function getAIContext(): string {
  const profile = getUserProfile();
  const stats = analyzeBehavior();
  const streak = getStreak();
  const parts: string[] = [];
  if (profile) {
    parts.push(`User: ${profile.name}${profile.role ? `, ${profile.role}` : ''}.`);
    if (profile.focus && profile.focus !== 'all') parts.push(`Focus area: ${profile.focus}.`);
    if (profile.goals) parts.push(`Stated goal: ${profile.goals}.`);
  }
  parts.push(`Current streak: ${streak.current} days (best ${streak.longest}).`);
  parts.push(`Active ${stats.daysActive}/14 recent days. Most-used view: ${stats.mostUsedView}.`);
  if (stats.morningEngagement < 0.4) parts.push('Tends to skip mornings.');
  if (stats.journalRate < 0.2) parts.push('Rarely journals.');
  return parts.join(' ');
}
