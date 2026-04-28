// ============================================================
// SHARED UI — ORACLE EDITION
// Oura-level dark + pastel accents. Premium cards & components.
// ============================================================

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { momentumResetAffirmations } from '@/lib/content';

// ── Easings ──────────────────────────────────────────────────
export const EASE = [0.22, 1, 0.36, 1] as const;
export const smooth: Transition = { duration: 0.45, ease: EASE };

// ── Hairline ─────────────────────────────────────────────────
export function Hairline({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-white/[0.06] ${className}`} />;
}

// ── Page header ──────────────────────────────────────────────
export function PageHeader({
  stamp,
  title,
  subtitle,
  accent = 'var(--amethyst)',
  right,
}: {
  stamp: string;
  title: string;
  subtitle?: string;
  accent?: string;
  right?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mb-6 flex items-start justify-between gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
          />
          <span className="font-mono-stamp" style={{ color: 'rgba(245,244,248,0.4)' }}>
            {stamp}
          </span>
        </div>
        <h1 className="display-xl text-white">{title}</h1>
        {subtitle && (
          <p
            className="mt-1 text-white/45 text-sm"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 pt-1 flex-shrink-0">{right}</div>}
    </motion.div>
  );
}

// ── Section label ────────────────────────────────────────────
export function SectionLabel({
  children,
  accent = 'var(--amethyst)',
  className = '',
  right,
}: {
  children: ReactNode;
  accent?: string;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 mb-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span
          className="w-1 h-1 rounded-full opacity-80"
          style={{ background: accent }}
        />
        <span className="font-mono-stamp text-white/40">{children}</span>
      </div>
      {right}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
  variant = 'solid',
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  variant?: 'solid' | 'glass' | 'elevated' | 'amethyst' | 'teal' | 'peach' | 'mint' | 'coral';
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const classes: Record<string, string> = {
    solid: 'card-solid',
    glass: 'card-glass',
    elevated: 'card-elevated',
    amethyst: 'card-hero-amethyst',
    teal: 'card-hero-teal',
    peach: 'card-hero-peach',
    mint: 'card-hero-mint',
    coral: 'card-hero-coral',
  };
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      className={`${classes[variant]} p-5 ${onClick ? 'text-left w-full' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </Wrapper>
  );
}

// Compat alias for older imports
export const SectionCard = Card;

// ── Stamp (small inline) ─────────────────────────────────────
export function Stamp({ children, accent }: { children: ReactNode; accent?: string }) {
  return (
    <span className="font-mono-stamp" style={{ color: accent ?? 'rgba(245,244,248,0.4)' }}>
      {children}
    </span>
  );
}

// ── Affirmation Card (swipeable) ─────────────────────────────
export function AffirmationCard({
  affirmations,
  accent = 'var(--amethyst)',
  variant = 'amethyst',
}: {
  affirmations: string[];
  accent?: string;
  variant?: 'amethyst' | 'teal' | 'peach' | 'mint' | 'coral';
}) {
  const [i, setI] = useState(0);
  const next = () => setI(p => (p + 1) % affirmations.length);
  const prev = () => setI(p => (p - 1 + affirmations.length) % affirmations.length);

  return (
    <Card variant={variant} className="!p-6 relative overflow-hidden">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-5">
        {affirmations.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className="h-0.5 rounded-full transition-all duration-500"
            style={{
              width: idx === i ? 24 : 8,
              background: idx === i ? accent : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      <div className="min-h-[7rem] relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="display-md"
            style={{ color: 'rgba(245,244,248,0.96)' }}
          >
            &ldquo;{affirmations[i]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-5">
        <span
          className="font-mono-stamp"
          style={{ color: 'rgba(245,244,248,0.4)', fontFamily: 'var(--font-mono)' }}
        >
          {String(i + 1).padStart(2, '0')} / {String(affirmations.length).padStart(2, '0')}
        </span>
        <div className="flex gap-2">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(245,244,248,0.6)',
            }}
            aria-label="Previous"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={next}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: accent,
              color: '#0A0A0F',
              boxShadow: `0 4px 16px ${accent}40`,
            }}
            aria-label="Next"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Metric Tile ──────────────────────────────────────────────
export function MetricTile({
  label,
  value,
  unit,
  accent,
  accentColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
  accentColor?: string;
}) {
  const color = accent ? (accentColor ?? 'var(--mint)') : 'rgba(245,244,248,0.95)';
  return (
    <div
      className="card-solid flex flex-col justify-between"
      style={{ padding: '0.95rem 0.9rem', minHeight: 80 }}
    >
      <span className="font-mono-stamp text-white/35">{label}</span>
      <div className="flex items-baseline gap-1 mt-2">
        <span
          className="metric-md"
          style={{ color, transition: 'color 0.3s ease' }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="text-xs"
            style={{ color: 'rgba(245,244,248,0.35)', fontFamily: 'var(--font-mono)' }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Progress Ring (small) ────────────────────────────────────
export function ProgressRing({
  value,
  max,
  size = 56,
  stroke = 3.5,
  color = 'var(--amethyst)',
  label,
  glow = true,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  glow?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = c * (1 - pct);
  const glowClass = color.includes('mint') ? 'ring-glow-mint'
    : color.includes('teal') ? 'ring-glow-teal'
    : color.includes('peach') ? 'ring-glow-peach'
    : 'ring-glow-amethyst';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        style={{ transform: 'rotate(-90deg)' }}
        className={glow ? glowClass : ''}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            color: 'rgba(245,244,248,0.95)',
            fontSize: size * 0.26,
          }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: Math.max(size * 0.11, 8),
              letterSpacing: '0.08em',
              color: 'rgba(245,244,248,0.35)',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Score Ring (large Oura-style) ────────────────────────────
export function ScoreRing({
  value,
  size = 180,
  label,
  scoreLabel,
}: {
  value: number; // 0-100
  size?: number;
  label?: string;
  scoreLabel?: string;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / 100, 1);
  const offset = c * (1 - pct);
  const gradId = `scoreGrad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="ring-glow-amethyst">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--amethyst)" />
            <stop offset="50%" stopColor="var(--teal)" />
            <stop offset="100%" stopColor="var(--peach)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {scoreLabel && (
          <span
            className="font-mono-stamp mb-1.5"
            style={{ color: 'rgba(245,244,248,0.4)' }}
          >
            {scoreLabel}
          </span>
        )}
        <span
          className="leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            color: '#F5F4F8',
            fontSize: size * 0.32,
            letterSpacing: '-0.04em',
          }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-2 text-xs"
            style={{
              fontFamily: 'var(--font-ui)',
              color: 'rgba(245,244,248,0.55)',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Momentum Reset Modal ─────────────────────────────────────
function MomentumResetModal({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const next = () => {
    if (i < momentumResetAffirmations.length - 1) {
      setI(i + 1);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(10);
      }
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{
        background: 'rgba(7, 7, 10, 0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,138,158,0.2), transparent 60%), radial-gradient(ellipse 50% 40% at 50% 85%, rgba(184,164,255,0.12), transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Pulsing core */}
        <motion.div
          className="mb-8 relative w-20 h-20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,138,158,0.5) 0%, rgba(255,138,158,0.15) 55%, transparent 100%)',
              filter: 'blur(4px)',
            }}
          />
          <div
            className="relative w-4 h-4 rounded-full"
            style={{
              background: 'var(--coral)',
              boxShadow: '0 0 32px var(--coral), 0 0 64px rgba(255,138,158,0.4)',
            }}
          />
        </motion.div>

        <span
          className="font-mono-stamp mb-5"
          style={{ color: 'var(--coral)' }}
        >
          MOMENTUM RESET
        </span>

        <div className="min-h-[8rem] flex items-center justify-center mb-10 w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="text-center"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                fontSize: '1.875rem',
                lineHeight: 1.2,
                letterSpacing: '-0.035em',
                color: '#F5F4F8',
              }}
            >
              &ldquo;{momentumResetAffirmations[i]}&rdquo;
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex gap-1.5 mb-8">
          {momentumResetAffirmations.map((_, idx) => (
            <div
              key={idx}
              className="h-0.5 rounded-full transition-all duration-400"
              style={{
                width: idx === i ? 28 : 10,
                background: idx <= i ? 'var(--coral)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        <button onClick={next} className="btn-primary w-full max-w-xs">
          {i === momentumResetAffirmations.length - 1 ? 'Continue Forward →' : 'Next →'}
        </button>
        <button
          onClick={onClose}
          className="mt-4 text-white/30 hover:text-white/50 transition-colors"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em' }}
        >
          CLOSE
        </button>
      </div>
    </motion.div>
  );
}

// ── Momentum Reset (button + modal as single component) ──────
export function MomentumReset() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
        style={{
          background: 'linear-gradient(180deg, rgba(255,138,158,0.14) 0%, rgba(232,85,112,0.08) 100%)',
          border: '1px solid rgba(255,138,158,0.22)',
          color: 'var(--coral)',
        }}
        aria-label="Momentum Reset"
      >
        <span className="pulse-dot" style={{ background: 'var(--coral)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '0.12em',
            fontWeight: 600,
          }}
        >
          RESET
        </span>
      </button>

      <AnimatePresence>
        {open && <MomentumResetModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// ── Toggle Pills ─────────────────────────────────────────────
export function TogglePills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={opt.value === value ? 'pill pill-active' : 'pill'}
          style={{
            border: 'none',
            background: opt.value === value ? undefined : 'transparent',
            padding: '0.375rem 0.75rem',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Bottom Navigation ────────────────────────────────────────
export type NavTab = 'today' | 'execute' | 'journal' | 'fitness' | 'progress' | 'assistant';

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'execute', label: 'Execute' },
  { id: 'journal', label: 'Journal' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'progress', label: 'Progress' },
  { id: 'assistant', label: 'AI' },
];

export function BottomNav({ active, onChange }: { active: NavTab; onChange: (t: NavTab) => void }) {
  return (
    <nav className="bottom-nav safe-bottom pt-2.5">
      <div className="flex items-center justify-around px-2">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-1 py-1.5 px-2 transition-all duration-300 flex-1"
              aria-label={item.label}
            >
              <div
                className="w-5 h-5 flex items-center justify-center transition-all duration-300"
                style={{ opacity: isActive ? 1 : 0.45 }}
              >
                <NavIcon id={item.id} active={isActive} />
              </div>
              <span
                className="transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  letterSpacing: '0.08em',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--amethyst)' : 'rgba(245,244,248,0.35)',
                }}
              >
                {item.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ id, active }: { id: NavTab; active: boolean }) {
  const color = active ? 'var(--amethyst)' : 'rgba(245,244,248,0.6)';
  const glow = active ? `drop-shadow(0 0 8px ${color})` : 'none';
  const s = 18;
  const style = { filter: glow, transition: 'filter 0.3s ease' };

  switch (id) {
    case 'today':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none" style={style}>
          <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.5" />
          {active && <circle cx="9" cy="9" r="2.5" fill={color} />}
        </svg>
      );
    case 'execute':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none" style={style}>
          <path d="M3 9L7 13L15 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'journal':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none" style={style}>
          <path d="M4 3H13V15H4V3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M7 7H11M7 10H11" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
          {active && <circle cx="14.5" cy="9" r="1.2" fill={color} />}
        </svg>
      );
    case 'fitness':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none" style={style}>
          <path d="M9 15C9 15 3 11 3 7C3 5 4.5 3.5 6.5 3.5C7.8 3.5 9 4.5 9 4.5C9 4.5 10.2 3.5 11.5 3.5C13.5 3.5 15 5 15 7C15 11 9 15 9 15Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={active ? color : 'none'} fillOpacity={active ? 0.3 : 0}/>
        </svg>
      );
    case 'progress':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none" style={style}>
          <path d="M3 14L6 10L9 12L15 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="15" cy="4" r="1.2" fill={color}/>
        </svg>
      );
    case 'assistant':
      return (
        <svg width={s} height={s} viewBox="0 0 18 18" fill="none" style={style}>
          <path d="M9 2L10.5 6.5L15 8L10.5 9.5L9 14L7.5 9.5L3 8L7.5 6.5L9 2Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" fill={active ? color : 'none'} fillOpacity={active ? 0.2 : 0}/>
        </svg>
      );
    default:
      return null;
  }
}
