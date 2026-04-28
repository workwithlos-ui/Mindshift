// ============================================================
// PROGRESS SCREEN — Oracle Edition
// Heatmap + streak badge + weekly review. Mixed pastel palette.
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
  SectionLabel,
  Card,
  ProgressRing,
  TogglePills,
  EASE,
} from '@/components/ui-shared';
import { WeeklyReportView } from '@/components/WeeklyReportView';
import { computeStreak, maybeNudge } from '@/lib/streaks';
import { expansionAffirmations, expansionDirectives } from '@/lib/content';

type ProgressView = 'daily' | 'weekly' | 'report';

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
  const [weekReview, setWeekReview] = useState<WeeklyReview>({
    weekStart: getWeekStart(),
    produced: '', wasted: '', remove: '', repeat: '', scale: '',
  });
  const [reviewSaved, setReviewSaved] = useState(false);

  useEffect(() => {
    const h = getProgressHistory();
    setHistory(h);
    const existing = getWeeklyReviews().find(r => r.weekStart === getWeekStart());
    if (existing) setWeekReview(existing);
    // Fire streak nudge on mount (at most once per day)
    const state = computeStreak();
    maybeNudge(state);
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
    setReviewSaved(true);
    if ('vibrate' in navigator) navigator.vibrate?.(12);
    setTimeout(() => setReviewSaved(false), 2500);
  };

  // Build 14-day heatmap data (for richer visual)
  const heatDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().split('T')[0];
    const p = history.find(h => h.date === date);
    const score = p
      ? (p.revenueMoved ? 1 : 0) + Math.min(p.meaningfulActions / 3, 1) + Math.min(p.contentProduced, 1)
      : 0;
    return { date, score, day: d.getDay() };
  });

  // Weekly stats (last 7 days)
  const last7 = heatDays.slice(7);
  const weekRevenue = last7.filter(d => {
    const p = history.find(h => h.date === d.date);
    return p?.revenueMoved;
  }).length;
  const weekActions = last7.reduce((a, d) => {
    const p = history.find(h => h.date === d.date);
    return a + (p?.meaningfulActions ?? 0);
  }, 0);
  const weekContent = last7.reduce((a, d) => {
    const p = history.find(h => h.date === d.date);
    return a + (p?.contentProduced ?? 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen safe-top"
    >
      <div className="container pt-8 pb-32">
        <PageHeader
          stamp="PROGRESS · TRACKING"
          title="Progress."
          subtitle="What you track compounds. What you don't, disappears."
          accent="var(--mint)"
          right={
            <TogglePills
              value={view}
              onChange={setView}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'report', label: 'Report' },
              ]}
            />
          }
        />

        {/* Streak hero card */}
        <Card
          variant={expansionMode ? 'mint' : 'elevated'}
          className="!p-5 mb-6 relative overflow-hidden"
        >
          <div className="flex items-center justify-between relative">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300,
                    fontSize: '3rem',
                    letterSpacing: '-0.04em',
                    color: expansionMode ? 'var(--mint)' : '#F5F4F8',
                    lineHeight: 1,
                    textShadow: expansionMode ? '0 0 24px rgba(168,232,154,0.35)' : 'none',
                  }}
                >
                  {streak}
                </span>
                <span
                  className="text-white/50 text-sm"
                  style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}
                >
                  day{streak !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-white/50 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
                {expansionMode
                  ? 'Expansion Mode active — scale what works'
                  : `${7 - streak} day${7 - streak !== 1 ? 's' : ''} to Expansion Mode`}
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: expansionMode
                  ? 'rgba(168,232,154,0.15)'
                  : 'rgba(255,255,255,0.04)',
                border: expansionMode
                  ? '1px solid rgba(168,232,154,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                className="pulse-dot"
                style={{
                  background: expansionMode ? 'var(--mint)' : 'rgba(255,255,255,0.4)',
                }}
              />
              <span
                className="font-mono-stamp"
                style={{
                  color: expansionMode ? 'var(--mint)' : 'rgba(255,255,255,0.55)',
                  fontWeight: 600,
                }}
              >
                {expansionMode ? 'EXPANSION' : 'STREAK'}
              </span>
            </div>
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {view === 'report' ? (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <WeeklyReportView />
            </motion.div>
          ) : view === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* Revenue moved toggle */}
              <button
                onClick={() => updateProgress({ revenueMoved: !progress.revenueMoved })}
                className="w-full flex items-center justify-between p-4 rounded-2xl mb-3 transition-all duration-300 hover:scale-[1.005]"
                style={{
                  background: progress.revenueMoved
                    ? 'linear-gradient(135deg, rgba(168,232,154,0.14) 0%, rgba(111,200,94,0.05) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${progress.revenueMoved ? 'rgba(168,232,154,0.28)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: progress.revenueMoved ? '0 8px 32px -12px rgba(168,232,154,0.2)' : 'none',
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
                    Revenue moved forward
                  </span>
                </div>
              </button>

              {/* Counters */}
              <Card variant="elevated" className="mb-3">
                <CounterRow
                  label="Meaningful actions"
                  value={progress.meaningfulActions}
                  onChange={v => updateProgress({ meaningfulActions: v })}
                  accentColor="var(--amethyst)"
                  target={3}
                />
                <Hairline className="my-3.5" />
                <CounterRow
                  label="Content produced"
                  value={progress.contentProduced}
                  onChange={v => updateProgress({ contentProduced: v })}
                  accentColor="var(--peach)"
                  target={1}
                />
                <Hairline className="my-3.5" />
                <CounterRow
                  label="Outreach actions"
                  value={progress.outreachActions}
                  onChange={v => updateProgress({ outreachActions: v })}
                  accentColor="var(--teal)"
                  target={3}
                />
              </Card>

              {/* 14-day heatmap */}
              <Hairline className="my-8" />
              <SectionLabel accent="var(--mint)">14-DAY ACTIVITY</SectionLabel>
              <Card variant="elevated">
                <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                  {heatDays.map((d, i) => {
                    const intensity = d.score / 3;
                    const isToday = i === 13;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02, duration: 0.3, ease: EASE }}
                          className="w-full rounded-md transition-all"
                          style={{
                            aspectRatio: '1 / 1.5',
                            background: intensity > 0
                              ? `linear-gradient(180deg, rgba(168,232,154,${0.15 + intensity * 0.55}) 0%, rgba(168,232,154,${0.08 + intensity * 0.3}) 100%)`
                              : 'rgba(255,255,255,0.03)',
                            border: intensity > 0
                              ? `1px solid rgba(168,232,154,${0.2 + intensity * 0.3})`
                              : '1px solid rgba(255,255,255,0.05)',
                            boxShadow: intensity > 0.6 ? `0 0 12px rgba(168,232,154,${intensity * 0.25})` : 'none',
                            outline: isToday ? '1px solid rgba(184,164,255,0.5)' : 'none',
                            outlineOffset: isToday ? 2 : 0,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between mt-4">
                  <span className="font-mono-stamp text-white/35">
                    {new Date(heatDays[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-stamp text-white/35">LESS</span>
                    {[0.15, 0.4, 0.65, 0.9].map((op, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{
                          background: `rgba(168,232,154,${op})`,
                          border: `1px solid rgba(168,232,154,${op * 0.5})`,
                        }}
                      />
                    ))}
                    <span className="font-mono-stamp text-white/35">MORE</span>
                  </div>
                  <span className="font-mono-stamp text-white/35">TODAY</span>
                </div>
              </Card>

              {/* Weekly summary tiles */}
              <Hairline className="my-8" />
              <SectionLabel accent="var(--ice)">THIS WEEK</SectionLabel>
              <div className="grid grid-cols-3 gap-2.5">
                <WeekStat label="REVENUE" value={weekRevenue} max={7} color="var(--mint)" />
                <WeekStat label="ACTIONS" value={weekActions} max={21} color="var(--amethyst)" />
                <WeekStat label="CONTENT" value={weekContent} max={7} color="var(--peach)" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <SectionLabel accent="var(--citrine)">WEEKLY REVIEW</SectionLabel>
              <Card variant="elevated">
                {[
                  { key: 'produced', label: 'What produced results?', color: 'var(--mint)' },
                  { key: 'wasted', label: 'What wasted time?', color: 'var(--coral)' },
                  { key: 'remove', label: 'What to remove?', color: 'var(--peach)' },
                  { key: 'repeat', label: 'What to repeat?', color: 'var(--teal)' },
                  { key: 'scale', label: 'What to scale?', color: 'var(--amethyst)' },
                ].map(({ key, label, color }, i) => (
                  <div key={key}>
                    {i > 0 && <Hairline className="my-4" />}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                      <p
                        className="text-white/60 text-sm"
                        style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}
                      >
                        {label}
                      </p>
                    </div>
                    <textarea
                      value={weekReview[key as keyof WeeklyReview]}
                      onChange={e => setWeekReview(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder="..."
                      rows={2}
                      className="w-full bg-transparent text-white outline-none resize-none placeholder:text-white/15"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 300,
                        fontSize: '1rem',
                        lineHeight: 1.6,
                      }}
                    />
                  </div>
                ))}
                <Hairline className="my-4" />
                <div className="flex items-center justify-between">
                  {reviewSaved ? (
                    <span className="flex items-center gap-1.5 font-mono-stamp" style={{ color: 'var(--mint)' }}>
                      <span className="pulse-dot" style={{ background: 'var(--mint)' }} />
                      SAVED
                    </span>
                  ) : <span />}
                  <button onClick={saveReview} className="btn-primary">
                    Save Review
                  </button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function CounterRow({
  label, value, onChange, accentColor, target,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
  target: number;
}) {
  const hit = value >= target;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-1 h-4 rounded-full flex-shrink-0 transition-all duration-300"
          style={{
            background: hit ? accentColor : 'rgba(255,255,255,0.12)',
            boxShadow: hit ? `0 0 10px ${accentColor}` : 'none',
          }}
        />
        <span
          className="text-sm"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            color: hit ? 'rgba(245,244,248,0.9)' : 'rgba(245,244,248,0.65)',
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/45 hover:text-white/80 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          −
        </button>
        <span
          className="tabular-nums text-center leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.4rem',
            color: hit ? accentColor : '#F5F4F8',
            minWidth: 24,
            transition: 'color 0.3s ease',
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/45 hover:text-white/80 transition-colors"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function WeekStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="card-solid flex flex-col items-center gap-2 py-4">
      <ProgressRing value={value} max={max} size={52} color={color} />
      <span
        className="font-mono-stamp"
        style={{ color: 'rgba(245,244,248,0.55)', letterSpacing: '0.1em' }}
      >
        {label}
      </span>
    </div>
  );
}
