// ============================================================
// EXECUTE SCREEN — Oracle Edition
// Gradient timer ring. Premium agent cards. Amethyst accent.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { wealthExecutionAffirmations, agents, type Agent } from '@/lib/content';
import {
  AffirmationCard,
  PageHeader,
  Hairline,
  SectionLabel,
  Card,
  EASE,
} from '@/components/ui-shared';
import { saveWorkSession, getTodaySessions } from '@/lib/storage';

type TimerState = 'idle' | 'running' | 'paused' | 'done';

const PRESETS = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '90m', seconds: 90 * 60 },
];

export default function Execute({
  onAgentSelect,
}: {
  onAgentSelect: (agent: Agent) => void;
}) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [preset, setPreset] = useState(PRESETS[1]);
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
          if ('vibrate' in navigator) navigator.vibrate?.([40, 80, 40]);
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

  // Ring geometry
  const ringSize = 220;
  const stroke = 9;
  const r = (ringSize - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen safe-top"
    >
      <div className="container pt-8 pb-32">
        <PageHeader
          stamp="EXECUTE · DEEP WORK"
          title="Execute."
          subtitle="One priority. Zero distractions. Ship."
          accent="var(--amethyst)"
        />

        {/* Wealth Execution Protocol */}
        <SectionLabel accent="var(--mint)">WEALTH EXECUTION</SectionLabel>
        <div className="mb-8">
          <AffirmationCard
            affirmations={wealthExecutionAffirmations}
            accent="var(--mint)"
            variant="mint"
          />
        </div>

        <Hairline className="mb-8" />

        {/* Deep Work Timer */}
        <SectionLabel accent="var(--amethyst)">DEEP WORK TIMER</SectionLabel>

        <Card variant="elevated" className="!p-6 flex flex-col items-center mb-8 relative overflow-hidden">
          {/* Ambient glow behind ring */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: timerState === 'running'
                ? 'radial-gradient(circle at 50% 40%, rgba(184,164,255,0.15), transparent 60%)'
                : timerState === 'done'
                  ? 'radial-gradient(circle at 50% 40%, rgba(168,232,154,0.2), transparent 60%)'
                  : 'radial-gradient(circle at 50% 40%, rgba(184,164,255,0.05), transparent 60%)',
              transition: 'background 0.6s ease',
            }}
          />

          {/* Big ring */}
          <motion.div
            className="relative mb-7"
            style={{ width: ringSize, height: ringSize }}
            animate={timerState === 'running' ? { scale: [1, 1.01, 1] } : { scale: 1 }}
            transition={{ duration: 4, repeat: timerState === 'running' ? Infinity : 0, ease: 'easeInOut' }}
          >
            <svg
              width={ringSize}
              height={ringSize}
              style={{ transform: 'rotate(-90deg)' }}
              className={timerState === 'done' ? 'ring-glow-mint' : 'ring-glow-amethyst'}
            >
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={timerState === 'done' ? 'var(--mint)' : 'var(--amethyst)'} />
                  <stop offset="100%" stopColor={timerState === 'done' ? 'var(--teal)' : 'var(--ice)'} />
                </linearGradient>
              </defs>
              <circle
                cx={ringSize / 2} cy={ringSize / 2} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={stroke}
              />
              <circle
                cx={ringSize / 2} cy={ringSize / 2} r={r}
                fill="none"
                stroke="url(#timerGrad)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {timerState === 'running' && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="pulse-dot" style={{ background: 'var(--amethyst)' }} />
                  <span className="font-mono-stamp" style={{ color: 'var(--amethyst)' }}>
                    IN SESSION
                  </span>
                </div>
              )}
              {timerState === 'paused' && (
                <span className="font-mono-stamp mb-2 text-white/40">PAUSED</span>
              )}
              {timerState === 'done' && (
                <span className="font-mono-stamp mb-2" style={{ color: 'var(--mint)' }}>
                  COMPLETE
                </span>
              )}
              {timerState === 'idle' && (
                <span className="font-mono-stamp mb-2 text-white/40">READY</span>
              )}
              <span
                className="leading-none tabular-nums"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: '3.5rem',
                  letterSpacing: '-0.04em',
                  color: '#F5F4F8',
                  fontFeatureSettings: '"tnum" on',
                }}
              >
                {timeStr}
              </span>
              <span className="font-mono-stamp mt-2 text-white/35">
                {preset.label.toUpperCase()} SESSION
              </span>
            </div>
          </motion.div>

          {/* Preset selector */}
          {timerState === 'idle' && (
            <div
              className="flex gap-1 mb-5 rounded-full p-1 relative"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {PRESETS.map(p => {
                const active = preset.label === p.label;
                return (
                  <button
                    key={p.label}
                    onClick={() => setPreset(p)}
                    className="px-5 py-2 rounded-full transition-all duration-300 relative z-10"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: active ? 600 : 500,
                      letterSpacing: '0.08em',
                      background: active
                        ? 'linear-gradient(180deg, #C9B8FF 0%, #A68FFF 100%)'
                        : 'transparent',
                      color: active ? '#0A0A0F' : 'rgba(245,244,248,0.5)',
                      boxShadow: active ? '0 4px 12px rgba(184,164,255,0.25)' : 'none',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 items-center">
            {timerState === 'idle' && (
              <button onClick={start} className="btn-primary px-10">
                Begin Session
              </button>
            )}
            {timerState === 'running' && (
              <>
                <button onClick={pause} className="btn-primary px-8">Pause</button>
                <button onClick={complete} className="btn-ghost">End</button>
              </>
            )}
            {timerState === 'paused' && (
              <>
                <button onClick={start} className="btn-primary px-8">Resume</button>
                <button onClick={reset} className="btn-ghost">Reset</button>
              </>
            )}
            {timerState === 'done' && (
              <button onClick={reset} className="btn-primary px-10">New Session</button>
            )}
          </div>

          {totalMin > 0 && (
            <div className="mt-5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--amethyst)' }} />
              <span className="font-mono-stamp text-white/50">
                {totalMin} MIN FOCUSED TODAY
              </span>
            </div>
          )}
        </Card>

        <Hairline className="mb-8" />

        {/* AI Virtual Team */}
        <SectionLabel accent="var(--ice)">AI VIRTUAL TEAM</SectionLabel>
        <p
          className="text-white/45 text-sm mb-4"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          Tap an agent to start a conversation.
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {agents.map((agent, i) => {
            const accent = AGENT_ACCENTS[i % AGENT_ACCENTS.length];
            return (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                onClick={() => onAgentSelect(agent)}
                className="card-solid flex items-center gap-4 p-4 text-left transition-all duration-300 hover:scale-[1.01] group"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent.bg1} 0%, ${accent.bg2} 100%)`,
                    border: `1px solid ${accent.border}`,
                    boxShadow: `0 4px 16px ${accent.glow}`,
                  }}
                >
                  <AgentIcon id={agent.id} color={accent.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-white text-[0.95rem] font-medium"
                    style={{ fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em' }}
                  >
                    {agent.name}
                  </p>
                  <p
                    className="text-white/45 text-xs mt-0.5 truncate"
                    style={{ fontFamily: 'var(--font-ui)' }}
                  >
                    {agent.description}
                  </p>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="transition-all duration-300 group-hover:translate-x-0.5"
                  style={{ color: 'rgba(245,244,248,0.3)' }}
                >
                  <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Agent accent palette ─────────────────────────────────────
const AGENT_ACCENTS = [
  { color: 'var(--amethyst)', bg1: 'rgba(184,164,255,0.18)', bg2: 'rgba(122,92,232,0.06)', border: 'rgba(184,164,255,0.25)', glow: 'rgba(184,164,255,0.12)' },
  { color: 'var(--mint)',     bg1: 'rgba(168,232,154,0.16)', bg2: 'rgba(111,200,94,0.05)',  border: 'rgba(168,232,154,0.22)', glow: 'rgba(168,232,154,0.1)' },
  { color: 'var(--peach)',    bg1: 'rgba(255,184,154,0.16)', bg2: 'rgba(255,137,101,0.05)', border: 'rgba(255,184,154,0.22)', glow: 'rgba(255,184,154,0.1)' },
  { color: 'var(--teal)',     bg1: 'rgba(122,224,211,0.16)', bg2: 'rgba(63,185,168,0.05)',  border: 'rgba(122,224,211,0.22)', glow: 'rgba(122,224,211,0.1)' },
  { color: 'var(--coral)',    bg1: 'rgba(255,138,158,0.16)', bg2: 'rgba(232,85,112,0.05)',  border: 'rgba(255,138,158,0.22)', glow: 'rgba(255,138,158,0.1)' },
  { color: 'var(--citrine)',  bg1: 'rgba(255,224,138,0.16)', bg2: 'rgba(255,201,74,0.05)',  border: 'rgba(255,224,138,0.22)', glow: 'rgba(255,224,138,0.1)' },
];

function AgentIcon({ id, color }: { id: string; color: string }) {
  const s = 18;
  switch (id) {
    case 'ceo':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="6" r="3" stroke={color} strokeWidth="1.5"/>
          <path d="M3 15C3 12 5.5 10 9 10C12.5 10 15 12 15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'revenue':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
          <path d="M3 13L7 8L10 11L15 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 5H15V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'content':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
          <path d="M4 3H14V13L9 15L4 13V3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M7 7H11M7 10H10" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      );
    case 'ops':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2" stroke={color} strokeWidth="1.5"/>
          <path d="M9 3V5M9 13V15M3 9H5M13 9H15M4.5 4.5L6 6M12 12L13.5 13.5M4.5 13.5L6 12M12 6L13.5 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'mindset':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
          <path d="M9 2C5.5 2 3 4.5 3 8C3 10 4 11.5 5.5 12.5V15H12.5V12.5C14 11.5 15 10 15 8C15 4.5 12.5 2 9 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'fitness':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none">
          <path d="M4 7V11M14 7V11M4 9H14M2 8V10M16 8V10" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      );
    default:
      return <span style={{ color }}>•</span>;
  }
}
