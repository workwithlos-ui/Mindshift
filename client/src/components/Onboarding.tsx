// ============================================================
// MINDSHIFT AI — ONBOARDING FLOW
// Full-screen multi-step wizard. Keeps the Oura-grade aesthetic.
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveUserProfile, logBehavior, type FocusArea } from '@/lib/storage';

interface Props {
  onComplete: () => void;
}

const FOCUS_OPTIONS: { value: FocusArea; label: string; desc: string; accent: string }[] = [
  { value: 'mind',     label: 'Mind',     desc: 'Identity, clarity, mindset',     accent: 'var(--ms-amethyst, #B794F4)' },
  { value: 'body',     label: 'Body',     desc: 'Health, energy, recovery',       accent: 'var(--ms-mint, #9AE6B4)' },
  { value: 'business', label: 'Business', desc: 'Execution, revenue, leverage',   accent: 'var(--ms-peach, #FBB6A4)' },
  { value: 'all',      label: 'All four', desc: 'Integrated operating system',    accent: 'var(--ms-teal, #81E6D9)' },
];

const ROLE_PRESETS = ['Founder', 'Creator', 'Operator', 'Executive', 'Athlete', 'Investor'];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [focus, setFocus] = useState<FocusArea | ''>('');
  const [goals, setGoals] = useState('');

  const canAdvance =
    (step === 0) ||
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && role.trim().length > 0) ||
    (step === 3 && focus !== '') ||
    (step === 4); // goals optional

  function finish() {
    saveUserProfile({
      name: name.trim(),
      role: role.trim(),
      focus: (focus || 'all') as FocusArea,
      goals: goals.trim(),
      onboardedAt: Date.now(),
    });
    logBehavior('onboard:complete', { focus: focus || 'all' });
    onComplete();
  }

  const steps = 5;
  const progress = (step + 1) / steps;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          'radial-gradient(1200px 700px at 20% 0%, rgba(183,148,244,0.08) 0%, transparent 60%),' +
          'radial-gradient(900px 600px at 80% 100%, rgba(129,230,217,0.05) 0%, transparent 60%),' +
          '#0A0A0F',
      }}
    >
      {/* progress bar */}
      <div className="absolute top-0 left-0 right-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #B794F4, #81E6D9)',
              boxShadow: '0 0 12px rgba(183,148,244,0.45)',
            }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="mb-8 flex justify-center">
                <div
                  style={{
                    width: 68, height: 68, borderRadius: 20,
                    background: 'linear-gradient(135deg, #B794F4 0%, #81E6D9 100%)',
                    boxShadow: '0 20px 60px rgba(183,148,244,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 500, color: '#0A0A0F' }}>M</span>
                </div>
              </div>
              <h1
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(2.2rem, 6vw, 3rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  color: '#F5F4F8',
                  marginBottom: 16,
                }}
              >
                Welcome to MindShift.
              </h1>
              <p style={{ color: 'rgba(245,244,248,0.6)', fontSize: 16, lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
                Your personal operating system for mind, body, and business. Two minutes to set it up.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.4)', marginBottom: 12 }}>
                STEP 01 / 04
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 400, color: '#F5F4F8', marginBottom: 28 }}>
                What should we call you?
              </h2>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full outline-none transition-all"
                style={{
                  background: 'rgba(20,20,28,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  fontSize: 17,
                  color: '#F5F4F8',
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                }}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.4)', marginBottom: 12 }}>
                STEP 02 / 04
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 400, color: '#F5F4F8', marginBottom: 28 }}>
                What do you do?
              </h2>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="Founder, Creator, Operator…"
                className="w-full outline-none"
                style={{
                  background: 'rgba(20,20,28,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  fontSize: 17,
                  color: '#F5F4F8',
                  marginBottom: 16,
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                }}
              />
              <div className="flex flex-wrap gap-2">
                {ROLE_PRESETS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      background: role === r ? 'rgba(183,148,244,0.15)' : 'rgba(20,20,28,0.5)',
                      border: `1px solid ${role === r ? 'rgba(183,148,244,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 999,
                      padding: '8px 14px',
                      fontSize: 13,
                      color: role === r ? '#F5F4F8' : 'rgba(245,244,248,0.6)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.4)', marginBottom: 12 }}>
                STEP 03 / 04
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 400, color: '#F5F4F8', marginBottom: 28 }}>
                Where do you want to focus?
              </h2>
              <div className="grid gap-3">
                {FOCUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFocus(opt.value)}
                    className="text-left transition-all hover:translate-x-[2px]"
                    style={{
                      background: focus === opt.value ? 'rgba(20,20,28,0.9)' : 'rgba(20,20,28,0.5)',
                      border: `1px solid ${focus === opt.value ? opt.accent : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 16,
                      padding: 18,
                      boxShadow: focus === opt.value ? `0 0 28px ${opt.accent}22` : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: opt.accent, boxShadow: `0 0 12px ${opt.accent}` }} />
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: '#F5F4F8' }}>{opt.label}</div>
                    </div>
                    <div style={{ color: 'rgba(245,244,248,0.55)', fontSize: 13, marginTop: 6, marginLeft: 22 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.4)', marginBottom: 12 }}>
                STEP 04 / 04 · OPTIONAL
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 400, color: '#F5F4F8', marginBottom: 14 }}>
                What are you building toward?
              </h2>
              <p style={{ color: 'rgba(245,244,248,0.5)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
                One sentence. The AI will use this to personalize your briefings.
              </p>
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="Scaling an online community to 10k members, building a personal brand, getting into the best shape of my life…"
                className="w-full outline-none resize-none"
                style={{
                  background: 'rgba(20,20,28,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  fontSize: 16,
                  color: '#F5F4F8',
                  minHeight: 120,
                  fontFamily: 'Inter Tight, system-ui, sans-serif',
                  lineHeight: 1.5,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8" style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <button
            onClick={() => (step === steps - 1 ? finish() : setStep(s => s + 1))}
            disabled={!canAdvance}
            className="w-full transition-all active:scale-[0.98]"
            style={{
              background: canAdvance ? 'linear-gradient(135deg, #B794F4 0%, #81E6D9 100%)' : 'rgba(255,255,255,0.04)',
              color: canAdvance ? '#0A0A0F' : 'rgba(245,244,248,0.25)',
              border: 'none',
              borderRadius: 16,
              padding: '16px 20px',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: canAdvance ? '0 10px 30px rgba(183,148,244,0.25)' : 'none',
              cursor: canAdvance ? 'pointer' : 'not-allowed',
            }}
          >
            {step === 0 ? 'Begin' : step === steps - 1 ? 'Enter MindShift' : 'Continue'}
          </button>
          {step > 0 && step < steps - 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="w-full mt-3 transition-opacity hover:opacity-80"
              style={{
                background: 'transparent',
                color: 'rgba(245,244,248,0.4)',
                border: 'none',
                fontSize: 13,
                padding: 8,
              }}
            >
              Back
            </button>
          )}
          {step === 4 && (
            <button
              onClick={finish}
              className="w-full mt-3 transition-opacity hover:opacity-80"
              style={{
                background: 'transparent',
                color: 'rgba(245,244,248,0.4)',
                border: 'none',
                fontSize: 13,
                padding: 8,
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
