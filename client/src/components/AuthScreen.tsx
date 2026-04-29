import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { signIn, signUp, supabaseEnabled, resetPasswordForEmail } from '@/lib/supabase';

interface AuthScreenProps {
  onAuthed: () => void;
  onSkip: () => void;
}

type Mode = 'signin' | 'signup' | 'forgot';

export function AuthScreen({ onAuthed, onSkip }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async () => {
    if (mode === 'forgot') {
      if (!email) { setError('Enter your email address.'); return; }
      setBusy(true);
      setError(null);
      setInfo(null);
      try {
        const result = await resetPasswordForEmail(email);
        if (!result.ok) { setError(result.error ?? 'Something went wrong.'); return; }
        setInfo('Reset link sent — check your inbox.');
        setEmail('');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!email || !password) { setError('Email and password required.'); return; }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const result =
        mode === 'signin'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password, name.trim() || undefined);

      if (!result.ok) { setError(result.error ?? 'Something went wrong.'); return; }
      if ('needsConfirm' in result && result.needsConfirm) {
        setInfo('Check your email to confirm your account, then sign in.');
        switchMode('signin');
        return;
      }
      onAuthed();
    } finally {
      setBusy(false);
    }
  };

  if (!supabaseEnabled) {
    onSkip();
    return null;
  }

  const titles: Record<Mode, string> = {
    signin: 'Welcome back.',
    signup: 'Create your account.',
    forgot: 'Reset your password.',
  };
  const subtitles: Record<Mode, string> = {
    signin: 'Sign in to sync across devices.',
    signup: 'Your data, secured and synced.',
    forgot: 'Enter your email and we\'ll send a reset link.',
  };
  const ctaLabels: Record<Mode, string> = {
    signin: 'Sign in',
    signup: 'Create account',
    forgot: 'Send reset link',
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col px-6 py-10"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
    >
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Logo */}
            <div className="text-center mb-10">
              <div
                className="inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-amethyst) 0%, var(--accent-teal) 100%)',
                  boxShadow: '0 20px 60px -20px rgba(167,139,250,0.45)',
                }}
              >
                <span className="font-serif text-3xl text-black">M</span>
              </div>
              <h1 className="font-serif text-[32px] leading-tight tracking-tight">
                {titles[mode]}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed">
                {subtitles[mode]}
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {mode === 'signup' && (
                <Field
                  icon={<Mail className="h-4 w-4 opacity-60" />}
                  label="Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Your name (optional)"
                />
              )}
              <Field
                icon={<Mail className="h-4 w-4 opacity-60" />}
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                onEnter={mode === 'forgot' ? submit : undefined}
              />
              {mode !== 'forgot' && (
                <Field
                  icon={<KeyRound className="h-4 w-4 opacity-60" />}
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  onEnter={submit}
                />
              )}
            </div>

            {/* Forgot password link — only on sign-in */}
            {mode === 'signin' && (
              <div className="mt-2 text-right">
                <button
                  onClick={() => switchMode('forgot')}
                  className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--accent-amethyst)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Feedback */}
            {error && (
              <div className="mt-4 text-[13px] text-[var(--accent-coral)] leading-relaxed">{error}</div>
            )}
            {info && (
              <div className="mt-4 text-[13px] text-[var(--accent-mint)] leading-relaxed">{info}</div>
            )}

            {/* Primary CTA */}
            <button
              onClick={submit}
              disabled={busy}
              className="w-full mt-6 h-14 rounded-2xl flex items-center justify-center gap-2 font-medium text-black transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--accent-amethyst) 0%, var(--accent-teal) 100%)',
                boxShadow: '0 12px 40px -12px rgba(167,139,250,0.55)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {ctaLabels[mode]}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Secondary actions */}
            {mode === 'forgot' ? (
              <button
                onClick={() => switchMode('signin')}
                className="w-full mt-4 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </button>
            ) : (
              <button
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="w-full mt-4 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {mode === 'signin'
                  ? 'No account? Create one →'
                  : 'Already have an account? Sign in →'}
              </button>
            )}

            {/* Continue offline */}
            <div className="mt-10 pt-6 border-t border-[var(--hairline)] text-center">
              <button
                onClick={onSkip}
                className="text-[12px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Continue without an account
              </button>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-2 leading-relaxed">
                Your data stays on this device only.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({
  icon, label, type, value, onChange, placeholder, autoComplete, onEnter,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] block mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2 h-12 rounded-xl px-4 bg-[var(--surface-1)] border border-[var(--hairline)] focus-within:border-[var(--accent-amethyst)] transition-colors">
        {icon}
        <input
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-[var(--text-tertiary)]"
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        />
      </div>
    </label>
  );
}
