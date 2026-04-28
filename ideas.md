# MindShift AI — Design Brainstorm

The product is a personal Chief of Staff for King (Los Silva). Calm. Powerful. Intentional. Mobile-first dark UI. Below are three distinct directions, each committed to a single design philosophy.

---

<response>
<text>

## Idea 1 — "Sovereign Console" (CHOSEN)

**Design Movement:** Editorial Minimalism × Operator-grade Industrial UI. A blend of *Linear*'s precision, *Whoop*'s recovery-screen calmness, and *Stripe Press*'s editorial restraint. Think: a quiet command center for a single operator.

**Core Principles**
1. **One thing per screen.** Every view answers one question. Progressive disclosure for everything else.
2. **Quiet luxury.** Deep neutral blacks, single warm accent, hairline rules. No decoration without function.
3. **Editorial typography hierarchy.** Display serif for affirmations and section headers (gravitas). Geometric sans for UI (precision). Mono for metrics (signal).
4. **Time as the primary axis.** The interface morphs by time-of-day rather than by tab — the home screen *behaves* like a daily ritual.

**Color Philosophy**
- Background: `#0A0A0B` (true near-black, warmer than pure black — feels intentional, not sterile)
- Surface: `#111113` cards float on background with 1px hairline borders at 6% opacity
- Primary text: `#F5F4F1` (warm off-white — paper-feel)
- Muted text: rgba(245,244,241,0.55)
- Single accent: `#E8E0D0` (bone/parchment) for primary actions and emphasis. NOT blue, NOT purple — calm, expensive.
- Signal accent: `#7BC598` (calm sage) used *sparingly* for momentum/positive deltas only.
- Reset accent: `#E08A6B` (terracotta) used ONLY on the Momentum Reset button.

**Layout Paradigm**
- **Vertical-rhythm-driven, not grid-driven.** Generous vertical spacing (96px+ section gaps on mobile) replaces visual noise.
- Bottom tab bar on mobile (5 icons, asymmetric — center "Today" pill is taller). Floating Momentum Reset always reachable from top-right of any screen.
- Content maxes at ~620px column even on desktop — preserves the "operator's notebook" intimacy.
- Asymmetric headers: section label (uppercase mono micro-caps) sits flush left; date/status sits flush right.

**Signature Elements**
1. **Hairline horizontal rules** — `1px solid rgba(255,255,255,0.06)` separate ideas without weight.
2. **"Operator stamps"** — uppercase mono micro-caps (`MORNING · 04.27`) above every section, like a field journal header.
3. **Affirmation cards** — single statement, large display serif, swipeable horizontally. One thought at a time.

**Interaction Philosophy**
- *Decisive, not bouncy.* No spring physics. All transitions ease-out, 280ms.
- Tap targets are large (min 44px) and respond with a 1-frame opacity dim, not a scale pulse.
- Swipes feel like turning a page in a leather notebook — momentum, then settle.
- Hover/press states are subtle: 4% lighter surface, no glow.

**Animation**
- Page transitions: 200ms cross-fade only. No slide/translate.
- Affirmation card reveal on mount: 8px upward translate + fade-in, 400ms, ease-out, 60ms stagger.
- Number counters in Progress: count up over 600ms with ease-out cubic.
- Breathing exercise: 4s smooth scale (1.0 → 1.4) inhale, 4s scale back exhale — no easing, perfect linear.
- Momentum Reset press: brief 300ms warm radial glow from button center, then content swap.

**Typography System**
- Display: **Fraunces** (variable serif) — 600 weight for affirmations, 400 for section headlines. Tight tracking (-0.02em) at large sizes.
- UI/Body: **Inter Tight** at 14–16px, 450 weight. Tracking 0 normal, +0.02em for caps.
- Mono: **JetBrains Mono** 11px uppercase for stamps and metrics. Tracking +0.08em.
- Hierarchy:
  - Affirmation: Fraunces 32–40px, line-height 1.15
  - Section heading: Fraunces 22px, 500 weight
  - Body: Inter Tight 15px, 1.55 leading
  - Stamp: JetBrains Mono 10px uppercase, +0.12em

</text>
<probability>0.08</probability>
</response>

<response>
<text>

## Idea 2 — "Athletic Telemetry"
**Design Movement:** Whoop-grade biometric instrument panel. Carbon textures, glass cards, neon-cyan data lines, rounded "pebble" buttons. Heavy use of progress rings and gradient meters. Best for fitness-first apps; risks feeling busier than King wants for the mindset/journal sections.
</text>
<probability>0.04</probability>
</response>

<response>
<text>

## Idea 3 — "Brutalist Stoic"
**Design Movement:** Karl Gerstner Swiss grid × concrete monospace brutalism. All Berkeley Mono, hard 90° corners, single accent of pure red, ASCII separators. Powerful and singular but reads as "developer tool" not "executive assistant," and serif-free affirmations lose the gravitas King's content deserves.
</text>
<probability>0.02</probability>
</response>

---

## Decision

Committing **fully** to **Idea 1 — Sovereign Console**. Every file will be built against this philosophy. Hairline rules, editorial serif affirmations, single bone accent, time-as-axis, one-thing-per-screen.
