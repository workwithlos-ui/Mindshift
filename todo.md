# MindShift AI — Phase 2 Todo

## In-progress build (no blockers)
- [ ] PWA manifest + app icons (Add to Home Screen → standalone)
- [ ] Service worker for offline + push delivery
- [ ] Morning / Midday / Evening local notification scheduler (Notification API)
- [ ] Voice input on Journal (Web Speech API, iOS Safari compatible)
- [ ] Voice input on AI Assistant chat
- [ ] AI memory: persist conversation history in localStorage, inject last N turns + user context on each call
- [ ] Weekly auto-report generator (triggers Sundays, cached until next week)
- [ ] Weekly report viewer inside Progress screen
- [ ] Streak nudge logic: missed-day banner + 7-day Expansion Mode unlock with new affirmation content
- [ ] Expansion Mode additional affirmations from Architect OS sections 7–11
- [ ] README.md (what it is, stack, run locally, env vars, features, deploy)
- [ ] Production build + Vercel redeploy to mindshift-ai-six.vercel.app

## Blocked — awaiting credentials
- [ ] Supabase sync (needs anon key + URL for project rcekhfscmyuiohxhdkzf)
- [ ] GitHub push to workwithlos-ui/mindshift-ai (needs PAT with `repo` scope)

## Notes
- iOS Push: only works when installed as PWA (Add to Home Screen on iOS 16.4+).
  Building the right way so it works when King installs.
- Supabase sync will be added behind a build-time flag — the app works perfectly without it (localStorage).
