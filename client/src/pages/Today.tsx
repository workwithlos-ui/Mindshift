// ============================================================
// TODAY SCREEN — Time-aware daily view
// Morning: Core Identity affirmations
// Midday: Focus & Control commands
// Evening: Review questions
// Always: Momentum Reset
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
} from '@/components/ui-shared';
import { getTodayProgress, saveTodayProgress, getTodaySessions } from '@/lib/storage';

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: 'MORNING PROTOCOL',
  midday:  'MIDDAY RESET',
  evening: 'EVENING REVIEW',
};

const TIME_COLORS: Record<TimeOfDay, string> = {
  morning: 'rgba(232,224,208,0.04)',
  midday:  'rgba(100,140,200,0.04)',
  evening: 'rgba(123,197,152,0.04)',
};

const BG_IMAGES: Record<TimeOfDay, string> = {
  morning: 'https://d2xsxph8kpxj0f.cloudfront.net/91190584/JbwyyshxtMaKpm7nvUYhjz/hero-today-C2rS3Es56mLuQRLm43AtE6.webp',
  midday:  'https://d2xsxph8kpxj0f.cloudfront.net/91190584/JbwyyshxtMaKpm7nvUYhjz/hero-execute-9xP7vWGJV8bpvPWaxiU6PC.webp',
  evening: 'https://d2xsxph8kpxj0f.cloudfront.net/91190584/JbwyyshxtMaKpm7nvUYhjz/hero-journal-PSCsty5gkNgXCzgaLS2pso.webp',
};

export default function Today() {
  const [time, setTime] = useState<TimeOfDay>(getTimeOfDay());
  const [progress, setProgress] = useState(getTodayProgress());
  const sessions = getTodaySessions();
  const totalFocusMin = Math.round(sessions.reduce((a, s) => a + s.duration, 0) / 60);

  // Refresh time every minute
  useEffect(() => {
    const t = setInterval(() => setTime(getTimeOfDay()), 60_000);
    return () => clearInterval(t);
  }, []);

  const affirmations = getTimeAffirmations(time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen relative"
    >
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${BG_IMAGES[time]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          opacity: 0.18,
          transition: 'opacity 1s ease',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,11,0.3) 0%, rgba(10,10,11,0.95) 60%)' }}
      />

      <div className="relative z-10 container pt-14 pb-32">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <span
              className="block text-[10px] tracking-[0.12em] uppercase mb-2"
              style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
            >
              {formatStamp()} · {TIME_LABELS[time]}
            </span>
            <h1
              className="text-[2rem] leading-[1.1] tracking-[-0.025em] text-[#F5F4F1]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
            >
              {getGreeting()}
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: 'rgba(245,244,241,0.45)', fontFamily: 'var(--font-ui)' }}
            >
              {formatDate()}
            </p>
          </div>
          <MomentumReset />
        </div>

        {/* Quick metrics row */}
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          <MetricTile
            label="FOCUS"
            value={totalFocusMin}
            unit="min"
            accent={totalFocusMin >= 60}
          />
          <MetricTile
            label="ACTIONS"
            value={progress.meaningfulActions}
            accent={progress.meaningfulActions >= 3}
          />
          <MetricTile
            label="CONTENT"
            value={progress.contentProduced}
            accent={progress.contentProduced >= 1}
          />
        </div>

        <Hairline className="mb-7" />

        {/* Time-aware content */}
        {time !== 'evening' ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span
                className="text-[10px] tracking-[0.1em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
              >
                {time === 'morning' ? 'Core Identity' : 'Focus Commands'}
              </span>
              <span
                className="text-[10px]"
                style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.2)' }}
              >
                swipe →
              </span>
            </div>
            <AffirmationCard affirmations={affirmations} autoAdvance interval={7000} />
          </>
        ) : (
          <EveningReview progress={progress} onSave={p => { saveTodayProgress(p); setProgress(p); }} />
        )}

        <Hairline className="my-7" />

        {/* Priority for today */}
        <TodayPriority
          value={progress.priority}
          onChange={v => {
            const p = { ...progress, priority: v };
            saveTodayProgress(p);
            setProgress(p);
          }}
        />

        {/* Revenue moved toggle */}
        <div className="mt-5">
          <button
            onClick={() => {
              const p = { ...progress, revenueMoved: !progress.revenueMoved };
              saveTodayProgress(p);
              setProgress(p);
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
            style={{
              background: progress.revenueMoved
                ? 'rgba(123,197,152,0.1)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${progress.revenueMoved ? 'rgba(123,197,152,0.2)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: progress.revenueMoved ? '#7BC598' : 'rgba(255,255,255,0.08)',
                  border: progress.revenueMoved ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {progress.revenueMoved && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                className="text-sm"
                style={{
                  fontFamily: 'var(--font-ui)',
                  color: progress.revenueMoved ? '#7BC598' : 'rgba(255,255,255,0.6)',
                }}
              >
                Revenue moved forward today
              </span>
            </div>
            {progress.revenueMoved && (
              <div className="sage-dot" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Today Priority ────────────────────────────────────────────
function TodayPriority({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  return (
    <div>
      <span
        className="block text-[10px] tracking-[0.1em] uppercase mb-3"
        style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.3)' }}
      >
        One Priority
      </span>
      {editing ? (
        <div className="glass-card p-4">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { onChange(draft); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onChange(draft); setEditing(false); } }}
            placeholder="What is the ONE thing that matters today?"
            className="w-full bg-transparent text-[#F5F4F1] text-base outline-none placeholder:text-white/25"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.1rem' }}
          />
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left glass-card p-4 transition-all duration-200 hover:border-white/15"
        >
          {value ? (
            <span
              className="text-[#F5F4F1] text-base leading-snug"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.1rem' }}
            >
              {value}
            </span>
          ) : (
            <span
              className="text-white/25 text-base"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.1rem' }}
            >
              Set your one priority →
            </span>
          )}
        </button>
      )}
    </div>
  );
}

// ── Evening Review ────────────────────────────────────────────
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(123,197,152,0.12)', border: '1px solid rgba(123,197,152,0.2)' }}>
          <span className="text-sage text-base">✓</span>
        </div>
        <p className="text-[#F5F4F1] text-lg mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
          Day reviewed.
        </p>
        <p className="text-white/40 text-sm">Rest well. Tomorrow you execute again.</p>
      </motion.div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono-stamp text-white/30">
          {qIdx + 1} / {eveningReviewQuestions.length}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={qIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl mb-4 leading-snug"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: '#F5F4F1' }}
        >
          {q}
        </motion.p>
      </AnimatePresence>
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Your answer..."
        rows={3}
        className="w-full bg-transparent text-white/80 text-sm outline-none resize-none placeholder:text-white/20 mb-4"
        style={{ fontFamily: 'var(--font-ui)', lineHeight: 1.6 }}
      />
      <button onClick={advance} className="btn-bone w-full text-center">
        {qIdx < eveningReviewQuestions.length - 1 ? 'Next →' : 'Complete Review'}
      </button>
    </div>
  );
}


