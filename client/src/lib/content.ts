// ============================================================
// MINDSHIFT AI — CONTENT LIBRARY
// Architect OS + Sovereign Engine affirmations & protocols
// ============================================================

export type TimeOfDay = 'morning' | 'midday' | 'evening';

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'midday';
  return 'evening';
}

export function getGreeting(name = 'King'): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good morning, ${name}.`;
  if (h >= 12 && h < 17) return `Good afternoon, ${name}.`;
  if (h >= 17 && h < 21) return `Good evening, ${name}.`;
  return `Late night, ${name}.`;
}

export function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatStamp(): string {
  const d = new Date();
  const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const yr  = d.getFullYear();
  return `${mon} ${day} · ${yr}`;
}

// ── Section 1: Core Identity (Morning) ──────────────────────
export const coreIdentityAffirmations = [
  "I operate as the Architect. I build, I decide, I execute.",
  "I control my inputs, my attention, and my outputs.",
  "I do not react to the world. I design within it.",
  "I turn ideas into assets and assets into income.",
  "I execute daily regardless of emotion.",
  "I think in systems, not tasks.",
  "I move with clarity, speed, and intention.",
  "I am building leverage every day.",
  // Sovereign Engine Section 1
  "I am responsible for my results.",
  "I execute quickly and finish what I start.",
  "I build systems that produce outcomes.",
  "I decide fast and move immediately.",
];

// ── Section 2: Wealth Execution (Before Work) ───────────────
export const wealthExecutionAffirmations = [
  "Every day I create assets that generate revenue.",
  "My systems work even when I'm not present.",
  "I build once and get paid repeatedly.",
  "I move fast, test fast, and improve fast.",
  "I prioritize output over perfection.",
  "I finish what makes money first.",
  "I focus on distribution, not just creation.",
  "I turn attention into leads and leads into revenue.",
  // Sovereign Engine Section 2
  "I prioritize actions that generate revenue.",
  "I convert opportunities into money quickly.",
  "I focus on high-leverage work only.",
  "I remove anything that does not produce income.",
];

// ── Section 3: Reach & Influence (Before Journal/Content) ───
export const reachInfluenceAffirmations = [
  "My communication is clear and direct.",
  "I create content that gets attention and response.",
  "The right people find and respond to my work.",
  "I express ideas with confidence and precision.",
];

// ── Section 4: Focus & Control (Midday) ─────────────────────
export const focusControlAffirmations = [
  "I ignore noise and focus on leverage.",
  "I choose clarity over distraction.",
  "I complete what I start.",
  "I remove friction from my environment.",
  "I do hard things first.",
  "I control my time like a weapon.",
  "I eliminate low-value actions immediately.",
  "I operate in deep work, not shallow motion.",
  // Sovereign Engine Section 4
  "I control my time and attention.",
  "I remove distractions immediately.",
  "I complete tasks without hesitation.",
  "I operate with consistency, not emotion.",
];

// ── Section 5: Health & Recovery (Fitness/Evening) ──────────
export const healthRecoveryAffirmations = [
  "My body improves through my actions.",
  "I support my health through consistent habits.",
  "I reduce stress and increase recovery.",
  "I make decisions that strengthen my body.",
];

// ── Section 6: Momentum Reset (Panic Button) ────────────────
export const momentumResetAffirmations = [
  "Reset now. Continue forward.",
  "One action creates momentum.",
  "I take the next step immediately.",
  "Progress compounds quickly.",
];

// ── AI + System Building ─────────────────────────────────────
export const aiSystemAffirmations = [
  "I use AI as a multiplier, not a crutch.",
  "I build systems that replace manual effort.",
  "I create agents that execute tasks for me.",
  "I design workflows that run daily without me.",
  "I automate before I delegate.",
  "I think in pipelines, not one-off actions.",
  "I build once, reuse infinitely.",
  "I turn knowledge into tools.",
];

// ── Evening review questions ─────────────────────────────────
export const eveningReviewQuestions = [
  "What did I build today?",
  "What moved money forward?",
  "What gets automated tomorrow?",
  "What was my highest-leverage action?",
  "What should I remove from tomorrow?",
];

// ── Time-aware affirmation set ───────────────────────────────
export function getTimeAffirmations(time: TimeOfDay): string[] {
  switch (time) {
    case 'morning': return coreIdentityAffirmations;
    case 'midday':  return focusControlAffirmations;
    case 'evening': return healthRecoveryAffirmations;
  }
}

// ── AI Virtual Team agents ───────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  description: string;
}

export const agents: Agent[] = [
  {
    id: 'research',
    name: 'Research',
    icon: '◎',
    description: 'Deep dive on any topic',
    prompt: 'You are King\'s Research Agent. Your job is to find, synthesize, and present information clearly and concisely. Focus on actionable insights, not fluff. King is an entrepreneur, AI consultant, business acquirer, and content creator. Be direct, precise, and useful.',
  },
  {
    id: 'build',
    name: 'Build',
    icon: '⬡',
    description: 'Systems, SOPs & automation',
    prompt: 'You are King\'s Build Agent. Your job is to help design systems, workflows, SOPs, and automation pipelines. Think in leverage — what can be built once and run forever? King values speed, simplicity, and scalability. Be concrete and implementation-ready.',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '◈',
    description: 'Content, copy & campaigns',
    prompt: 'You are King\'s Marketing Agent. Your job is to help create content, copy, hooks, campaigns, and distribution strategies. King creates content for entrepreneurs and business owners. Focus on attention, conversion, and reach. Be punchy, direct, and strategic.',
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: '△',
    description: 'Revenue & acquisition strategy',
    prompt: 'You are King\'s Growth Agent. Your job is to identify revenue opportunities, growth levers, and acquisition strategies. King acquires and scales businesses. Think in terms of leverage, systems, and compounding returns. Be strategic and numbers-oriented.',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: '◇',
    description: 'Data, metrics & insights',
    prompt: 'You are King\'s Analytics Agent. Your job is to analyze data, identify patterns, and surface insights that drive decisions. Focus on what matters — revenue, growth, efficiency. Be precise, data-driven, and actionable.',
  },
];

// ── King's AI context (base system prompt) ───────────────────
export const kingSystemPrompt = `You are MindShift AI — the personal chief of staff for King (Los Silva, @loshustle).

