// ============================================================
// MINDSHIFT AI — MULTI-TIER MEMORY
// Three layers, each injected into every agent prompt:
//   1. SESSION — the current conversation turns
//   2. PERSISTENT — profile + named facts (explicit from user)
//   3. BEHAVIORAL — patterns extracted from app usage
// ============================================================
import {
  getMemory, getProfile, getUserProfile, getProgressHistory,
  getJournalEntries, getFitnessLogs, getBehavior, getTodayProgress,
  type MemoryMessage, type BehaviorEntry, type DailyProgress,
} from './storage';
import { computeStreak } from './streaks';
import type { AgentId } from './agents';

// ────────────────────────────────────────────────────────────
// Session memory — last N turns of the active conversation
// ────────────────────────────────────────────────────────────
export function getSessionTurns(limit = 20): MemoryMessage[] {
  const all = getMemory();
  return all.slice(-limit);
}

// ────────────────────────────────────────────────────────────
// Persistent memory — profile + fact notes
// ────────────────────────────────────────────────────────────
export interface PersistentBlock {
  identity: string;     // name, role, focus
  facts: string[];      // explicit notes added by user in Settings
  goals: string;        // from onboarding
}

export function getPersistent(): PersistentBlock {
  const u = getUserProfile();
  const p = getProfile();
  const identity = u
    ? `King / ${u.name || 'Operator'}${u.role ? ' · ' + u.role : ''}${u.focus && u.focus !== 'all' ? ' · focus: ' + u.focus : ''}`
    : 'King (Los Silva / @loshustle) — founder, operator, creator';
  return {
    identity,
    facts: p.notes,
    goals: u?.goals ?? '',
  };
}

// ────────────────────────────────────────────────────────────
// Behavioral memory — patterns from app usage
// ────────────────────────────────────────────────────────────
export interface BehavioralBlock {
  activeHours: number[];            // hours where activity > threshold
  dominantScreen: string;           // most-visited
  skipped: string[];                // routines skipped repeatedly
  last7Days: {
    revenueDays: number;
    actions: number;
    contentProduced: number;
    outreachActions: number;
    deepWorkSessions: number;
    journalEntries: number;
    fitnessEntries: number;
  };
  streak: number;
  trend: 'up' | 'flat' | 'down';
}

