// ============================================================
// MINDSHIFT AI — SHAREABLE DAILY SCORECARD
// The "screenshot moment." Branded card, exportable as PNG.
// ============================================================
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { getTodayProgress, getTodaySessions, getUserProfile, logBehavior } from '@/lib/storage';
import { computeStreak } from '@/lib/streaks';
import { coreIdentityAffirmations, wealthExecutionAffirmations, reachInfluenceAffirmations } from '@/lib/content';

interface Props {
  open: boolean;
  onClose: () => void;
}

function pickAffirmation(): string {
  const pool = [
    ...coreIdentityAffirmations,
    ...wealthExecutionAffirmations,
    ...reachInfluenceAffirmations,
  ].filter(Boolean) as string[];
  if (pool.length === 0) return 'Momentum compounds quickly.';
  const idx = new Date().getDate() % pool.length;
  return pool[idx];
}

export function Scorecard({ open, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!open) return null;

  const profile = getUserProfile();
  const progress = getTodayProgress();
  const sessions = getTodaySessions();
  const streak = computeStreak();
  const affirm = pickAffirmation();

  const totalMinutes = sessions.reduce((s, x) => s + (x.duration ?? 0), 0);
  const totalActions = progress.meaningfulActions + progress.contentProduced + progress.outreachActions;
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  async function downloadPng() {
    if (!cardRef.current) return;
    try {
      setBusy('download');
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0A0A0F',
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.download = `mindshift-${new Date().toISOString().split('T')[0]}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      logBehavior('scorecard:share', { mode: 'download' });
      setToast('Saved');
      setTimeout(() => setToast(null), 1800);
    } catch {
      setToast('Export failed');
      setTimeout(() => setToast(null), 1800);
    } finally {
      setBusy(null);
    }
  }

  async function nativeShare() {
    if (!cardRef.current) return;
    try {
      setBusy('share');
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0A0A0F',
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'mindshift-scorecard.png', { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({
          title: 'MindShift AI',
          text: `Day ${streak.current} of the streak. ${affirm}`,
          files: [file],
        });
        logBehavior('scorecard:share', { mode: 'native' });
      } else {
        await downloadPng();
      }
    } catch {
      // user cancelled — ignore
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: 'rgba(5,5,8,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      onClick={onClose}
    >
      <div className="min-h-screen flex flex-col items-center px-5 py-10" style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center justify-between w-full max-w-md mb-6">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.45)' }}>
            · DAILY SCORECARD
          </div>
          <button
            onClick={onClose}
            className="transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(20,20,28,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(245,244,248,0.65)',
              borderRadius: 999,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </button>
        </div>

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md"
        >
          {/* The exportable card */}
          <div
            ref={cardRef}
            style={{
              position: 'relative',
              aspectRatio: '4/5',
              borderRadius: 28,
              overflow: 'hidden',
              padding: 32,
              background:
                'radial-gradient(700px 500px at 15% 0%, rgba(183,148,244,0.22) 0%, transparent 55%),' +
                'radial-gradient(700px 500px at 100% 100%, rgba(129,230,217,0.14) 0%, transparent 55%),' +
                'linear-gradient(180deg, #10101A 0%, #070709 100%)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              color: '#F5F4F8',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top: brand + date */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, #B794F4 0%, #81E6D9 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(183,148,244,0.3)',
                  }}
                >
                  <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 500, color: '#0A0A0F' }}>M</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, letterSpacing: '0.18em', color: 'rgba(245,244,248,0.55)' }}>
                  MINDSHIFT AI
                </div>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.4)', textAlign: 'right' }}>
                {dateStr.toUpperCase()}
              </div>
            </div>

            {/* Middle: streak as the hero */}
            <div className="text-center" style={{ margin: '0 auto' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(245,244,248,0.5)', marginBottom: 8 }}>
                STREAK
              </div>
              <div
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 'clamp(82px, 20vw, 112px)',
                  fontWeight: 300,
                  lineHeight: 1,
                  background: 'linear-gradient(180deg, #F5F4F8 0%, #B794F4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.03em',
                }}
              >
                {streak.current}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(245,244,248,0.45)', marginTop: 4 }}>
                {streak.current === 1 ? 'DAY' : 'DAYS'}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'FOCUS', value: totalMinutes, unit: 'min', accent: '#FBB6A4' },
                { label: 'ACTIONS', value: totalActions, unit: '', accent: '#B794F4' },
                { label: 'CONTENT', value: progress.contentProduced, unit: '', accent: '#81E6D9' },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: 'rgba(20,20,28,0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, letterSpacing: '0.18em', color: s.accent, marginBottom: 6 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 400, color: '#F5F4F8', lineHeight: 1 }}>
                    {s.value}
                    {s.unit && <span style={{ fontSize: 11, color: 'rgba(245,244,248,0.4)', marginLeft: 3, fontFamily: 'JetBrains Mono, monospace' }}>{s.unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Affirmation */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 400, fontStyle: 'italic', color: '#F5F4F8', lineHeight: 1.4, marginBottom: 10 }}>
                "{affirm}"
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(245,244,248,0.4)' }}>
                {profile?.name ? `— ${profile.name.toUpperCase()}` : '— THE ARCHITECT'}{profile?.handle ? ` · @${profile.handle.toUpperCase()}` : ' · @LOSHUSTLE'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={nativeShare}
              disabled={busy !== null}
              className="transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #B794F4 0%, #81E6D9 100%)',
                color: '#0A0A0F',
                border: 'none',
                borderRadius: 14,
                padding: '14px 16px',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.02em',
                boxShadow: '0 10px 30px rgba(183,148,244,0.25)',
                opacity: busy === 'share' ? 0.6 : 1,
              }}
            >
              {busy === 'share' ? 'Preparing…' : 'Share'}
            </button>
            <button
              onClick={downloadPng}
              disabled={busy !== null}
              className="transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(20,20,28,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(245,244,248,0.85)',
                borderRadius: 14,
                padding: '14px 16px',
                fontSize: 14,
                fontWeight: 500,
                opacity: busy === 'download' ? 0.6 : 1,
              }}
            >
              {busy === 'download' ? 'Saving…' : 'Save image'}
            </button>
          </div>
        </motion.div>

        {toast && (
          <div
            className="mt-6"
            style={{
              background: 'rgba(20,20,28,0.9)',
              border: '1px solid rgba(129,230,217,0.3)',
              borderRadius: 999,
              padding: '10px 18px',
              color: '#81E6D9',
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.15em',
            }}
          >
            {toast.toUpperCase()}
          </div>
        )}
      </div>
    </motion.div>
  );
}
