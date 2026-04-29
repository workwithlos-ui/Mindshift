// ============================================================
// TODAY SCREEN — Oracle Edition
// Morning / Midday / Evening aware. Oura-level UI.
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTimeOfDay,
  getGreeting,
  formatDate,
  formatStamp,
  getTimeAffirmations,
  eveningReviewQuestions,
  type TimeOfDay,
} from '@/lib/content';
import {
  AffirmationCard,
  Hairline,
  MomentumReset,
  MetricTile,
  ScoreRing,
  Card,
  SectionLabel,
  EASE,
} from '@/components/ui-shared';
import { TeamBrief } from '@/components/TeamBrief';
import { getTodayProgress, saveTodayProgress, getTodaySessions, getUserProfile } from '@/lib/storage';
import { getBriefing } from '@/lib/personalization';

// ── Time-of-day design config ────────────────────────────────
type TimeConfig = {
  label: string;
  accent: string;
  variant: 'amethyst' | 'teal' | 'peach' | 'mint' | 'coral';
  sectionTitle: string;
};

const TIME_CONFIG: Record<TimeOfDay, TimeConfig> = {
  morning: {
    label: 'MORNING · CORE IDENTITY',
    accent: 'var(--peach)',
    variant: 'peach',
    sectionTitle: 'CORE IDENTITY',
  },
  midday: {
    label: 'MIDDAY · FOCUS & CONTROL',
    accent: 'var(--amethyst)',
    variant: 'amethyst',
    sectionTitle: 'FOCUS COMMANDS',
  },
  evening: {
    label: 'EVENING · REVIEW',
    accent: 'var(--teal)',
    variant: 'teal',
    sectionTitle: 'EVENING REVIEW',
  },
};

// ── Day score calculation ────────────────────────────────────
function calcDayScore(focusMin: number, actions: number, content: number, revenue: boolean, priority: boolean): number {
  // Simple weighted score out of 100
  const focusScore = Math.min(focusMin / 90, 1) * 30;       // 30 pts max
  const actionScore = Math.min(actions / 5, 1) * 25;        // 25 pts max
  const contentScore = Math.min(content / 2, 1) * 15;       // 15 pts max
  const revenueScore = revenue ? 20 : 0;                    // 20 pts
  const priorityScore = priority ? 10 : 0;                  // 10 pts
  return Math.round(focusScore + actionScore + contentScore + revenueScore + priorityScore);
}

