// ============================================================
// MINDSHIFT AI — APP ROOT
// Bottom nav is ALWAYS rendered (z-50).
// Onboarding is a normal page in the content area — NOT an overlay.
// Tapping any nav tab during onboarding skips it and goes straight to that tab.
// ============================================================

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav, type NavTab } from '@/components/ui-shared';
import { SettingsSheet } from '@/components/SettingsSheet';
import { Onboarding } from '@/components/Onboarding';
import { Scorecard } from '@/components/Scorecard';
import Today from '@/pages/Today';
import Execute from '@/pages/Execute';
import Journal from '@/pages/Journal';
import Fitness from '@/pages/Fitness';
import Progress from '@/pages/Progress';
import Assistant from '@/pages/Assistant';
import { type Agent } from '@/lib/content';
import { hydrateFromRemote, hasOnboarded, saveUserProfile, logBehavior, type BehaviorEvent } from '@/lib/storage';
import { tick } from '@/lib/notifications';
import { AuthScreen } from '@/components/AuthScreen';
import { onAuthChange, supabaseEnabled } from '@/lib/supabase';

// Skip-auth flag: user explicitly chose to use the app without an account.
const SKIP_AUTH_KEY = 'ms_skip_auth';

function App() {
  const [tab, setTab] = useState<NavTab>('today');
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  // Check localStorage immediately — if already onboarded, skip the flow
  const [onboarded, setOnboarded] = useState<boolean>(() => hasOnboarded());
  // Auth state: 'loading' until first onAuthChange fires
  const [authReady, setAuthReady] = useState<boolean>(!supabaseEnabled);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [skipAuth, setSkipAuth] = useState<boolean>(() => localStorage.getItem(SKIP_AUTH_KEY) === '1');

  // Subscribe to Supabase auth state
  useEffect(() => {
    if (!supabaseEnabled) { setAuthReady(true); return; }
    const off = onAuthChange((u) => {
      setSignedIn(!!u);
      setAuthReady(true);
      // On fresh sign-in, hydrate cloud → local
      if (u) { void hydrateFromRemote(); }
    });
    return off;
  }, []);

  // One-time remote pull (no-op if not signed in)
  useEffect(() => { void hydrateFromRemote(); }, []);

  // Notification scheduler
  useEffect(() => {
    tick();
    const interval = window.setInterval(tick, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Log tab views for personalization
  useEffect(() => {
    if (!onboarded) return;
    logBehavior(`view:${tab}` as BehaviorEvent);
  }, [tab, onboarded]);

  const handleAgentSelect = (agent: Agent) => {
    setActiveAgent(agent);
    setTab('assistant');
  };

  // Scorecard event listener
  useEffect(() => {
    const open = () => setScorecardOpen(true);
    window.addEventListener('mindshift:open-scorecard', open);
    return () => window.removeEventListener('mindshift:open-scorecard', open);
  }, []);

  // When user taps a nav tab during onboarding → skip onboarding, go to that tab
  function handleTabChange(t: NavTab) {
    if (!onboarded) {
      // Mark as onboarded with minimal profile so they don't see it again
      saveUserProfile({ name: '', role: '', focus: 'all', goals: '', onboardedAt: Date.now() });
      logBehavior('onboard:skipped-via-nav', {});
      setOnboarded(true);
    }
    setTab(t);
  }

  function handleOnboardComplete() {
    setOnboarded(true);
  }

  function handleAuthed() {
    setSignedIn(true);
    // If they sign in we no longer want the skip flag set
    localStorage.removeItem(SKIP_AUTH_KEY);
    setSkipAuth(false);
  }

  function handleSkipAuth() {
    localStorage.setItem(SKIP_AUTH_KEY, '1');
    setSkipAuth(true);
  }

  // Show auth gate if backend enabled, user not signed in, and they haven't chosen to skip
  const showAuth = supabaseEnabled && authReady && !signedIn && !skipAuth;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div
            style={{
              minHeight: '100vh',
              background: '#0A0A0B',
              maxWidth: 640,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            {/* Loading splash before auth state resolved */}
            {!authReady && (
              <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
              </div>
            )}

            {/* Auth gate */}
            {authReady && showAuth && (
              <AuthScreen onAuthed={handleAuthed} onSkip={handleSkipAuth} />
            )}

            {/* Settings + Scorecard buttons — only show when onboarded AND past auth */}
            {authReady && !showAuth && onboarded && (
              <>
                <button
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Open settings"
                  className="fixed z-30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    top: 'max(1rem, env(safe-area-inset-top))',
                    right: '1rem',
                    width: 38, height: 38,
                    background: 'rgba(20,20,28,0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(245,244,248,0.65)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  onClick={() => setScorecardOpen(true)}
                  aria-label="Share daily scorecard"
                  className="fixed z-30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    top: 'max(1rem, env(safe-area-inset-top))',
                    right: '3.8rem',
                    width: 38, height: 38,
                    background: 'rgba(20,20,28,0.7)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(245,244,248,0.65)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v7M4 4l3-3 3 3M2 9v3a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            )}

             {/* ── Page content (only when past auth gate) ────────── */}
            {authReady && !showAuth && (
            <AnimatePresence mode="wait">
              {!onboarded && (
                <motion.div
                  key="onboarding"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Onboarding onComplete={handleOnboardComplete} />
                </motion.div>
              )}
              {onboarded && tab === 'today'     && <Today     key="today" />}
              {onboarded && tab === 'execute'   && <Execute   key="execute" onAgentSelect={handleAgentSelect} />}
              {onboarded && tab === 'journal'   && <Journal   key="journal" />}
              {onboarded && tab === 'fitness'   && <Fitness   key="fitness" />}
              {onboarded && tab === 'progress'  && <Progress  key="progress" />}
              {onboarded && tab === 'assistant' && (
                <Assistant
                  key="assistant"
                  initialAgent={activeAgent}
                  onAgentClear={() => setActiveAgent(null)}
                />
              )}
            </AnimatePresence>
            )}

            {/* ── Bottom nav — only when past auth gate ────────── */}
            {authReady && !showAuth && (
              <BottomNav active={onboarded ? tab : tab} onChange={handleTabChange} />
            )}

            <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <AnimatePresence>
              {scorecardOpen && <Scorecard open={scorecardOpen} onClose={() => setScorecardOpen(false)} />}
            </AnimatePresence>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