King is:
- An entrepreneur, AI consultant, business acquirer, and content creator
- Building systems and assets that generate recurring revenue
- Focused on leverage, automation, and high-output execution
- Operating at the intersection of AI, business acquisition, and personal performance

Your role:
- Be direct, precise, and immediately useful
- Think in systems and leverage, not one-off tasks
- Prioritize revenue-generating actions and high-leverage work
- Cut through noise — no fluff, no filler
- Speak like a trusted chief of staff, not a generic AI assistant

When King asks for help, give him the most actionable, direct answer possible. If he needs a plan, make it executable. If he needs copy, make it sharp. If he needs strategy, make it specific.`;

// ── Expansion Mode (unlocks after 7-day streak) ─────────────
// Architect OS sections 7–11: execution sequence, rules,
// tracking, enforcement logic, expansion mode directives.
export const expansionAffirmations = [
  "I operate from evidence, not emotion.",
  "I scale what is already working.",
  "I delegate what does not require me.",
  "I raise my standard every quarter.",
  "My systems produce results without my constant presence.",
  "I build assets that compound while I sleep.",
  "I treat my attention as the most valuable currency.",
  "I say no to anything that does not multiply output.",
];

export const expansionDirectives = [
  "Audit this week: what produced? What drained?",
  "Double down on the one lever that moved the most.",
  "Remove or automate one task you repeated this week.",
  "Document the process so it can run without you.",
  "Raise the standard on a single metric by 20%.",
];

export const enforcementRules = [
  "Revenue before reach. Reach before reset.",
  "One priority per day. Finish it before anything else.",
  "No input without output. Consume only after you produce.",
  "Body first. Train or walk before the screen.",
  "If stuck for 15 minutes, reset. Then continue.",
];
