# MindShift AI — Major Upgrade (Pass A + Pass B)

## Pass A — ship today, no backend required

### Onboarding flow
- [ ] Detect first-time user (no `mindshift.profile`)
- [ ] Full-screen wizard: welcome → name → role → focus area (mind/body/business/all) → goals → done
- [ ] Persist to localStorage as `mindshift.profile`
- [ ] Seamlessly route to Today after complete

### Personalization Engine
- [ ] Behavior tracker: log every screen visit, affirmation swipe, timer start, journal save
- [ ] Pattern heuristics: morning engagement rate, evening skip rate, which protocols used
- [ ] Adaptive daily briefing: swap greeting + top signal based on patterns
- [ ] Missed-routine nudge banner

### Shareable Scorecard
- [ ] "Share" action on Progress screen
- [ ] Full-screen scorecard modal — gradient background, streak ring, day stats, affirmation quote
- [ ] Export as PNG via html-to-image
- [ ] Native share sheet support on iOS
- [ ] Branded footer: "MindShift AI · @loshustle"

### Ship
- [ ] Compose new modules into App.tsx
- [ ] Rebuild + verify production bundle
- [ ] Write comprehensive README.md
- [ ] git init + push to https://github.com/workwithlos-ui/Mindshift
- [ ] Redeploy to mindshift-ai-six.vercel.app

## Pass B — awaiting Supabase keys
- [ ] Migrate to Next.js (or add Express+Supabase backend)
- [ ] Supabase schema: users, profiles, journal_entries, progress_tracking, fitness_logs, chat_history, streaks, friends
- [ ] Auth (email magic link + optional handle)
- [ ] Server-side AI route (proxy Forge/OpenAI, hide keys)
- [ ] Cloud sync of all local data
- [ ] Public streak leaderboard (opt-in)
- [ ] Friend follow + see friend streaks
