// ============================================================
// MINDSHIFT AI — APP ROOT
// Single-page app with bottom nav. Always dark.
// ============================================================

import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from 'framer-motion';
import { BottomNav, type NavTab } from '@/components/ui-shared';
import Today from '@/pages/Today';
import Execute from '@/pages/Execute';
import Journal from '@/pages/Journal';
import Fitness from '@/pages/Fitness';
import Progress from '@/pages/Progress';
import Assistant from '@/pages/Assistant';
import { type Agent } from '@/lib/content';

function App() {
  const [tab, setTab] = useState<NavTab>('today');
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  const handleAgentSelect = (agent: Agent) => {
    setActiveAgent(agent);
    setTab('assistant');
  };

  const handleTabChange = (t: NavTab) => {
    setTab(t);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div
            className="min-h-screen"
            style={{ background: '#0A0A0B', maxWidth: 640, margin: '0 auto' }}
          >
            <AnimatePresence mode="wait">
              {tab === 'today' && <Today key="today" />}
              {tab === 'execute' && <Execute key="execute" onAgentSelect={handleAgentSelect} />}
              {tab === 'journal' && <Journal key="journal" />}
              {tab === 'fitness' && <Fitness key="fitness" />}
              {tab === 'progress' && <Progress key="progress" />}
              {tab === 'assistant' && (
                <Assistant
                  key="assistant"
                  initialAgent={activeAgent}
                  onAgentClear={() => setActiveAgent(null)}
                />
              )}
            </AnimatePresence>
            <BottomNav active={tab} onChange={handleTabChange} />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
