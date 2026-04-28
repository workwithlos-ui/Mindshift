// ============================================================
// WeeklyReportView — auto-generated Sunday summary
// ============================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getOrComputeLatestReport, enrichLatestReportWithAi, weekStartIso,
} from '@/lib/reports';
import { type WeeklyReport } from '@/lib/storage';
import { Card, Hairline, SectionLabel, EASE } from './ui-shared';
import { expansionAffirmations, expansionDirectives } from '@/lib/content';
import { computeStreak } from '@/lib/streaks';

export function WeeklyReportView() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setReport(getOrComputeLatestReport());
  }, []);

  const enrich = async () => {
    setEnriching(true);
    const r = await enrichLatestReportWithAi();
    if (r) setReport({ ...r });
    setEnriching(false);
  };

  if (!report) return null;

  const weekLabel = (() => {
    const d = new Date(report.weekStart);
    const end = new Date(d); end.setDate(d.getDate() + 6);
    const fmt = (x: Date) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d)} – ${fmt(end)}`;
  })();

  const isCurrentWeek = report.weekStart === weekStartIso();
  const trendColor = report.trend === 'up' ? 'var(--mint)'
    : report.trend === 'down' ? 'var(--coral)' : 'var(--ice)';
  const trendIcon = report.trend === 'up' ? '↑' : report.trend === 'down' ? '↓' : '—';

  const streak = computeStreak();
  const expansion = streak.expansionUnlocked;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <SectionLabel accent="var(--citrine)">
        WEEKLY REPORT · {weekLabel.toUpperCase()}
      </SectionLabel>

      {/* Hero card with trend */}
      <Card variant="elevated" className="!p-5 mb-3">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="font-mono-stamp text-white/35">TREND</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: '2.4rem',
                  letterSpacing: '-0.03em',
                  color: trendColor,
                  lineHeight: 1,
                }}
              >
                {trendIcon}
              </span>
              <span
                className="text-white/80 text-sm"
                style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}
              >
                vs last week
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono-stamp text-white/35">STREAK</span>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 400,
                color: '#F5F4F8',
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {report.longestStreak}<span className="text-white/40 text-sm ml-1">days</span>
            </p>
          </div>
        </div>

        <Hairline />

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
          <Metric label="Revenue days" value={`${report.revenueDays}/7`} color="var(--mint)" />
          <Metric label="Actions" value={String(report.meaningfulActions)} color="var(--amethyst)" />
          <Metric label="Content" value={String(report.contentProduced)} color="var(--peach)" />
          <Metric label="Outreach" value={String(report.outreachActions)} color="var(--teal)" />
          <Metric label="Journal entries" value={String(report.journalEntries)} color="var(--ice)" />
          <Metric label="Fitness logs" value={String(report.fitnessEntries)} color="var(--coral)" />
        </div>
      </Card>

      {/* Prose summary */}
      <Card variant="elevated" className="!p-5 mb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono-stamp text-white/35">SUMMARY</span>
          <button
            onClick={enrich}
            disabled={enriching}
            className="font-mono-stamp px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
            style={{
              background: 'rgba(184,164,255,0.1)',
              border: '1px solid rgba(184,164,255,0.25)',
              color: 'var(--amethyst)',
            }}
          >
            {enriching ? 'THINKING…' : 'AI REWRITE'}
          </button>
        </div>
        <p
          className="text-white/80 leading-relaxed"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '1.05rem',
            lineHeight: 1.65,
            letterSpacing: '-0.005em',
          }}
        >
          {report.summary}
        </p>
      </Card>

      {/* Expansion Mode content */}
      {expansion && (
        <>
          <SectionLabel accent="var(--mint)">EXPANSION MODE</SectionLabel>
          <Card variant="mint" className="!p-5 mb-3">
            <p
              className="text-white/80 mb-4"
              style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', lineHeight: 1.6 }}
            >
              7-day streak unlocked. Scale what works.
            </p>
            <div className="space-y-2.5">
              {expansionDirectives.slice(0, 3).map((d, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: 'var(--mint)', boxShadow: '0 0 6px var(--mint)' }}
                  />
                  <p
                    className="text-white/70 text-sm"
                    style={{ fontFamily: 'var(--font-ui)', lineHeight: 1.55 }}
                  >
                    {d}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <Card variant="elevated" className="!p-5">
            <span className="font-mono-stamp text-white/35 mb-3 block">AFFIRMATION</span>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 300,
                lineHeight: 1.5,
                color: 'rgba(245,244,248,0.92)',
                letterSpacing: '-0.01em',
              }}
            >
              {expansionAffirmations[new Date().getDate() % expansionAffirmations.length]}
            </p>
          </Card>
        </>
      )}

      {isCurrentWeek && (
        <p className="text-white/30 text-xs mt-4 text-center" style={{ fontFamily: 'var(--font-ui)' }}>
          Next report generates Sunday.
        </p>
      )}
    </motion.div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1 h-3.5 rounded-full flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span
          className="text-sm truncate"
          style={{ fontFamily: 'var(--font-ui)', color: 'rgba(245,244,248,0.65)' }}
        >
          {label}
        </span>
      </div>
      <span
        className="tabular-nums"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 400,
          color: '#F5F4F8',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