export function getBehavioral(): BehavioralBlock {
  const behavior = getBehavior();
  const progress = getProgressHistory();
  const journal = getJournalEntries();
  const fitness = getFitnessLogs();
  const streakState = computeStreak();
  const streak = streakState.current;

  // Hours where user has activity in the last 30 days
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  const recent = behavior.filter(b => b.ts > cutoff);
  const hourCounts = new Array(24).fill(0);
  recent.forEach(b => { hourCounts[b.hour]++; });
  const maxHour = Math.max(...hourCounts, 1);
  const activeHours = hourCounts
    .map((c, h) => ({ c, h }))
    .filter(x => x.c >= maxHour * 0.4)
    .map(x => x.h);

  // Dominant screen
  const screenCounts: Record<string, number> = {};
  recent.forEach(b => {
    if (b.event.startsWith('view:')) {
      const s = b.event.slice(5);
      screenCounts[s] = (screenCounts[s] ?? 0) + 1;
    }
  });
  const dominantScreen = Object.entries(screenCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'today';

  // Skipped: routines the schema expects but the user isn't doing
  const skipped: string[] = [];
  const last7 = progress.slice(0, 7);
  const revDays = last7.filter(p => p.revenueMoved).length;
  if (last7.length >= 5 && revDays === 0) skipped.push('revenue tracking');
  const journalLast7 = journal.filter(j => j.createdAt > Date.now() - 7 * 24 * 3600 * 1000).length;
  if (journalLast7 < 2) skipped.push('evening journal');
  const fitnessLast7 = fitness.filter(f => f.createdAt > Date.now() - 7 * 24 * 3600 * 1000).length;
  if (fitnessLast7 < 2) skipped.push('fitness logging');

  // 7-day rollup
  const week = progress.slice(0, 7);
  const actions = week.reduce((s, p) => s + (p.meaningfulActions || 0), 0);
  const contentProduced = week.reduce((s, p) => s + (p.contentProduced || 0), 0);
  const outreachActions = week.reduce((s, p) => s + (p.outreachActions || 0), 0);
  const deepWorkSessions = behavior.filter(
    b => b.event === 'timer:complete' && b.ts > Date.now() - 7 * 24 * 3600 * 1000
  ).length;

  // Trend: compare last 7 days to the 7 before
  const prev7 = progress.slice(7, 14);
  const curScore = week.reduce((s, p) => s + scoreDay(p), 0);
  const prevScore = prev7.reduce((s, p) => s + scoreDay(p), 0);
  let trend: 'up' | 'flat' | 'down' = 'flat';
  if (curScore > prevScore * 1.15) trend = 'up';
  else if (curScore < prevScore * 0.85) trend = 'down';

  return {
    activeHours,
    dominantScreen,
    skipped,
    last7Days: {
      revenueDays: revDays,
      actions,
      contentProduced,
      outreachActions,
      deepWorkSessions,
      journalEntries: journalLast7,
      fitnessEntries: fitnessLast7,
    },
    streak,
    trend,
  };
}

function scoreDay(p: DailyProgress): number {
  return (p.revenueMoved ? 3 : 0) + (p.meaningfulActions || 0) + (p.contentProduced || 0) + (p.outreachActions || 0);
}

// ────────────────────────────────────────────────────────────
// Compose context for a specific agent. Each agent gets slightly
// different slices of data — e.g. Fitness gets fitness logs,
// Growth gets progress + revenue.
// ────────────────────────────────────────────────────────────
export function buildAgentContext(agentId: AgentId): string {
  const persistent = getPersistent();
  const behavioral = getBehavioral();
  const today = getTodayProgress();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const lines: string[] = [];
  lines.push('# CONTEXT — WHAT YOU KNOW ABOUT KING');
  lines.push('');
  lines.push(`Today is ${dateStr}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}.`);
  lines.push(`Identity: ${persistent.identity}`);
  if (persistent.goals) lines.push(`Stated goals: ${persistent.goals}`);
  if (persistent.facts.length) {
    lines.push(`Persistent facts:`);
    persistent.facts.slice(0, 12).forEach(f => lines.push(`- ${f}`));
  }
  lines.push('');
  lines.push('# LAST 7 DAYS (behavioral)');
  lines.push(`Streak: ${behavioral.streak} days · Trend: ${behavioral.trend}`);
  lines.push(`Revenue days: ${behavioral.last7Days.revenueDays}/7 · Actions: ${behavioral.last7Days.actions} · Content: ${behavioral.last7Days.contentProduced} · Outreach: ${behavioral.last7Days.outreachActions}`);
  lines.push(`Deep work sessions: ${behavioral.last7Days.deepWorkSessions} · Journal entries: ${behavioral.last7Days.journalEntries} · Fitness entries: ${behavioral.last7Days.fitnessEntries}`);
  if (behavioral.activeHours.length) {
    lines.push(`Most active hours: ${behavioral.activeHours.join(', ')}`);
  }
  if (behavioral.skipped.length) {
    lines.push(`Currently skipping: ${behavioral.skipped.join(', ')}`);
  }
  lines.push('');
  lines.push('# TODAY');
  if (today.priority) lines.push(`Priority: ${today.priority}`);
  lines.push(`Revenue moved: ${today.revenueMoved ? 'yes' : 'not yet'} · Actions: ${today.meaningfulActions} · Content: ${today.contentProduced} · Outreach: ${today.outreachActions}`);

  // Agent-specific extras
  lines.push('');
  if (agentId === 'fitness') {
    const logs = getFitnessLogs().slice(0, 5);
    if (logs.length) {
      lines.push('# RECENT FITNESS LOGS');
      logs.forEach(l => {
        const parts = [l.date, l.activity];
        if (l.sleep != null) parts.push(`sleep ${l.sleep}h`);
        if (l.energy != null) parts.push(`energy ${l.energy}/10`);
        if (l.weight != null) parts.push(`weight ${l.weight}`);
        lines.push(`- ${parts.join(' · ')}`);
      });
    } else {
      lines.push('# FITNESS: no logs yet — say "need data: log 3+ sessions".');
    }
  } else if (agentId === 'marketing' || agentId === 'research' || agentId === 'mindset') {
    const journal = getJournalEntries().slice(0, 3);
    if (journal.length) {
      lines.push('# LAST 3 JOURNAL ENTRIES (excerpts)');
      journal.forEach(j => {
        const excerpt = j.content.slice(0, 180).replace(/\n+/g, ' ');
        lines.push(`- ${j.date}: ${excerpt}${j.content.length > 180 ? '…' : ''}`);
      });
    }
  } else if (agentId === 'analytics' || agentId === 'growth') {
    const prog = getProgressHistory().slice(0, 14);
    if (prog.length) {
      lines.push('# LAST 14 DAYS (daily progress)');
      prog.forEach(p => {
        lines.push(`- ${p.date}: rev=${p.revenueMoved ? 1 : 0} actions=${p.meaningfulActions} content=${p.contentProduced} outreach=${p.outreachActions}`);
      });
    }
  }

  lines.push('');
  lines.push('# RULES');
  lines.push('- Ground every claim in the data above when possible.');
  lines.push('- If the data contradicts a story King tells himself, surface it directly.');
  lines.push('- Never fabricate numbers. If not in CONTEXT, say so.');

  return lines.join('\n');
}
