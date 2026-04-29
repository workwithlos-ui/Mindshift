// ============================================================
// MINDSHIFT AI — SHARED AGENT CONTEXT STORE
// Agents emit handoff tags and cross-team notes. These get
// persisted and read by the next agent + shown in Team Brief.
// ============================================================
import type { AgentId } from './agents';

export interface HandoffNote {
  id: string;
  from: AgentId;
  to: AgentId;
  note: string;
  ts: number;
  // Consumed when the target agent has "seen" it (included in their context)
  consumed?: boolean;
}

export interface TeamInsight {
  id: string;
  agent: AgentId;
  insight: string;      // short, high-signal sentence
  ts: number;
  seen?: boolean;
}

const HANDOFFS_KEY = 'ms_handoffs';
const INSIGHTS_KEY = 'ms_agent_insights';

// ────────────────────────────────────────────────────────────
// Handoffs
// ────────────────────────────────────────────────────────────
export function getHandoffs(): HandoffNote[] {
  try {
    return JSON.parse(localStorage.getItem(HANDOFFS_KEY) || '[]');
  } catch { return []; }
}

export function addHandoff(h: Omit<HandoffNote, 'id' | 'ts'>): void {
  const all = getHandoffs();
  all.unshift({ ...h, id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ts: Date.now() });
  localStorage.setItem(HANDOFFS_KEY, JSON.stringify(all.slice(0, 80)));
}

export function getHandoffsFor(agent: AgentId, limit = 5): HandoffNote[] {
  return getHandoffs().filter(h => h.to === agent && !h.consumed).slice(0, limit);
}

export function markConsumed(ids: string[]): void {
  const all = getHandoffs().map(h => (ids.includes(h.id) ? { ...h, consumed: true } : h));
  localStorage.setItem(HANDOFFS_KEY, JSON.stringify(all));
}

// Parse [→agent] tags out of a raw assistant response.
const HANDOFF_RE = /\[\s*[→>-]+\s*(research|build|marketing|growth|analytics|mindset|fitness)\s*\]\s*([^\n\[]+)/gi;

export function parseHandoffs(from: AgentId, text: string): HandoffNote[] {
  const found: HandoffNote[] = [];
  let m: RegExpExecArray | null;
  while ((m = HANDOFF_RE.exec(text)) !== null) {
    const to = m[1].toLowerCase() as AgentId;
    const note = m[2].trim();
    if (to === from) continue; // don't self-handoff
    found.push({
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      from, to, note, ts: Date.now(),
    });
  }
  return found;
}

// Strip the [→agent] tags from the assistant text so the UI stays clean.
export function stripHandoffs(text: string): string {
  return text.replace(HANDOFF_RE, '').replace(/\n{3,}/g, '\n\n').trim();
}

// ────────────────────────────────────────────────────────────
// Team insights — agents post high-signal observations here,
// shown in the Team Brief panel on Today.
// ────────────────────────────────────────────────────────────
export function getInsights(): TeamInsight[] {
  try {
    return JSON.parse(localStorage.getItem(INSIGHTS_KEY) || '[]');
  } catch { return []; }
}

export function addInsight(agent: AgentId, insight: string): void {
  const all = getInsights();
  // Dedupe on agent + normalized text
  const norm = insight.trim().toLowerCase();
  if (all.some(i => i.agent === agent && i.insight.trim().toLowerCase() === norm)) return;
  all.unshift({
    id: `i_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agent, insight: insight.trim(), ts: Date.now(),
  });
  localStorage.setItem(INSIGHTS_KEY, JSON.stringify(all.slice(0, 40)));
}

export function markInsightsSeen(ids: string[]): void {
  const all = getInsights().map(i => (ids.includes(i.id) ? { ...i, seen: true } : i));
  localStorage.setItem(INSIGHTS_KEY, JSON.stringify(all));
}

export function getUnseenInsights(): TeamInsight[] {
  return getInsights().filter(i => !i.seen);
}

export function clearOldInsights(olderThanDays = 7): void {
  const cutoff = Date.now() - olderThanDays * 24 * 3600 * 1000;
  const all = getInsights().filter(i => i.ts >= cutoff);
  localStorage.setItem(INSIGHTS_KEY, JSON.stringify(all));
}
