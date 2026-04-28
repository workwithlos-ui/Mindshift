// ============================================================
// EXECUTE SCREEN — Deep work. One priority. Ship daily.
// Wealth Execution Protocol affirmations surface before work.
// Deep work timer + AI Virtual Team quick-launch.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  wealthExecutionAffirmations,
  agents,
  type Agent,
} from '@/lib/content';
import {
  AffirmationCard,
  PageHeader,
  Hairline,
  SectionCard,
} from '@/components/ui-shared';
import { saveWorkSession, getTodaySessions } from '@/lib/storage';

type TimerState = 'idle' | 'running' | 'paused' | 'done';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '90 min', seconds: 90 * 60 },
];

export default function Execute({
  onAgentSelect,
}: {
  onAgentSelect: (agent: Agent) => void;
}) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [preset, setPreset] = useState(PRESETS[0]);
  const [remaining, setRemaining] = useState(preset.seconds);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessions = getTodaySessions();
  const totalMin = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const start = useCallback(() => {
    setTimerState('running');
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearTimer();
          setTimerState('done');
          setElapsed(prev => prev + 1);
          return 0;
        }
        setElapsed(prev => prev + 1);
        return r - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setTimerState('paused');
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimerState('idle');
    setRemaining(preset.seconds);
    setElapsed(0);
  }, [clearTimer, preset.seconds]);

  const complete = useCallback(() => {
    clearTimer();
    saveWorkSession(elapsed);
    setTimerState('idle');
    setRemaining(preset.seconds);
    setElapsed(0);
  }, [clearTimer, elapsed, preset.seconds]);

  useEffect(() => {
    if (timerState === 'done') {
      saveWorkSession(preset.seconds);
    }
  }, [timerState, preset.seconds]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (timerState === 'idle') {
      setRemaining(preset.seconds);
      setElapsed(0);
    }
  }, [preset, timerState]);

  const pct = 1 - remaining / preset.seconds;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const circumference = 2 * Math.PI * 52;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen"
    >
      <div className="container pt-14 pb-32">
        <PageHeader title="Execute." stamp="EXECUTE · WORK SESSION" />

        {/* Wealth Execution affirmations */}
        <div className="mb-3">
          <span className="font-mono-stamp text-white/30">Wealth Execution Protocol</span>
        </div>
        <AffirmationCard affirmations={wealthExecutionAffirmations} />

        <Hairline className="my-7" />

        {/* Deep Work Timer */}
        <div className="mb-3">
          <span className="font-mono-stamp text-white/30">Deep Work Timer</span>
        </div>

        <SectionCard className="flex flex-col items-center py-8">
          {/* Ring */}
          <div className="relative mb-6">
            <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={64} cy={64} r={52} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
              <circle
                cx={64} cy={64} r={52}
                fill="none"
                stroke={timerState === 'done' ? '#7BC598' : '#E8E0D0'}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-3xl leading-none tracking-[-0.03em] text-[#F5F4F1]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
              >
                {timeStr}
              </span>
              {timerState === 'done' && (
                <span className="text-sage text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                  COMPLETE
                </span>
              )}
            </div>
          </div>

          {/* Preset selector */}
          {timerState === 'idle' && (
            <div className="flex gap-2 mb-6">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setPreset(p)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    background: preset.label === p.label ? '#E8E0D0' : 'rgba(255,255,255,0.06)',
                    color: preset.label === p.label ? '#0A0A0B' : 'rgba(255,255,255,0.5)',
                    border: preset.label === p.label ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {timerState === 'idle' && (
              <button onClick={start} className="btn-bone px-8">
                Start
              </button>
            )}
            {timerState === 'running' && (
              <>
                <button onClick={pause} className="btn-bone">
                  Pause
                </button>
                <button
                  onClick={complete}
                  className="px-4 py-2 rounded-full text-xs text-white/40 transition-colors hover:text-white/60"
                  style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
                >
                  End
                </button>
              </>
            )}
            {timerState === 'paused' && (
              <>
                <button onClick={start} className="btn-bone">
                  Resume
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-full text-xs text-white/40 transition-colors hover:text-white/60"
                  style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
                >
                  Reset
                </button>
              </>
            )}
            {timerState === 'done' && (
              <button onClick={reset} className="btn-bone px-8">
                New Session
              </button>
            )}
          </div>

          {totalMin > 0 && (
            <p className="mt-4 text-white/30 text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
              {totalMin} MIN FOCUSED TODAY
            </p>
          )}
        </SectionCard>

        <Hairline className="my-7" />

        {/* AI Virtual Team */}
        <div className="mb-4">
          <span className="font-mono-stamp text-white/30">AI Virtual Team</span>
          <p className="text-white/35 text-xs mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
            Tap an agent to activate in the Assistant
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {agents.map((agent, i) => (
            <motion.button
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onAgentSelect(agent)}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 group"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                style={{ background: 'rgba(232,224,208,0.07)', border: '1px solid rgba(232,224,208,0.1)' }}
              >
                <span className="text-bone text-base">{agent.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[#F5F4F1] text-sm font-medium"
                  style={{ fontFamily: 'var(--font-ui)' }}
                >
                  {agent.name} Agent
                </p>
                <p
                  className="text-white/35 text-xs mt-0.5"
                  style={{ fontFamily: 'var(--font-ui)' }}
                >
                  {agent.description}
                </p>
              </div>
              <span className="text-white/20 text-sm group-hover:text-white/40 transition-colors">→</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
