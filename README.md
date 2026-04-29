# MindShift AI

> Your personal chief of staff. Mind. Body. Business.

A premium, mobile-first personal execution app for King (Los Silva · [@loshustle](https://instagram.com/loshustle)) that connects **mindset + execution + body + business** into a single system. Not a dashboard. A daily operating system.

- **Live:** https://mindshift-ai-six.vercel.app
- **Design language:** Oracle Edition — deep obsidian base, pastel accent palette (amethyst · mint · peach · teal · coral · citrine · ice), Fraunces serif + Inter Tight + JetBrains Mono.

---

## What it does

| Screen | Purpose |
|---|---|
| **Today** | Time-aware home. Morning shows Core Identity affirmations, midday surfaces Focus & Control, evening fires the review ritual. A persistent **Momentum Reset** (panic button) is always one tap away. |
| **Execute** | Wealth Execution affirmations, deep-work timer (25 / 45 / 90 min), a single daily priority field, and the **AI Virtual Team** launcher (Research · Build · Marketing · Growth · Analytics). |
| **Journal** | Distraction-free writing canvas with Reach & Influence affirmations. Voice dictation supported. |
| **Fitness** | Health & Recovery protocol, 4-4 breathing orb, and a lightweight log for workout / body / sleep / energy. |
| **Progress** | 14-day activity heatmap, streak badge, **Expansion Mode** unlock at 7 days, weekly 5-question review, and the **auto-generated Weekly Report** (every Sunday). |
| **AI** | Streaming chat with GPT-4.1-mini, persistent memory across sessions, long-term profile facts the AI always remembers, and agent role switching. Voice input in the composer. |

### Phase 2 features

- **PWA installable** — works offline; iOS + Android home screen.
- **Local notifications** — morning / midday / evening reminders, configurable times.
- **Voice input** (Web Speech API) on Journal + AI chat.
- **AI memory** — persistent conversation history + user-defined profile facts injected into system prompt.
- **Weekly auto-report** — heuristic summary with one-tap AI rewrite.
- **Habit streaks** — nudges on missed days, Expansion Mode unlocks at 7-day streak with new content.
- **Supabase sync** — optional cloud backup (activates when env keys are set), with silent localStorage fallback.

### Phase 3 features

- **Onboarding wizard** — name, role, focus area, goals. Personalizes greeting, AI tone, and first-week content.
- **Personalization Engine** — tracks screen views, affirmation swipes, timer starts, journal saves. Adapts the Today briefing and injects behavior context into every AI call.
- **Shareable Daily Scorecard** — branded 4:5 card with streak, daily stats, affirmation of the day. PNG export via `html-to-image` + native iOS share sheet.

### Phase 4 — Agent Intelligence (current)

Seven specialized agents, each with a deep system prompt and dedicated context block:

| Agent | Role | Accent |
|---|---|---|
| Research | Deep-dive analyst | Amethyst |
| Build | Systems architect | Teal |
| Marketing | Content strategist | Peach |
| Growth | Revenue strategist | Mint |
| Analytics | Data analyst | Ice |
| Mindset | Identity & reframe | Citrine |
| Fitness | Body operator | Coral |

- **Three-tier memory** — session (last 20 turns) + persistent (explicit facts) + behavioral (patterns from user data). Assembled per-agent via `lib/memory.ts`.
- **Cross-agent handoffs** — agents emit `[→agent] note` tags; the assistant parses and queues them for the target agent's next turn.
- **Proactive Team Brief** — deterministic rule engine (`lib/insights.ts`) surfaces up to 3 dismissible insight cards on Today (revenue trends, streak risks, content velocity, recovery flags).
- **Prompt chaining** — phrases like "create a content plan" fan out across Research → Marketing → Growth → Analytics, each step feeding the next (`lib/chain.ts`).
- **Evaluation loop** — `lib/evaluator.ts` scores each response for hedging, generic advice, missing specifics, refusals. Low-scoring responses trigger a one-shot retry with a sharpening hint.
- **Auto-routing** — `routeAgent()` regex-routes user input to the best-fit agent when no agent is selected.
- **Engagement tracking** — per-agent ask / follow-up counters stored locally for future quality tuning.

---

## Stack

- **Next-gen React** — React 19 + Vite 7 + TypeScript
- **Tailwind CSS 4** (OKLCH tokens)
- **Framer Motion** for entrance animations and page transitions
- **shadcn/ui** primitives (dialog, tooltip, sonner)
- **OpenAI GPT-4.1-mini** via the Manus Forge proxy
- **Supabase** (optional, behind env flag) for cloud sync
- **Vercel** (static deploy)

No Stripe. No login. No bloat.

---

## Run locally

```bash
pnpm install
pnpm dev
# → http://localhost:3000
```

### Environment variables

None are required for the core app to run — the Forge AI proxy is wired in through the build.

For Supabase cloud sync, set:

```bash
VITE_SUPABASE_URL=https://rcekhfscmyuiohxhdkzf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-from-supabase-dashboard>
```

Then create the sync table in the Supabase SQL editor:

```sql
create table mindshift_sync (
  device_id   text        not null,
  kind        text        not null,
  payload     jsonb       not null,
  updated_at  timestamptz default now(),
  primary key (device_id, kind)
);

alter table mindshift_sync enable row level security;
create policy "anon rw own device" on mindshift_sync
  for all using (true) with check (true);
```

If these variables are not present the app falls back cleanly to localStorage.

---

## Deploy to Vercel

```bash
pnpm build
cd dist/public
vercel deploy --prod --yes
```

The project is linked to the existing Vercel project **`mindshift-ai`** under team **`los' projects`**.

---

## Project layout

```
client/
  public/
    manifest.webmanifest      PWA manifest
    sw.js                     Service worker (offline shell + push)
    icon-*.png                App icons
  src/
    components/
      ui-shared.tsx           PageHeader, Card, ProgressRing, BottomNav…
      VoiceMic.tsx            Web Speech API mic button
      SettingsSheet.tsx       Notifications + AI memory + sync status
      WeeklyReportView.tsx    Auto-generated Sunday summary
    lib/
      content.ts              Architect OS + Sovereign Engine affirmations
      storage.ts              localStorage + Supabase write-through
      supabase.ts             Client creator (env-gated)
      notifications.ts        Time-slot local reminder scheduler
      voice.ts                SpeechRecognition wrapper
      reports.ts              Weekly report computation + AI enrichment
      streaks.ts              Streak state + nudge logic + Expansion unlock
      ai.ts                   GPT-4.1-mini streaming chat via Forge proxy
    pages/                    Today · Execute · Journal · Fitness · Progress · Assistant
    App.tsx                   Root: bottom nav + Settings sheet + tick loop
    index.css                 Oracle Edition design tokens
```

---

## Design rules

1. **One purpose per screen.** Every tab has one clear action.
2. **Progressive disclosure.** Never show more than what's needed right now.
3. **Pastel against obsidian.** Amethyst, mint, peach, teal, coral, citrine, ice — one accent per screen.
4. **Typography as hierarchy.** Fraunces for emotional weight (affirmations, scores). Inter Tight for UI. JetBrains Mono for stamps and data.
5. **Decisive motion.** `cubic-bezier(0.22, 1, 0.36, 1)`. No bounce. Paper-turn, not spring.

---

## License

Private. Built for King.
