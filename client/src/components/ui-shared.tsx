// ============================================================
// MINDSHIFT AI — SHARED UI COMPONENTS
// Sovereign Console design system
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { momentumResetAffirmations, formatStamp } from '@/lib/content';

// ── Operator Stamp ────────────────────────────────────────────
export function Stamp({ label }: { label?: string }) {
  return (
    <span className="font-mono-stamp text-[10px] tracking-[0.12em] uppercase text-white/35">
      {label ?? formatStamp()}
    </span>
  );
}

// ── Hairline ─────────────────────────────────────────────────
export function Hairline({ className = '' }: { className?: string }) {
  return <div className={`hairline ${className}`} />;
}

// ── Page Header ───────────────────────────────────────────────
export function PageHeader({
  title,
  stamp,
  right,
}: {
  title: string;
  stamp?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between pt-2 pb-4">
      <div className="flex flex-col gap-1">
        <Stamp label={stamp} />
        <h1
          className="text-[1.6rem] leading-[1.15] tracking-[-0.025em] text-[#F5F4F1]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
        >
          {title}
        </h1>
      </div>
      {right && <div className="flex items-center gap-2 pt-1">{right}</div>}
    </div>
  );
}

// ── Affirmation Card (swipeable single-statement) ─────────────
export function AffirmationCard({
  affirmations,
  autoAdvance = false,
  interval = 6000,
}: {
  affirmations: string[];
  autoAdvance?: boolean;
  interval?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const next = useCallback(() => {
    setDir(1);
    setIdx(i => (i + 1) % affirmations.length);
  }, [affirmations.length]);

  const prev = useCallback(() => {
    setDir(-1);
    setIdx(i => (i - 1 + affirmations.length) % affirmations.length);
  }, [affirmations.length]);

  useEffect(() => {
    if (!autoAdvance) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [autoAdvance, interval, next]);

  return (
    <div className="relative overflow-hidden rounded-2xl glass-card p-6 min-h-[160px] flex flex-col justify-between select-none">
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(232,224,208,0.04) 0%, transparent 60%)',
        }}
      />

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.p
          key={idx}
          custom={dir}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 20 }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -20 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="affirmation-text relative z-10"
        >
          {affirmations[idx]}
        </motion.p>
      </AnimatePresence>

      {/* Dots + nav */}
      <div className="flex items-center justify-between mt-5 relative z-10">
        <div className="flex gap-1.5">
          {affirmations.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDir(i > idx ? 1 : -1); setIdx(i); }}
              className="transition-all duration-300"
              style={{
                width: i === idx ? 16 : 5,
                height: 5,
                borderRadius: 100,
                background: i === idx ? '#E8E0D0' : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            ‹
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Momentum Reset Button ─────────────────────────────────────
export function MomentumReset() {
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState('');
  const [glowing, setGlowing] = useState(false);

  const trigger = () => {
    const aff = momentumResetAffirmations[Math.floor(Math.random() * momentumResetAffirmations.length)];
    setMsg(aff);
    setActive(true);
    setGlowing(true);
    setTimeout(() => setGlowing(false), 600);
  };

  return (
    <>
      <button
        onClick={trigger}
        className={`btn-reset ${glowing ? 'reset-glow-anim' : ''}`}
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em' }}
      >
        ↺ RESET
      </button>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(10,10,11,0.92)', backdropFilter: 'blur(20px)' }}
            onClick={() => setActive(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 4 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(224,138,107,0.12)', border: '1px solid rgba(224,138,107,0.25)' }}
              >
                <span className="text-terra text-lg">↺</span>
              </div>
              <p
                className="text-[1.75rem] leading-[1.2] tracking-[-0.02em] text-[#F5F4F1] mb-8"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
              >
                {msg}
              </p>
              <button
                onClick={() => setActive(false)}
                className="btn-bone"
              >
                Continue forward
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Progress Ring ─────────────────────────────────────────────
export function ProgressRing({
  value,
  max,
  size = 56,
  strokeWidth = 3,
  color = '#E8E0D0',
  label,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      {label && (
        <span
          className="absolute text-[10px] text-white/60"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.05em' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ── Metric Tile ───────────────────────────────────────────────
export function MetricTile({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1">
      <span className="font-mono-stamp text-white/35">{label}</span>
      <div className="flex items-end gap-1">
        <span
          className="text-2xl leading-none tracking-[-0.02em]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            color: accent ? '#7BC598' : '#F5F4F1',
          }}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-white/35 mb-0.5">{unit}</span>}
      </div>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────
export function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Toggle Chip ───────────────────────────────────────────────
export function ToggleChip({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        letterSpacing: '0.01em',
        background: active ? '#E8E0D0' : 'rgba(255,255,255,0.06)',
        color: active ? '#0A0A0B' : 'rgba(255,255,255,0.5)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {label}
    </button>
  );
}

// ── Bottom Navigation ─────────────────────────────────────────
export type NavTab = 'today' | 'execute' | 'journal' | 'fitness' | 'progress' | 'assistant';

const NAV_ITEMS: { id: NavTab; label: string; icon: string }[] = [
  { id: 'today',     label: 'Today',     icon: '◉' },
  { id: 'execute',   label: 'Execute',   icon: '⬡' },
  { id: 'journal',   label: 'Journal',   icon: '◎' },
  { id: 'fitness',   label: 'Fitness',   icon: '◈' },
  { id: 'progress',  label: 'Progress',  icon: '△' },
  { id: 'assistant', label: 'AI',        icon: '◇' },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}) {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] py-1 transition-all duration-200"
              style={{ opacity: isActive ? 1 : 0.38 }}
            >
              <span
                className="text-base leading-none transition-transform duration-200"
                style={{
                  color: isActive ? '#E8E0D0' : '#fff',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {item.icon}
              </span>
              <span
                className="text-[9px] leading-none tracking-[0.06em] uppercase"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? '#E8E0D0' : 'rgba(255,255,255,0.4)',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
