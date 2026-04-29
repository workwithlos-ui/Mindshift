# MindShift AI — Agent Intelligence Upgrade

## Phase 1 — Agent definitions + memory
- [ ] `lib/agents.ts` — 7 deep system prompts (Research, Build, Marketing, Growth, Analytics, Mindset, Fitness)
- [ ] Each prompt: role, context injection slot, handoff protocol, output style
- [ ] `lib/memory.ts` — 3-tier memory (session / persistent facts / behavioral)

## Phase 2 — Shared context + handoffs
- [ ] `lib/agentContext.ts` shared store (notes, open threads)
- [ ] Handoff tag parser `[→agent] note`
- [ ] Team Brief component

## Phase 3 — Proactive insights
- [ ] `lib/insights.ts` generator from behavioral + progress data
- [ ] InsightsCard on Today screen
- [ ] Cache insights per day

## Phase 4 — Prompt chaining + eval
- [ ] `lib/chain.ts` — detect multi-step tasks, run agents in sequence
- [ ] `lib/evaluator.ts` — heuristic quality check + retry
- [ ] Engagement tracking

## Phase 5 — Rewire Assistant.tsx
- [ ] Replace old agent list with new 7-agent system
- [ ] Wire memory + context store + chain detection + eval
- [ ] Keep Oura-level UI intact

## Phase 6 — Ship
- [ ] Update README
- [ ] Build + deploy to Vercel
- [ ] Push to GitHub using classic PAT
