// ============================================================
// MINDSHIFT AI — PROACTIVE INSIGHTS
// Generated from behavioral + progress data and surfaced on Today
// without the user asking. Cached per day so it's deterministic.
// ============================================================
import { getBehavioral } from './memory';
import {
  getProgressHistory, getFitnessLogs, getJournalEntries,
} from './storage';
import { addInsight, getInsights, type TeamInsight } from './agentContext';
import type { AgentId } from './agents';

const LAST_GEN_KEY = 'ms_insights_last_gen';

// Each rule is deterministic: given the data, it produces 0 or 1 insight.
// They run on app open; generated insights go into the shared store
// and appear in the Team Brief on Today.
interface Rule {
  id: string;
  agent: AgentId;
  check: () => string | null;
}

const RULES: Rule[] = [
  // ── Growth: revenue trend
  {
    id: 'growth-revenue-trend',
    agent: 'growth',
    check: () => {
      const hist = getProgressHistory();
      const last7 = hist.slice(0, 7);
      const prev7 = hist.slice(7, 14);
      if (last7.length < 4 || prev7.length < 4) return null;
      const curRev = last7.filter(p => p.revenueMoved).length;
      const prevRev = prev7.filter(p => p.revenueMoved).length;
      if (curRev > prevRev && curRev >= 3) {
        const delta = curRev - prevRev;
        return `Revenue days up ${delta} week-over-week (${curRev}/7 vs ${prevRev}/7). Keep the pattern — don't break rhythm.`;
      }
      if (prevRev > 0 && curRev < prevRev - 1) {
        return `Revenue days dropped from ${prevRev}/7 to ${curRev}/7. Pick one pipeline action today — don't plan, ship.`;
      }
      return null;
    },
  },

  // ── Growth: revenue zero for 3+ days
  {
    id: 'growth-revenue-drought',
    agent: 'growth',
    check: () => {
      const hist = getProgressHistory();
      const last3 = hist.slice(0, 3);
      if (last3.length < 3) return null;
      if (last3.every(p => !p.revenueMoved)) {
        return `Zero revenue movement in 3 days. Smallest next step: send one pitch, not ten.`;
      }
      return null;
    },
  },

  // ── Analytics: streak context
  {
    id: 'analytics-streak',
    agent: 'analytics',
    check: () => {
      const b = getBehavioral();
      if (b.streak >= 7 && b.streak < 14) return `${b.streak}-day streak live. Expansion Mode unlocked — consistency is now identity.`;
      if (b.streak >= 14) return `${b.streak}-day streak. This is baseline now. Don't celebrate — compound.`;
      if (b.streak === 0 && b.last7Days.actions === 0) return `Streak is 0 and no actions this week. One action resets everything.`;
      return null;
    },
  },

  // ── Analytics: output trend
  {
    id: 'analytics-trend',
    agent: 'analytics',
    check: () => {
      const b = getBehavioral();
      if (b.trend === 'up') return `Output trending up this week. Identify the one lever driving it and double it.`;
      if (b.trend === 'down') return `Output trending down vs last week. One question: what got added or removed?`;
      return null;
    },
  },

  // ── Marketing: content velocity
  {
    id: 'marketing-velocity',
    agent: 'marketing',
    check: () => {
      const b = getBehavioral();
      const c = b.last7Days.contentProduced;
      if (c === 0) return `No content shipped this week. Draft one hook today — speed over polish.`;
      if (c >= 5) return `${c} pieces of content this week. Pick the 2 that got the strongest signal and double down next week.`;
      return null;
    },
  },

  // ── Fitness: recovery flag
  {
    id: 'fitness-recovery',
    agent: 'fitness',
    check: () => {
      const logs = getFitnessLogs().slice(0, 5);
      const withSleep = logs.filter(l => l.sleep != null);
      const withEnergy = logs.filter(l => l.energy != null);
      if (withSleep.length >= 3) {
        const avg = withSleep.reduce((s, l) => s + (l.sleep || 0), 0) / withSleep.length;
        if (avg < 6) return `Sleep average under 6h the last 3+ logs. Recovery first. Drop one task, not one hour of sleep.`;
      }
      if (withEnergy.length >= 3) {
        const avg = withEnergy.reduce((s, l) => s + (l.energy || 0), 0) / withEnergy.length;
        if (avg < 5) return `Energy averaging ${avg.toFixed(1)}/10 — under-recovered. 20-min walk, no phone.`;
        if (avg >= 8) return `Energy averaging ${avg.toFixed(1)}/10 — green light. Push the hardest block today.`;
      }
      return null;
    },
  },

  // ── Research: journal pattern
  {
    id: 'research-journal',
    agent: 'research',
    check: () => {
      const journal = getJournalEntries();
      const last7 = journal.filter(j => j.createdAt > Date.now() - 7 * 24 * 3600 * 1000);
      if (last7.length === 0) return `No journal entries this week — you're running blind on self-signal. 3 sentences tonight.`;
      if (last7.length >= 5) return `${last7.length} entries this week. Pattern worth reading — ask the Research agent to synthesize.`;
      return null;
    },
  },

  // ── Build: deep work tempo
  {
    id: 'build-deepwork',
    agent: 'build',
    check: () => {
      const b = getBehavioral();
      if (b.last7Days.deepWorkSessions === 0) return `Zero deep work sessions this week. Start one 45-min block today — nothing else.`;
      if (b.last7Days.deepWorkSessions >= 5) return `${b.last7Days.deepWorkSessions} deep work sessions — strong tempo. Convert output to a shippable this week.`;
      return null;
    },
  },

  // ── Mindset: skipped routines
  {
    id: 'mindset-skipped',
    agent: 'mindset',
    check: () => {
      const b = getBehavioral();
      if (b.skipped.length >= 2) return `You're skipping: ${b.skipped.join(', ')}. Pick ONE to reinstate tomorrow. Not all.`;
      return null;
    },
  },
];

/**
 * Generate insights for today. Idempotent per day — running multiple times
 * returns the same result (cached via shared store dedupe).
 */
export function generateInsights(): TeamInsight[] {
  const today = new Date().toISOString().split('T')[0];
  const last = localStorage.getItem(LAST_GEN_KEY);

  // Run rules either if new day OR we have fewer than 3 insights cached
  const existing = getInsights();
  const todayInsights = existing.filter(i => new Date(i.ts).toISOString().split('T')[0] === today);
  if (last === today && todayInsights.length >= 3) return todayInsights;

  for (const r of RULES) {
    try {
      const out = r.check();
      if (out) addInsight(r.agent, out);
    } catch { /* never crash on an insight rule */ }
  }
  localStorage.setItem(LAST_GEN_KEY, today);

  // Return fresh set for today
  return getInsights().filter(i => new Date(i.ts).toISOString().split('T')[0] === today);
}
