// ============================================================
// MINDSHIFT AI — ONBOARDING
// Rendered as a NORMAL PAGE inside the content area.
// The bottom nav (z-50) always sits on top.
// paddingBottom: 120px ensures the CTA is never hidden behind the nav.
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveUserProfile, logBehavior, type FocusArea } from '@/lib/storage';

interface Props {
  onComplete: () => void;
}

const FOCUS_OPTIONS: { value: FocusArea; label: string; desc: string; color: string }[] = [
  { value: 'mind',     label: 'Mind',     desc: 'Identity, clarity, mindset',   color: '#B794F4' },
  { value: 'body',     label: 'Body',     desc: 'Health, energy, recovery',     color: '#9AE6B4' },
  { value: 'business', label: 'Business', desc: 'Execution, revenue, leverage', color: '#FBB6A4' },
  { value: 'all',      label: 'All four', desc: 'Integrated operating system',  color: '#81E6D9' },
];

const ROLES = ['Founder', 'Creator', 'Operator', 'Executive', 'Athlete', 'Investor'];
const TOTAL = 5;

function persist(name: string, role: string, focus: FocusArea | '', goals: string, cb: () => void) {
  saveUserProfile({
    name: name.trim(),
    role: role.trim(),
    focus: (focus || 'all') as FocusArea,
    goals: goals.trim(),
    onboardedAt: Date.now(),
  });
  logBehavior('onboard:complete', { focus: focus || 'all' });
  cb();
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [focus, setFocus] = useState<FocusArea | ''>('');
  const [goals, setGoals] = useState('');

  const ok =
    step === 0 ||
    (step === 1 && name.trim() !== '') ||
    (step === 2 && role.trim() !== '') ||
    (step === 3 && focus !== '') ||
    step === 4;

  function next() {
    if (!ok) return;
    if (step === TOTAL - 1) persist(name, role, focus, goals, onComplete);
    else setStep(s => s + 1);
  }

  function skip() {
    persist('', '', 'all', '', onComplete);
  }

  const pct = Math.round(((step + 1) / TOTAL) * 100);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse 1100px 600px at 15% 0%, rgba(183,148,244,0.10) 0%, transparent 55%),' +
          'radial-gradient(ellipse 800px 500px at 85% 100%, rgba(129,230,217,0.07) 0%, transparent 55%),' +
          '#0A0A0F',
        display: 'flex',
        flexDirection: 'column',
        // 120px clears the 72px nav + safe area on all iPhones
        paddingBottom: 120,
      }}
    >
      {/* ── Progress bar ──────────────────────────────────── */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative', flexShrink: 0 }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            background: 'linear-gradient(90deg, #B794F4, #81E6D9)',
            boxShadow: '0 0 10px rgba(183,148,244,0.5)',
          }}
        />
      </div>

      {/* ── Skip link ─────────────────────────────────────── */}
      {step > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 20px 0', flexShrink: 0 }}>
          <button
            onClick={skip}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(245,244,248,0.32)',
              fontSize: 13, cursor: 'pointer',
              fontFamily: 'Inter Tight, system-ui, sans-serif',
              padding: '4px 8px',
            }}
          >
            Skip
          </button>
        </div>
      )}

      {/* ── Step content ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: step === 0 ? '48px 24px 24px' : '24px 24px 24px',
          maxWidth: 520,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 22,
                  background: 'linear-gradient(135deg, #B794F4 0%, #81E6D9 100%)',
                  boxShadow: '0 16px 48px rgba(183,148,244,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 500, color: '#0A0A0F' }}>M</span>
                </div>
              </div>
              <h1 style={{
                fontFamily: 'Fraunces, serif',
                fontSize: 'clamp(1.9rem, 6vw, 2.8rem)',
                fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.08,
                color: '#F5F4F8', marginBottom: 16,
              }}>
                Welcome to MindShift.
              </h1>
              <p style={{ color: 'rgba(245,244,248,0.58)', fontSize: 16, lineHeight: 1.65, maxWidth: 340, margin: '0 auto' }}>
                Your personal operating system for mind, body, and business. Two minutes to set it up.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%' }}
            >
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.35)', marginBottom: 14 }}>STEP 01 / 04</p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 400, color: '#F5F4F8', marginBottom: 22, lineHeight: 1.2 }}>What should we call you?</h2>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
                placeholder="Your name"
                style={{
                  display: 'block', width: '100%', boxSizing: 'border-box',
                  background: 'rgba(18,18,26,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: '15px 17px',
                  fontSize: 17, color: '#F5F4F8',
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                  outline: 'none',
                }}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%' }}
            >
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.35)', marginBottom: 14 }}>STEP 02 / 04</p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 400, color: '#F5F4F8', marginBottom: 22, lineHeight: 1.2 }}>What do you do?</h2>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && role.trim() && next()}
                placeholder="Founder, Creator, Operator…"
                style={{
                  display: 'block', width: '100%', boxSizing: 'border-box',
                  background: 'rgba(18,18,26,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: '15px 17px',
                  fontSize: 17, color: '#F5F4F8', marginBottom: 14,
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r} onClick={() => setRole(r)} style={{
                    background: role === r ? 'rgba(183,148,244,0.14)' : 'rgba(18,18,26,0.6)',
                    border: `1px solid ${role === r ? 'rgba(183,148,244,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 999, padding: '7px 13px',
                    fontSize: 13, color: role === r ? '#F5F4F8' : 'rgba(245,244,248,0.58)',
                    fontFamily: 'Inter Tight, system-ui, sans-serif', cursor: 'pointer',
                  }}>{r}</button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%' }}
            >
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.35)', marginBottom: 14 }}>STEP 03 / 04</p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 400, color: '#F5F4F8', marginBottom: 22, lineHeight: 1.2 }}>Where do you want to focus?</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {FOCUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setFocus(opt.value)} style={{
                    background: focus === opt.value ? 'rgba(18,18,26,0.95)' : 'rgba(18,18,26,0.5)',
                    border: `1px solid ${focus === opt.value ? opt.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, padding: '15px 16px', textAlign: 'left', cursor: 'pointer',
                    boxShadow: focus === opt.value ? `0 0 22px ${opt.color}28` : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: opt.color, boxShadow: `0 0 8px ${opt.color}`, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: '#F5F4F8' }}>{opt.label}</span>
                    </div>
                    <p style={{ color: 'rgba(245,244,248,0.52)', fontSize: 13, marginTop: 5, marginLeft: 20, fontFamily: 'Inter Tight, system-ui, sans-serif' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="s4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%' }}
            >
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.35)', marginBottom: 14 }}>STEP 04 / 04 · OPTIONAL</p>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 400, color: '#F5F4F8', marginBottom: 10, lineHeight: 1.2 }}>What are you building toward?</h2>
              <p style={{ color: 'rgba(245,244,248,0.48)', fontSize: 14, marginBottom: 18, lineHeight: 1.55, fontFamily: 'Inter Tight, system-ui, sans-serif' }}>
                One sentence. The AI will use this to personalize your briefings.
              </p>
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="Scaling an online community to 10k members, building a personal brand…"
                rows={4}
                style={{
                  display: 'block', width: '100%', boxSizing: 'border-box',
                  background: 'rgba(18,18,26,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: '15px 17px',
                  fontSize: 15, color: '#F5F4F8',
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                  lineHeight: 1.55, resize: 'none', outline: 'none',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CTA — always visible above the nav bar ──────────── */}
      <div
        style={{
          padding: '0 24px',
          maxWidth: 520,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <button
          onClick={next}
          disabled={!ok}
          style={{
            display: 'block', width: '100%',
            background: ok
              ? 'linear-gradient(135deg, #B794F4 0%, #81E6D9 100%)'
              : 'rgba(255,255,255,0.05)',
            color: ok ? '#0A0A0F' : 'rgba(245,244,248,0.18)',
            border: 'none', borderRadius: 16,
            padding: '17px 20px',
            fontSize: 15, fontWeight: 600,
            fontFamily: 'Inter Tight, system-ui, sans-serif',
            letterSpacing: '0.025em',
            boxShadow: ok ? '0 8px 28px rgba(183,148,244,0.32)' : 'none',
            cursor: ok ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
        >
          {step === 0 ? 'Begin →' : step === TOTAL - 1 ? 'Enter MindShift →' : 'Continue →'}
        </button>

        {step > 0 && step < TOTAL - 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            display: 'block', width: '100%', marginTop: 10,
            background: 'none', border: 'none',
            color: 'rgba(245,244,248,0.35)', fontSize: 13,
            padding: '8px 0', cursor: 'pointer',
            fontFamily: 'Inter Tight, system-ui, sans-serif',
          }}>← Back</button>
        )}

        {step === 4 && (
          <button onClick={skip} style={{
            display: 'block', width: '100%', marginTop: 10,
            background: 'none', border: 'none',
            color: 'rgba(245,244,248,0.35)', fontSize: 13,
            padding: '8px 0', cursor: 'pointer',
            fontFamily: 'Inter Tight, system-ui, sans-serif',
          }}>Skip for now</button>
        )}
      </div>
    </div>
  );
}
