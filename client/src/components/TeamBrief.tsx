// ============================================================
// MINDSHIFT AI — TEAM BRIEF
// Shows proactive agent insights on Today screen. Minimal,
// calm — one insight per card, dismissible, never more than 3.
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateInsights } from '@/lib/insights';
import { markInsightsSeen, type TeamInsight } from '@/lib/agentContext';
import { AGENTS } from '@/lib/agents';

export function TeamBrief() {
  const [insights, setInsights] = useState<TeamInsight[]>([]);

  useEffect(() => {
    const fresh = generateInsights();
    // Show up to 3 unseen, newest first
    const unseen = fresh.filter(i => !i.seen).slice(0, 3);
    setInsights(unseen);
  }, []);

  function dismiss(id: string) {
    markInsightsSeen([id]);
    setInsights(prev => prev.filter(i => i.id !== id));
  }

  if (insights.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium">
          Team Brief
        </h3>
        <span className="text-[10px] text-white/30 font-mono">
          {insights.length} signal{insights.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {insights.map((insight, i) => {
            const agent = AGENTS[insight.agent];
            return (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative group rounded-2xl p-4 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] overflow-hidden"
              >
                {/* Accent vein */}
                <div
                  className="absolute inset-y-0 left-0 w-[2px]"
                  style={{ background: `linear-gradient(to bottom, ${agent.accent}, transparent)` }}
                />
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold font-mono"
                    style={{
                      background: `color-mix(in srgb, ${agent.accent} 16%, transparent)`,
                      color: agent.accent,
                      boxShadow: `0 0 18px color-mix(in srgb, ${agent.accent} 25%, transparent)`,
                    }}
                  >
                    {agent.glyph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                      {agent.name}
                    </div>
                    <p className="text-[14px] leading-relaxed text-white/85">
                      {insight.insight}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(insight.id)}
                    aria-label="Dismiss"
                    className="shrink-0 text-white/30 hover:text-white/70 transition-colors text-lg leading-none p-1 -m-1"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
