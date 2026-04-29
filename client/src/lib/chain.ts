// ============================================================
// MINDSHIFT AI — PROMPT CHAINING
// Detects multi-step tasks and runs agents in sequence,
// passing each step's output into the next agent's context.
// Example: "create a content plan"
//   → research (analyze niche) → marketing (draft pillars)
//   → growth (validate revenue) → analytics (set KPIs)
// ============================================================
import type { AgentId } from './agents';

export interface ChainStep {
  agent: AgentId;
  brief: string;            // what this agent is asked to produce
}

export interface ChainPlan {
  name: string;             // human label, e.g. "Content plan"
  trigger: RegExp;          // pattern that opens this plan
  steps: ChainStep[];
}

// Library of detectable plans. Add more over time.
// Order matters — first match wins.
const PLANS: ChainPlan[] = [
  {
    name: 'Content plan',
    trigger: /\b(create|build|make|draft).*(content plan|content strategy|content calendar|editorial plan)\b/i,
    steps: [
      { agent: 'research',  brief: 'Analyze the niche. What 3 angles have the most attention and least saturation?' },
      { agent: 'marketing', brief: 'Draft 4 content pillars for this audience. One sentence each. Pick the sharpest.' },
      { agent: 'growth',    brief: 'Map each pillar to a revenue outcome. Which pillar has the clearest path to paying customers?' },
      { agent: 'analytics', brief: 'Define 3 leading indicators to track weekly. Keep them measurable from existing data.' },
    ],
  },
  {
    name: 'Launch plan',
    trigger: /\b(plan|outline|build).*(launch|product launch|offer launch|go-to-market)\b/i,
    steps: [
      { agent: 'research',  brief: 'Identify the 3 highest-signal pain points this launch solves.' },
      { agent: 'build',     brief: 'Break the launch into 3 weekly milestones with one ship per week.' },
      { agent: 'marketing', brief: 'Draft the hook, the promise, and the proof line.' },
      { agent: 'growth',    brief: 'Model the revenue target: price × volume × conversion. Flag the weakest number.' },
    ],
  },
  {
    name: 'Weekly reset',
    trigger: /\b(weekly reset|week plan|plan the week|reset the week|game plan for)\b/i,
    steps: [
      { agent: 'analytics', brief: 'Summarize last week in 3 numbers. Lead with the most important.' },
      { agent: 'mindset',   brief: 'One sentence of identity reset. Use King\'s own language.' },
      { agent: 'build',     brief: 'Name the ONE thing to ship this week. Everything else is support.' },
      { agent: 'fitness',   brief: 'One recovery or training adjustment to match the week\'s demand.' },
    ],
  },
  {
    name: 'Deep analysis',
    trigger: /\b(analyze|deep dive|full analysis|audit|breakdown).*(my|this|the) (business|funnel|pipeline|offer|content|performance)\b/i,
    steps: [
      { agent: 'analytics', brief: 'Pull the data. Lead with the biggest gap between target and actual.' },
      { agent: 'research',  brief: 'Pattern the cause — what does King\'s journal + recent activity say?' },
      { agent: 'growth',    brief: 'Propose 2 tests to close the biggest gap. Hypothesis, metric, kill criteria.' },
    ],
  },
  {
    name: 'Stuck / momentum reset',
    trigger: /\b(i('m)?| i am)? *(stuck|frozen|lost|spiraling|overwhelmed|paralyzed)\b/i,
    steps: [
      { agent: 'mindset',   brief: 'Two sentences. Cut the spiral. Use Momentum Reset language.' },
      { agent: 'build',     brief: 'Name the SMALLEST next action. Not the best — the smallest.' },
    ],
  },
];

/**
 * Match a user message to a plan. Returns null if this is a simple query.
 */
export function matchChain(userText: string): ChainPlan | null {
  for (const p of PLANS) {
    if (p.trigger.test(userText)) return p;
  }
  return null;
}

/**
 * Produce the system prompt tail to inject when running a chain step.
 * Includes the original user request + previous steps' outputs.
 */
export function buildChainStepPrompt(
  plan: ChainPlan,
  stepIndex: number,
  userText: string,
  previousOutputs: { agent: AgentId; text: string }[],
): string {
  const step = plan.steps[stepIndex];
  const lines: string[] = [];
  lines.push(`# CHAIN: ${plan.name} (step ${stepIndex + 1}/${plan.steps.length})`);
  lines.push(`Original request: "${userText}"`);
  lines.push('');
  lines.push(`Your focused brief for this step: ${step.brief}`);
  if (previousOutputs.length) {
    lines.push('');
    lines.push('# PRIOR STEPS');
    previousOutputs.forEach(o => {
      lines.push(`--- ${o.agent.toUpperCase()} ---`);
      lines.push(o.text.slice(0, 1200));
    });
  }
  lines.push('');
  lines.push('Keep your response tight — 6 short lines max. You are one voice in a chain, not the final answer.');
  return lines.join('\n');
}
