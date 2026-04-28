// ============================================================
// PROGRESS SCREEN — Daily tracking + Weekly review
// Revenue moved, actions, content, outreach
// Expansion Mode unlocks after consistent tracking
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTodayProgress,
  saveTodayProgress,
  getProgressHistory,
  getWeeklyReviews,
  saveWeeklyReview,
  type DailyProgress,
  type WeeklyReview,
} from '@/lib/storage';
import {
  PageHeader,
  Hairline,
  SectionCard,
  ProgressRing,
} from '@/components/ui-shared';

type ProgressView = 'daily' | 'weekly';

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split('T')[0];
}

function getStreakDays(history: DailyProgress[]): number {
  if (!history.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = history.find(p => p.date === dateStr);
    if (found && (found.meaningfulActions > 0 || found.revenueMoved)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export default function Progress() {
  const [view, setView] = useState<ProgressView>('daily');
  const [progress, setProgress] = useState(getTodayProgress());
  const [history, setHistory] = useState<DailyProgress[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [weekReview, setWeekReview] = useState<WeeklyReview>({
    weekStart: getWeekStart(),
    produced: '',
    wasted: '',
    remove: '',
    repeat: '',
    scale: '',
  });
  const [reviewSaved, setReviewSaved] = useState(false);

  useEffect(() => {
    const h = getProgressHistory();
    setHistory(h);
    setWeeklyReviews(getWeeklyReviews());
    const existing = getWeeklyReviews().find(r => r.weekStart === getWeekStart());
    if (existing) setWeekReview(existing);
  }, []);

  const streak = getStreakDays(history);
  const expansionMode = streak >= 7;

  const updateProgress = (updates: Partial<DailyProgress>) => {
    const p = { ...progress, ...updates };
    saveTodayProgress(p);
    setProgress(p);
  };

  const saveReview = () => {
    saveWeeklyReview(weekReview);
    setWeeklyReviews(getWeeklyReviews());
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 2500);
  };

  // Calculate weekly stats
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weekData = weekDays.map(date => history.find(p => p.date === date) ?? {
    date, revenueMoved: false, meaningfulActions: 0, contentProduced: 0, outreachActions: 0, priority: '',
  });

  const weekRevenue = weekData.filter(d => d.revenueMoved).length;
  const weekActions = weekData.reduce((a, d) => a + d.meaningfulActions, 0);
  const weekContent = weekData.reduce((a, d) => a + d.contentProduced, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen"
    >
      <div className="container pt-14 pb-32">
        <div className="flex items-start justify-between mb-6">
          <PageHeader title="Progress." stamp="PROGRESS · TRACKING" />
          <div
            className="flex mt-1 rounded-full p-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['daily', 'weekly'] as ProgressView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 rounded-full text-xs transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.7rem',
                  background: view === v ? '#E8E0D0' : 'transparent',
                  color: view === v ? '#0A0A0B' : 'rgba(255,255,255,0.4)',
                }}
              >
                {v === 'daily' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>
        </div>

        {/* Streak + Expansion Mode */}
        <div
          className="flex items-center justify-between p-4 rounded-2xl mb-6"
          style={{
            background: expansionMode
              ? 'linear-gradient(135deg, rgba(123,197,152,0.1) 0%, rgba(123,197,152,0.05) 100%)'
              : 'rgba(255,255,255,0.03)',
            border: expansionMode ? '1px solid rgba(123,197,152,0.2)' : '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div>
            <p
              className="text-[#F5F4F1] text-lg leading-none"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
            >
              {streak} day{streak !== 1 ? 's' : ''}
            </p>
            <p className="text-white/35 text-xs mt-1" style={{ fontFamily: 'var(--font-ui)' }}>
              {expansionMode ? 'Expansion Mode active' : `${7 - streak} days to Expansion Mode`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {expansionMode && <div className="sage-dot" />}
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.1em',
                color: expansionMode ? '#7BC598' : 'rgba(255,255,255,0.25)',
              }}
            >
              {expansionMode ? 'EXPANSION' : 'STREAK'}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Revenue moved */}
              <button
                onClick={() => updateProgress({ revenueMoved: !progress.revenueMoved })}
                className="w-full flex items-center justify-between p-4 rounded-2xl mb-3 transition-all duration-200"
                style={{
                  background: progress.revenueMoved ? 'rgba(123,197,152,0.1)' : 'rgba(255,255,255,0.04)',
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
                  <span className="text-sm" style={{ fontFamily: 'var(--font-ui)', color: progress.revenueMoved ? '#7BC598' : 'rgba(255,255,255,0.6)' }}>
                    Revenue moved forward
                  </span>
                </div>
              </button>

              {/* Counters */}
              <SectionCard className="mb-3">
                <CounterRow
                  label="Meaningful Actions"
                  value={progress.meaningfulActions}
                  onChange={v => updateProgress({ meaningfulActions: v })}
                  accent={progress.meaningfulActions >= 3}
                  accentColor="#E8E0D0"
                />
                <Hairline className="my-3" />
                <CounterRow
                  label="Content Produced"
                  value={progress.contentProduced}
                  onChange={v => updateProgress({ contentProduced: v })}
                  accent={progress.contentProduced >= 1}
                  accentColor="#7BC598"
                />
                <Hairline className="my-3" />
                <CounterRow
                  label="Outreach Actions"
                  value={progress.outreachActions}
                  onChange={v => updateProgress({ outreachActions: v })}
                  accent={progress.outreachActions >= 3}
                  accentColor="#E8E0D0"
                />
              </SectionCard>

              {/* Week heatmap */}
              <Hairline className="my-6" />
              <div className="mb-3">
                <span className="font-mono-stamp text-white/30">7-Day Activity</span>
              </div>
              <div className="flex gap-1.5">
                {weekData.map((d, i) => {
                  const score = (d.revenueMoved ? 1 : 0) + Math.min(d.meaningfulActions / 3, 1) + Math.min(d.contentProduced, 1);
                  const intensity = score / 3;
                  const dayName = ['M','T','W','T','F','S','S'][new Date(d.date + 'T12:00:00').getDay() === 0 ? 6 : new Date(d.date + 'T12:00:00').getDay() - 1];
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-lg transition-all duration-500"
                        style={{
                          height: 40,
                          background: intensity > 0
                            ? `rgba(123,197,152,${0.1 + intensity * 0.5})`
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${intensity > 0 ? 'rgba(123,197,152,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      />
                      <span className="font-mono-stamp text-white/25">{dayName}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Weekly stats */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="glass-card p-3 flex flex-col items-center gap-1">
                  <ProgressRing value={weekRevenue} max={7} size={48} color="#7BC598" />
                  <span className="font-mono-stamp text-white/30 text-center">REVENUE DAYS</span>
                </div>
                <div className="glass-card p-3 flex flex-col items-center gap-1">
                  <ProgressRing value={weekActions} max={21} size={48} color="#E8E0D0" />
                  <span className="font-mono-stamp text-white/30 text-center">ACTIONS</span>
                </div>
                <div className="glass-card p-3 flex flex-col items-center gap-1">
                  <ProgressRing value={weekContent} max={7} size={48} color="#E8E0D0" />
                  <span className="font-mono-stamp text-white/30 text-center">CONTENT</span>
                </div>
              </div>

              {/* Weekly review form */}
              <div className="mb-3">
                <span className="font-mono-stamp text-white/30">Weekly Review</span>
              </div>
              <SectionCard>
                {[
                  { key: 'produced', label: 'What produced results?' },
                  { key: 'wasted', label: 'What wasted time?' },
                  { key: 'remove', label: 'What to remove?' },
                  { key: 'repeat', label: 'What to repeat?' },
                  { key: 'scale', label: 'What to scale?' },
                ].map(({ key, label }, i) => (
                  <div key={key}>
                    {i > 0 && <Hairline className="my-4" />}
                    <p className="text-white/40 text-xs mb-2" style={{ fontFamily: 'var(--font-ui)' }}>{label}</p>
                    <textarea
                      value={weekReview[key as keyof WeeklyReview]}
                      onChange={e => setWeekReview(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="..."
                      rows={2}
                      className="w-full bg-transparent text-[#F5F4F1] text-sm outline-none resize-none placeholder:text-white/15"
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 300, lineHeight: 1.6 }}
                    />
                  </div>
                ))}
                <Hairline className="mt-4 mb-4" />
                <div className="flex items-center justify-between">
                  {reviewSaved ? (
                    <span className="text-sage text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                      SAVED ✓
                    </span>
                  ) : <span />}
                  <button onClick={saveReview} className="btn-bone">
                    Save Review
                  </button>
                </div>
              </SectionCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Counter Row ───────────────────────────────────────────────
function CounterRow({
  label,
  value,
  onChange,
  accent,
  accentColor,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent: boolean;
  accentColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/60" style={{ fontFamily: 'var(--font-ui)' }}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          −
        </button>
        <span
          className="text-xl w-6 text-center leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            color: accent ? accentColor : '#F5F4F1',
            transition: 'color 0.3s ease',
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          +
        </button>
      </div>
    </div>
  );
}
