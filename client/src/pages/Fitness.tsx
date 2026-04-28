// ============================================================
// FITNESS SCREEN — Oracle Edition
// Teal/mint Oura aesthetic. Glowing breath orb. Premium logs.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { healthRecoveryAffirmations } from '@/lib/content';
import {
  AffirmationCard,
  PageHeader,
  Hairline,
  Card,
  SectionLabel,
  MetricTile,
  EASE,
} from '@/components/ui-shared';
import { saveFitnessLog, getFitnessLogs, type FitnessLog } from '@/lib/storage';

type BreathPhase = 'idle' | 'inhale' | 'exhale';
const ACTIVITIES = ['Gym', 'Run', 'Walk', 'Yoga', 'HIIT', 'Swim', 'Cycling', 'Other'];

export default function Fitness() {
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(0);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const [energy, setEnergy] = useState(0);
  const [logSaved, setLogSaved] = useState(false);

  useEffect(() => {
    setLogs(getFitnessLogs().slice(0, 7));
  }, []);

  const runBreathCycle = (phase: BreathPhase, count: number) => {
    let t = 4;
    breathIntervalRef.current = setInterval(() => {
      t -= 1;
      setBreathTimer(t);
      if (t <= 0) {
        clearInterval(breathIntervalRef.current!);
        if (phase === 'inhale') {
          setBreathPhase('exhale');
          setBreathTimer(4);
          runBreathCycle('exhale', count);
        } else {
          const newCount = count + 1;
          setBreathCount(newCount);
          if (newCount >= 5) {
            setBreathPhase('idle');
          } else {
            setBreathPhase('inhale');
            setBreathTimer(4);
            runBreathCycle('inhale', newCount);
          }
        }
      }
    }, 1000);
  };

  const startBreathing = () => {
    setBreathPhase('inhale');
    setBreathTimer(4);
    setBreathCount(0);
    runBreathCycle('inhale', 0);
  };

  const stopBreathing = () => {
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    setBreathPhase('idle');
    setBreathCount(0);
    setBreathTimer(0);
  };

  useEffect(() => () => {
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
  }, []);

  const handleSaveLog = () => {
    if (!activity && !weight && !sleep && !energy) return;
    const log = saveFitnessLog({
      date: new Date().toISOString().split('T')[0],
      activity: activity || 'General',
      duration: duration ? parseInt(duration) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      sleep: sleep ? parseFloat(sleep) : undefined,
      energy: energy || undefined,
    });
    setLogs(prev => [log, ...prev].slice(0, 7));
    setActivity(''); setDuration(''); setWeight(''); setSleep(''); setEnergy(0);
    setLogSaved(true);
    if ('vibrate' in navigator) navigator.vibrate?.(12);
    setTimeout(() => setLogSaved(false), 2500);
  };

  const todayLog = logs.find(l => l.date === new Date().toISOString().split('T')[0]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen safe-top"
    >
      <div className="container pt-8 pb-32">
        <PageHeader
          stamp="FITNESS · RECOVERY"
          title="Recover."
          subtitle="Body supports mind. Mind supports execution."
          accent="var(--teal)"
        />

        <SectionLabel accent="var(--teal)">HEALTH & RECOVERY</SectionLabel>
        <div className="mb-8">
          <AffirmationCard affirmations={healthRecoveryAffirmations} accent="var(--teal)" variant="teal" />
        </div>

        {/* Today's snapshot */}
        {todayLog && (
          <>
            <Hairline className="mb-8" />
            <SectionLabel accent="var(--mint)">TODAY'S SNAPSHOT</SectionLabel>
            <div className="grid grid-cols-3 gap-2.5 mb-8">
              {todayLog.weight ? (
                <MetricTile label="WEIGHT" value={todayLog.weight} unit="lbs" accentColor="var(--peach)" />
              ) : <EmptyMetricTile label="WEIGHT" />}
              {todayLog.sleep ? (
                <MetricTile label="SLEEP" value={todayLog.sleep} unit="h" accent={todayLog.sleep >= 7} accentColor="var(--teal)" />
              ) : <EmptyMetricTile label="SLEEP" />}
              {todayLog.energy ? (
                <MetricTile label="ENERGY" value={`${todayLog.energy}/5`} accent={todayLog.energy >= 4} accentColor="var(--mint)" />
              ) : <EmptyMetricTile label="ENERGY" />}
            </div>
          </>
        )}

        <Hairline className="mb-8" />

        {/* Breathing Orb */}
        <SectionLabel accent="var(--teal)">BREATHE · 4-4 CYCLE</SectionLabel>
        <Card variant="teal" className="!p-8 flex flex-col items-center relative overflow-hidden">
          {/* Ambient pulse */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: breathPhase !== 'idle'
                ? 'radial-gradient(circle at 50% 50%, rgba(122,224,211,0.15), transparent 60%)'
                : 'radial-gradient(circle at 50% 50%, rgba(122,224,211,0.04), transparent 60%)',
              transition: 'background 1s ease',
            }}
          />

          <div className="relative mb-6" style={{ width: 180, height: 180 }}>
            {/* Outer halo rings */}
            {breathPhase !== 'idle' && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1px solid rgba(122,224,211,0.2)',
                  }}
                  animate={{
                    scale: breathPhase === 'inhale' ? [1, 1.3] : [1.3, 1],
                    opacity: breathPhase === 'inhale' ? [0.3, 0.8] : [0.8, 0.3],
                  }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1px solid rgba(122,224,211,0.12)',
                  }}
                  animate={{
                    scale: breathPhase === 'inhale' ? [1.1, 1.5] : [1.5, 1.1],
                    opacity: breathPhase === 'inhale' ? [0.2, 0.5] : [0.5, 0.2],
                  }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                />
              </>
            )}

            {/* Core orb */}
            <motion.div
              className="absolute inset-0 m-auto rounded-full flex items-center justify-center"
              style={{
                width: 120, height: 120,
                background: 'radial-gradient(circle, rgba(122,224,211,0.35) 0%, rgba(122,224,211,0.08) 55%, transparent 80%)',
                border: '1px solid rgba(122,224,211,0.3)',
                boxShadow: breathPhase !== 'idle'
                  ? '0 0 40px rgba(122,224,211,0.35), inset 0 0 20px rgba(122,224,211,0.15)'
                  : '0 0 16px rgba(122,224,211,0.12)',
              }}
              animate={{
                scale: breathPhase === 'inhale' ? 1.35 : breathPhase === 'exhale' ? 1.0 : 1.0,
              }}
              transition={{ duration: 4, ease: 'easeInOut' }}
            >
              <div className="text-center">
                {breathPhase === 'idle' ? (
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 400,
                      color: 'rgba(245,244,248,0.8)',
                      fontSize: '1rem',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Breathe
                  </span>
                ) : (
                  <>
                    <span
                      className="block leading-none"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 300,
                        fontSize: '2.5rem',
                        color: '#F5F4F8',
                      }}
                    >
                      {breathTimer}
                    </span>
                    <span
                      className="block mt-1 font-mono-stamp"
                      style={{ color: 'var(--teal)' }}
                    >
                      {breathPhase.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {breathPhase !== 'idle' && (
            <div className="flex items-center gap-1.5 mb-5">
              <div className="flex gap-1">
                {[0,1,2,3,4].map(n => (
                  <div
                    key={n}
                    className="h-1 w-5 rounded-full transition-all duration-500"
                    style={{
                      background: n < breathCount ? 'var(--teal)' : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <span className="font-mono-stamp text-white/40 ml-2">
                {breathCount + 1}/5
              </span>
            </div>
          )}

          {breathPhase === 'idle' ? (
            <button onClick={startBreathing} className="btn-primary" style={{
              background: 'linear-gradient(180deg, #8CEBDC 0%, #4DC5B5 100%)',
              boxShadow: '0 4px 16px rgba(122,224,211,0.25)',
            }}>
              Start Breathing
            </button>
          ) : (
            <button onClick={stopBreathing} className="btn-ghost">Stop</button>
          )}
        </Card>

        <Hairline className="my-8" />

        {/* Log Today */}
        <SectionLabel accent="var(--mint)">LOG TODAY</SectionLabel>
        <Card variant="elevated">
          {/* Activity pills */}
          <p className="font-mono-stamp text-white/45 mb-3">ACTIVITY</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {ACTIVITIES.map(a => {
              const active = activity === a;
              return (
                <button
                  key={a}
                  onClick={() => setActivity(active ? '' : a)}
                  className="px-3 py-1.5 rounded-full transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    fontWeight: active ? 600 : 500,
                    background: active
                      ? 'linear-gradient(180deg, #BBEFB1 0%, #86D27A 100%)'
                      : 'rgba(255,255,255,0.04)',
                    color: active ? '#0A0A0F' : 'rgba(245,244,248,0.5)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: active ? '0 4px 12px rgba(168,232,154,0.2)' : 'none',
                  }}
                >
                  {a}
                </button>
              );
            })}
          </div>

          <Hairline className="mb-5" />

          <div className="grid grid-cols-3 gap-3 mb-5">
            <LabelInput label="DURATION" unit="min" value={duration} onChange={setDuration} placeholder="45" />
            <LabelInput label="WEIGHT" unit="lbs" value={weight} onChange={setWeight} placeholder="185" />
            <LabelInput label="SLEEP" unit="hrs" value={sleep} onChange={setSleep} placeholder="7.5" step="0.5" />
          </div>

          <div className="mb-5">
            <p className="font-mono-stamp text-white/45 mb-2.5">ENERGY LEVEL</p>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(n => {
                const active = n <= energy;
                return (
                  <button
                    key={n}
                    onClick={() => setEnergy(n === energy ? 0 : n)}
                    className="flex-1 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{
                      background: active
                        ? `linear-gradient(180deg, rgba(168,232,154,${0.15 + n * 0.08}) 0%, rgba(168,232,154,${0.05 + n * 0.04}) 100%)`
                        : 'rgba(255,255,255,0.03)',
                      border: active ? '1px solid rgba(168,232,154,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: active && n >= 4 ? '0 0 16px rgba(168,232,154,0.15)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: active ? 'var(--mint)' : 'rgba(245,244,248,0.3)',
                      }}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            {logSaved ? (
              <span className="flex items-center gap-1.5 font-mono-stamp" style={{ color: 'var(--mint)' }}>
                <span className="pulse-dot" style={{ background: 'var(--mint)' }} />
                LOGGED
              </span>
            ) : <span />}
            <button onClick={handleSaveLog} className="btn-primary">
              Save Entry
            </button>
          </div>
        </Card>

        {/* Recent logs */}
        {logs.length > 0 && (
          <>
            <Hairline className="my-8" />
            <SectionLabel accent="var(--ice)">RECENT ENTRIES</SectionLabel>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: EASE }}
                  className="card-solid flex items-center justify-between p-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(122,224,211,0.1)',
                        border: '1px solid rgba(122,224,211,0.2)',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5V9M11 5V9M3 7H11M1 6V8M13 6V8" stroke="var(--teal)" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate" style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                        {log.activity}
                      </p>
                      <p className="font-mono-stamp text-white/40 mt-0.5">
                        {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {log.duration ? ` · ${log.duration}M` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-shrink-0 text-right">
                    {log.weight && <span className="font-mono-stamp text-white/60">{log.weight}LBS</span>}
                    {log.sleep && <span className="font-mono-stamp" style={{ color: 'var(--teal)' }}>{log.sleep}H</span>}
                    {log.energy && <span className="font-mono-stamp" style={{ color: 'var(--mint)' }}>E{log.energy}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────────
function EmptyMetricTile({ label }: { label: string }) {
  return (
    <div
      className="card-solid flex flex-col justify-between"
      style={{ padding: '0.95rem 0.9rem', minHeight: 80, opacity: 0.5 }}
    >
      <span className="font-mono-stamp text-white/30">{label}</span>
      <span
        className="metric-md mt-2"
        style={{ color: 'rgba(245,244,248,0.2)' }}
      >
        —
      </span>
    </div>
  );
}

function LabelInput({
  label, unit, value, onChange, placeholder, step,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void; placeholder: string; step?: string;
}) {
  return (
    <div>
      <p className="font-mono-stamp text-white/45 mb-2">{label}</p>
      <div className="flex items-baseline gap-1 border-b pb-1.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          className="w-full bg-transparent outline-none placeholder:text-white/20"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.1rem',
            color: '#F5F4F8',
            letterSpacing: '-0.02em',
          }}
        />
        <span className="text-xs text-white/35" style={{ fontFamily: 'var(--font-mono)' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
