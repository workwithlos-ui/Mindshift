// ============================================================
// FITNESS SCREEN — Health & Recovery Protocol
// Body metrics, workout log, breathing exercise (4-4)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { healthRecoveryAffirmations } from '@/lib/content';
import {
  AffirmationCard,
  PageHeader,
  Hairline,
  SectionCard,
  MetricTile,
} from '@/components/ui-shared';
import { saveFitnessLog, getFitnessLogs, type FitnessLog } from '@/lib/storage';

type BreathPhase = 'idle' | 'inhale' | 'exhale';

const ACTIVITIES = ['Gym', 'Run', 'Walk', 'Yoga', 'HIIT', 'Swim', 'Cycling', 'Other'];

export default function Fitness() {
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle');
  const [breathCount, setBreathCount] = useState(0);
  const [breathTimer, setBreathTimer] = useState(0);
  const breathRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Log form
  const [activity, setActivity] = useState('');
  const [duration, setDuration] = useState('');
  const [weight, setWeight] = useState('');
  const [sleep, setSleep] = useState('');
  const [energy, setEnergy] = useState(0);
  const [logSaved, setLogSaved] = useState(false);

  useEffect(() => {
    setLogs(getFitnessLogs().slice(0, 7));
  }, []);

  // Breathing exercise
  const startBreathing = () => {
    setBreathPhase('inhale');
    setBreathTimer(4);
    setBreathCount(0);
    runBreathCycle('inhale', 0);
  };

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

  const stopBreathing = () => {
    clearInterval(breathIntervalRef.current!);
    clearTimeout(breathRef.current!);
    setBreathPhase('idle');
    setBreathCount(0);
    setBreathTimer(0);
  };

  useEffect(() => () => {
    clearInterval(breathIntervalRef.current!);
    clearTimeout(breathRef.current!);
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
    setActivity('');
    setDuration('');
    setWeight('');
    setSleep('');
    setEnergy(0);
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2500);
  };

  const todayLog = logs.find(l => l.date === new Date().toISOString().split('T')[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen"
    >
      <div className="container pt-14 pb-32">
        <PageHeader title="Fitness." stamp="FITNESS · RECOVERY" />

        {/* Health & Recovery Protocol */}
        <div className="mb-3">
          <span className="font-mono-stamp text-white/30">Health & Recovery Protocol</span>
        </div>
        <AffirmationCard affirmations={healthRecoveryAffirmations} />

        <Hairline className="my-7" />

        {/* Today's metrics quick view */}
        {todayLog && (
          <>
            <div className="mb-3">
              <span className="font-mono-stamp text-white/30">Today's Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-7">
              {todayLog.weight && <MetricTile label="WEIGHT" value={todayLog.weight} unit="lbs" />}
              {todayLog.sleep && <MetricTile label="SLEEP" value={todayLog.sleep} unit="hrs" accent={todayLog.sleep >= 7} />}
              {todayLog.energy && <MetricTile label="ENERGY" value={`${todayLog.energy}/5`} accent={todayLog.energy >= 4} />}
            </div>
            <Hairline className="mb-7" />
          </>
        )}

        {/* Breathing Exercise */}
        <div className="mb-3">
          <span className="font-mono-stamp text-white/30">Breathing Exercise · 4-4</span>
        </div>
        <SectionCard className="flex flex-col items-center py-8">
          <div className="relative mb-6">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: breathPhase !== 'idle'
                  ? 'radial-gradient(circle, rgba(123,197,152,0.08) 0%, transparent 70%)'
                  : 'transparent',
                transition: 'background 1s ease',
              }}
            />
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              animate={{
                scale: breathPhase === 'inhale' ? 1.4 : breathPhase === 'exhale' ? 1.0 : 1.0,
                opacity: breathPhase !== 'idle' ? 0.85 : 0.4,
              }}
              transition={{ duration: 4, ease: 'linear' }}
              style={{
                background: 'radial-gradient(circle, rgba(123,197,152,0.2) 0%, rgba(123,197,152,0.05) 60%, transparent 100%)',
                border: '1px solid rgba(123,197,152,0.25)',
              }}
            >
              <div className="text-center">
                {breathPhase === 'idle' ? (
                  <span className="text-white/40 text-sm" style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}>
                    Breathe
                  </span>
                ) : (
                  <>
                    <span
                      className="block text-2xl leading-none text-[#F5F4F1]"
                      style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}
                    >
                      {breathTimer}
                    </span>
                    <span
                      className="block text-[9px] mt-1 tracking-[0.1em] uppercase"
                      style={{ fontFamily: 'var(--font-mono)', color: '#7BC598' }}
                    >
                      {breathPhase}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {breathPhase !== 'idle' && (
            <p className="text-white/30 text-xs mb-5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
              CYCLE {breathCount + 1} / 5
            </p>
          )}

          {breathPhase === 'idle' ? (
            <button onClick={startBreathing} className="btn-bone">
              Start Breathing
            </button>
          ) : (
            <button
              onClick={stopBreathing}
              className="px-4 py-2 rounded-full text-xs text-white/40 hover:text-white/60 transition-colors"
              style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
            >
              Stop
            </button>
          )}
        </SectionCard>

        <Hairline className="my-7" />

        {/* Log Activity */}
        <div className="mb-4">
          <span className="font-mono-stamp text-white/30">Log Today</span>
        </div>

        <SectionCard>
          {/* Activity selector */}
          <div className="mb-4">
            <p className="text-white/40 text-xs mb-2.5" style={{ fontFamily: 'var(--font-ui)' }}>Activity</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map(a => (
                <button
                  key={a}
                  onClick={() => setActivity(activity === a ? '' : a)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    background: activity === a ? '#E8E0D0' : 'rgba(255,255,255,0.05)',
                    color: activity === a ? '#0A0A0B' : 'rgba(255,255,255,0.45)',
                    border: activity === a ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <Hairline className="mb-4" />

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-white/35 text-xs mb-1.5" style={{ fontFamily: 'var(--font-ui)' }}>Duration (min)</p>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="45"
                className="w-full bg-transparent text-[#F5F4F1] text-sm outline-none border-b pb-1"
                style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-display)', fontWeight: 400 }}
              />
            </div>
            <div>
              <p className="text-white/35 text-xs mb-1.5" style={{ fontFamily: 'var(--font-ui)' }}>Weight (lbs)</p>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="185"
                className="w-full bg-transparent text-[#F5F4F1] text-sm outline-none border-b pb-1"
                style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-display)', fontWeight: 400 }}
              />
            </div>
            <div>
              <p className="text-white/35 text-xs mb-1.5" style={{ fontFamily: 'var(--font-ui)' }}>Sleep (hrs)</p>
              <input
                type="number"
                value={sleep}
                onChange={e => setSleep(e.target.value)}
                placeholder="7.5"
                step="0.5"
                className="w-full bg-transparent text-[#F5F4F1] text-sm outline-none border-b pb-1"
                style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-display)', fontWeight: 400 }}
              />
            </div>
          </div>

          {/* Energy level */}
          <div className="mb-5">
            <p className="text-white/35 text-xs mb-2.5" style={{ fontFamily: 'var(--font-ui)' }}>Energy Level</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setEnergy(energy === n ? 0 : n)}
                  className="flex-1 h-8 rounded-lg transition-all duration-200"
                  style={{
                    background: n <= energy
                      ? `rgba(123,197,152,${0.15 + n * 0.1})`
                      : 'rgba(255,255,255,0.05)',
                    border: n <= energy ? '1px solid rgba(123,197,152,0.2)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span
                    className="text-xs"
                    style={{ color: n <= energy ? '#7BC598' : 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}
                  >
                    {n}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            {logSaved ? (
              <span className="text-sage text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                LOGGED ✓
              </span>
            ) : <span />}
            <button
              onClick={handleSaveLog}
              className="btn-bone"
            >
              Log Entry
            </button>
          </div>
        </SectionCard>

        {/* Recent logs */}
        {logs.length > 0 && (
          <>
            <Hairline className="my-7" />
            <div className="mb-3">
              <span className="font-mono-stamp text-white/30">Recent Logs</span>
            </div>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <p className="text-[#F5F4F1] text-sm" style={{ fontFamily: 'var(--font-ui)' }}>{log.activity}</p>
                    <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                      {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {log.duration ? ` · ${log.duration}min` : ''}
                    </p>
                  </div>
                  <div className="flex gap-3 text-right">
                    {log.weight && <span className="text-white/40 text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{log.weight}lbs</span>}
                    {log.sleep && <span className="text-white/40 text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{log.sleep}h sleep</span>}
                    {log.energy && (
                      <span className="text-sage text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                        E{log.energy}/5
                      </span>
                    )}
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