export default function Today() {
  const [time, setTime] = useState<TimeOfDay>(getTimeOfDay());
  const [progress, setProgress] = useState(getTodayProgress());
  const sessions = getTodaySessions();
  const totalFocusMin = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeOfDay()), 60_000);
    return () => clearInterval(t);
  }, []);

  const cfg = TIME_CONFIG[time];
  const profile = getUserProfile();
  const briefing = getBriefing();
  const greeting = profile?.name ? briefing.greeting : getGreeting();
  const score = calcDayScore(
    totalFocusMin,
    progress.meaningfulActions,
    progress.contentProduced,
    progress.revenueMoved,
    !!progress.priority,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen relative safe-top"
    >
      <div className="container pt-8 pb-32">
        {/* ── Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="flex items-start justify-between mb-8"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: cfg.accent,
                  boxShadow: `0 0 12px ${cfg.accent}`,
                }}
              />
              <span className="font-mono-stamp text-white/40">
                {formatStamp()} · {cfg.label}
              </span>
            </div>
            <h1 className="display-xl text-white">{greeting}</h1>
            <p className="mt-1 text-sm text-white/45" style={{ fontFamily: 'var(--font-ui)' }}>
              {formatDate()}
            </p>
          </div>
          <div className="pt-1 flex-shrink-0">
            <MomentumReset />
          </div>
        </motion.div>

        {briefing.nudge && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}
            className="mb-4"
            style={{
              background: 'rgba(183,148,244,0.06)',
              border: '1px solid rgba(183,148,244,0.18)',
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: 13,
              color: 'rgba(245,244,248,0.8)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em', color: 'rgba(183,148,244,0.75)', display: 'block', marginBottom: 4 }}>
              SIGNAL
            </span>
            {briefing.nudge}
          </motion.div>
        )}

        {/* ── Day Score Hero ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className="card-elevated p-6 mb-6 flex items-center gap-5 relative overflow-hidden"
        >
          {/* Glow ambient */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                'radial-gradient(circle at 0% 50%, rgba(184,164,255,0.08), transparent 50%)',
            }}
          />
          <div className="relative">
            <ScoreRing value={score} size={140} scoreLabel="DAY SCORE" label={scoreLabelText(score)} />
          </div>
          <div className="flex-1 min-w-0 relative">
            <SectionLabel accent={cfg.accent}>TODAY'S SIGNAL</SectionLabel>
            <p
              className="mb-3 leading-snug"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '1.05rem',
                color: 'rgba(245,244,248,0.92)',
                letterSpacing: '-0.015em',
              }}
            >
              {signalMessage(score, time)}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" style={{ background: cfg.accent }} />
              <span
                className="font-mono-stamp"
                style={{ color: cfg.accent, fontWeight: 600 }}
              >
                {scoreBadge(score)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Metrics ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.15 }}
          className="grid grid-cols-3 gap-2.5 mb-8"
        >
          <MetricTile
            label="FOCUS"
            value={totalFocusMin}
            unit="min"
            accent={totalFocusMin >= 60}
            accentColor="var(--amethyst)"
          />
          <MetricTile
            label="ACTIONS"
            value={progress.meaningfulActions}
            accent={progress.meaningfulActions >= 3}
            accentColor="var(--mint)"
          />
          <MetricTile
            label="CONTENT"
            value={progress.contentProduced}
            accent={progress.contentProduced >= 1}
            accentColor="var(--peach)"
          />
        </motion.div>

        {/* ── Time-aware content ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
          className="mb-8"
        >
          {time !== 'evening' ? (
            <>
              <SectionLabel accent={cfg.accent}>{cfg.sectionTitle}</SectionLabel>
              <AffirmationCard
                affirmations={getTimeAffirmations(time)}
                accent={cfg.accent}
                variant={cfg.variant}
              />
            </>
          ) : (
            <EveningReview
              progress={progress}
              onSave={p => { saveTodayProgress(p); setProgress(p); }}
            />
          )}
        </motion.div>

        <Hairline className="mb-6" />

        {/* ── Team Brief (proactive insights) ──────────── */}
        <TeamBrief />

        {/* ── One Priority ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
          className="mb-5"
        >
          <SectionLabel accent="var(--citrine)">ONE PRIORITY</SectionLabel>
          <TodayPriority
            value={progress.priority}
            onChange={v => {
              const p = { ...progress, priority: v };
              saveTodayProgress(p);
              setProgress(p);
            }}
          />
        </motion.div>

        {/* ── Revenue moved toggle ───────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
          onClick={() => {
            const p = { ...progress, revenueMoved: !progress.revenueMoved };
            saveTodayProgress(p);
            setProgress(p);
            if ('vibrate' in navigator) navigator.vibrate?.(8);
          }}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: progress.revenueMoved
              ? 'linear-gradient(135deg, rgba(168,232,154,0.14) 0%, rgba(111,200,94,0.05) 100%)'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${progress.revenueMoved ? 'rgba(168,232,154,0.28)' : 'rgba(255,255,255,0.07)'}`,
            boxShadow: progress.revenueMoved
              ? '0 8px 32px -12px rgba(168,232,154,0.2)'
              : 'none',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: progress.revenueMoved ? 'var(--mint)' : 'rgba(255,255,255,0.06)',
                border: progress.revenueMoved ? 'none' : '1px solid rgba(255,255,255,0.12)',
                boxShadow: progress.revenueMoved ? '0 0 16px rgba(168,232,154,0.4)' : 'none',
              }}
            >
              {progress.revenueMoved && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4.5L4 7L10 1" stroke="#0A0A0F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span
              className="text-sm"
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                color: progress.revenueMoved ? 'var(--mint)' : 'rgba(245,244,248,0.65)',
              }}
            >
              Revenue moved forward today
            </span>
          </div>
          {progress.revenueMoved && (
            <span className="pulse-dot" style={{ background: 'var(--mint)' }} />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Signal helpers ───────────────────────────────────────────
function scoreLabelText(score: number): string {
  if (score >= 85) return 'Optimal';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Building';
  if (score >= 25) return 'Warming';
  return 'Begin';
}

function scoreBadge(score: number): string {
  if (score >= 85) return 'OPTIMAL ZONE';
  if (score >= 70) return 'ON TRACK';
  if (score >= 50) return 'IN MOTION';
  if (score >= 25) return 'WARMING UP';
  return 'READY';
}

function signalMessage(score: number, time: TimeOfDay): string {
  if (score >= 85) return "Peak execution. Protect the momentum.";
  if (score >= 70) return "Strong rhythm today. Keep shipping.";
  if (score >= 50) return "Building momentum. Don't stop now.";
  if (score >= 25) return time === 'evening' ? "A quiet day. Reset tonight." : "Start small. One action moves you.";
  return time === 'morning'
    ? "Fresh canvas. One decisive action resets the day."
    : time === 'midday'
      ? "Begin now. Momentum compounds quickly."
      : "Tomorrow is another chance to execute.";
}

// ── Today Priority ───────────────────────────────────────────
function TodayPriority({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <Card variant="elevated" className="relative">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => { onChange(draft); setEditing(false); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { onChange(draft); setEditing(false); }
            if (e.key === 'Escape') setEditing(false);
          }}
          placeholder="What is the ONE thing that matters today?"
          className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.15rem',
            letterSpacing: '-0.02em',
          }}
        />
      </Card>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left card-elevated p-5 transition-all duration-300 hover:scale-[1.005]"
      style={{
        borderColor: value ? 'rgba(255,224,138,0.2)' : 'rgba(255,255,255,0.09)',
      }}
    >
      {value ? (
        <div className="flex items-start gap-3">
          <span
            className="mt-1.5 w-1 h-5 rounded-full flex-shrink-0"
            style={{ background: 'var(--citrine)', boxShadow: '0 0 12px var(--citrine)' }}
          />
          <span
            className="text-white leading-snug"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </span>
        </div>
      ) : (
        <span
          className="text-white/30"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.1rem',
          }}
        >
          Set your one priority →
        </span>
      )}
    </button>
  );
}

// ── Evening Review ───────────────────────────────────────────
function EveningReview({
  progress,
  onSave,
}: {
  progress: ReturnType<typeof getTodayProgress>;
  onSave: (p: ReturnType<typeof getTodayProgress>) => void;
}) {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(eveningReviewQuestions.length).fill(''));
  const [draft, setDraft] = useState('');
  const [done, setDone] = useState(false);

  const q = eveningReviewQuestions[qIdx];

  const advance = () => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = draft;
    setAnswers(newAnswers);
    setDraft('');
    if (qIdx < eveningReviewQuestions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setDone(true);
      onSave({ ...progress, notes: newAnswers.filter(Boolean).join('\n\n') });
    }
  };

  if (done) {
    return (
      <Card variant="teal" className="text-center !p-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'rgba(122,224,211,0.15)',
            border: '1px solid rgba(122,224,211,0.3)',
            boxShadow: '0 0 32px rgba(122,224,211,0.25)',
          }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <path d="M2 8L7 13L18 2" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p
          className="mb-1.5"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.35rem', color: '#F5F4F8' }}
        >
          Day reviewed.
        </p>
        <p className="text-white/50 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
          Rest well. Tomorrow you execute again.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="teal" className="!p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-1.5">
          {eveningReviewQuestions.map((_, idx) => (
            <div
              key={idx}
              className="h-0.5 rounded-full transition-all duration-500"
              style={{
                width: idx === qIdx ? 24 : 8,
                background: idx <= qIdx ? 'var(--teal)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        <div className="flex-1" />
        <span className="font-mono-stamp text-white/40">
          {qIdx + 1} / {eveningReviewQuestions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={qIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="mb-4 leading-snug"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.35rem',
            color: '#F5F4F8',
            letterSpacing: '-0.025em',
          }}
        >
          {q}
        </motion.p>
      </AnimatePresence>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Your answer..."
        rows={3}
        className="w-full bg-transparent text-white outline-none resize-none placeholder:text-white/25 mb-5"
        style={{ fontFamily: 'var(--font-ui)', fontSize: '0.95rem', lineHeight: 1.6 }}
      />
      <button onClick={advance} className="btn-primary w-full">
        {qIdx < eveningReviewQuestions.length - 1 ? 'Next →' : 'Complete Review'}
      </button>
    </Card>
  );
}
