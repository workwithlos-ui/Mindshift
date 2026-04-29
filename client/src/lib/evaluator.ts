// ============================================================
// MINDSHIFT AI — RESPONSE EVALUATOR
// Lightweight heuristics that catch low-value agent responses
// and trigger a retry with extra instruction. Also tracks
// engagement signal (whether user follows up on an agent's
// response vs ignores it) to adapt over time.
// ============================================================
import type { AgentId } from './agents';

export interface EvalResult {
  score: number;              // 0..1, higher = better
  issues: string[];
  retryHint?: string;         // if low score, suggestion to append
}

// Patterns that smell like hedging / generic AI slop
const HEDGE_PATTERNS = [
  /\b(as an ai|as a language model|i'm just|i don't have personal)\b/i,
  /\bit depends\b/i,
  /\bthere are many ways\b/i,
  /\bi hope this helps\b/i,
  /\blet me know if\b/i,
  /\bhere are some (tips|ideas|strategies)\b/i,
];

const GENERIC_PATTERNS = [
  /\b(make sure to|it's important to|remember to) /i,
  /\b(focus on|prioritize) quality\b/i,
  /\b(engage|connect) with your audience\b/i,
  /\bbuild (trust|rapport) with\b/i,
];

export function evaluateResponse(text: string, agent: AgentId): EvalResult {
  const issues: string[] = [];
  let score = 1;

  const wordCount = text.trim().split(/\s+/).length;

  // Too short to be useful
  if (wordCount < 12) {
    issues.push('too-short');
    score -= 0.4;
  }

  // Hedging language
  for (const p of HEDGE_PATTERNS) {
    if (p.test(text)) {
      issues.push('hedging');
      score -= 0.2;
      break;
    }
  }

  // Generic guru-speak
  let genericHits = 0;
  for (const p of GENERIC_PATTERNS) {
    if (p.test(text)) genericHits++;
  }
  if (genericHits >= 2) {
    issues.push('generic');
    score -= 0.3;
  }

  // No numbers or specifics when they'd help
  const hasNumber = /\d/.test(text);
  const hasNamedStep = /\b(next|step|today|tomorrow|this week|by \w+day|by \w+ \d+)\b/i.test(text);
  if (!hasNumber && !hasNamedStep && wordCount > 30) {
    issues.push('no-concrete');
    score -= 0.2;
  }

  // Refusal / unhelpful bail
  if (/^(i can'?t|i'm unable|i cannot|unfortunately i)/i.test(text.trim())) {
    issues.push('refusal');
    score -= 0.4;
  }

  // Agent-specific quality bars
  if (agent === 'marketing' && !/[\"']|:|—|\n/.test(text)) {
    // Marketing should actually draft something, typically quoted or structured
    issues.push('marketing-no-draft');
    score -= 0.15;
  }
  if (agent === 'growth' && !/\d/.test(text)) {
    issues.push('growth-no-numbers');
    score -= 0.2;
  }
  if (agent === 'analytics' && !/\d/.test(text)) {
    issues.push('analytics-no-numbers');
    score -= 0.2;
  }

  score = Math.max(0, Math.min(1, score));

  let retryHint: string | undefined;
  if (score < 0.55) {
    const hints: string[] = [];
    if (issues.includes('too-short')) hints.push('Expand with a concrete example or named next step.');
    if (issues.includes('hedging')) hints.push('Cut every "I hope" / "it depends" phrase. Take a position.');
    if (issues.includes('generic')) hints.push('Replace any generic advice with a specific number, name, or action.');
    if (issues.includes('no-concrete')) hints.push('Add at least one number or a specific deadline.');
    if (issues.includes('marketing-no-draft')) hints.push('Ship an actual hook or draft, not an outline.');
    if (issues.includes('growth-no-numbers') || issues.includes('analytics-no-numbers')) {
      hints.push('Include the math: current number, target, gap, and the action to close it.');
    }
    retryHint = hints.join(' ');
  }

  return { score, issues, retryHint };
}

// ────────────────────────────────────────────────────────────
// Engagement tracking — does the user follow up or move on?
// ────────────────────────────────────────────────────────────
export interface AgentEngagement {
  agent: AgentId;
  asks: number;
  followUps: number;          // user sent another message within 90s
  ignored: number;            // user left / switched without follow-up
  avgScore: number;           // running average of eval scores
}

const ENGAGEMENT_KEY = 'ms_agent_engagement';

function load(): Record<AgentId, AgentEngagement> {
  try {
    return JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || '{}');
  } catch { return {} as Record<AgentId, AgentEngagement>; }
}
function save(m: Record<AgentId, AgentEngagement>) {
  localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(m));
}

export function recordAsk(agent: AgentId, score: number): void {
  const m = load();
  const cur = m[agent] ?? { agent, asks: 0, followUps: 0, ignored: 0, avgScore: 0 };
  cur.asks += 1;
  cur.avgScore = (cur.avgScore * (cur.asks - 1) + score) / cur.asks;
  m[agent] = cur;
  save(m);
}

export function recordFollowUp(agent: AgentId): void {
  const m = load();
  const cur = m[agent];
  if (!cur) return;
  cur.followUps += 1;
  m[agent] = cur;
  save(m);
}

export function getEngagement(): Record<AgentId, AgentEngagement> {
  return load();
}
