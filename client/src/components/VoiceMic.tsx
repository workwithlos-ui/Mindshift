// ============================================================
// VoiceMic — tap-to-dictate mic button with live interim text.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isVoiceSupported, startDictation, type VoiceHandle } from '@/lib/voice';

interface Props {
  onFinalText: (text: string) => void;    // append this to the field
  onInterimText?: (text: string) => void; // optional live preview
  color?: string;                         // accent
  size?: number;                          // px
  disabled?: boolean;
}

export function VoiceMic({
  onFinalText, onInterimText,
  color = 'var(--amethyst)',
  size = 40,
  disabled,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const handle = useRef<VoiceHandle | null>(null);

  useEffect(() => () => { handle.current?.abort(); }, []);

  const supported = isVoiceSupported();

  const toggle = () => {
    if (!supported || disabled) return;
    if (recording) {
      handle.current?.stop();
      setRecording(false);
      return;
    }
    setErr(null);
    const h = startDictation({
      onInterim: (t) => onInterimText?.(t),
      onFinal: (t) => onFinalText(t.trim() + ' '),
      onEnd: () => setRecording(false),
      onError: (e) => {
        setRecording(false);
        if (e === 'not-allowed' || e === 'service-not-allowed') {
          setErr('Allow microphone access in Settings');
        } else if (e === 'no-speech') {
          setErr(null);
        } else if (e !== 'aborted') {
          setErr('Voice unavailable');
        }
      },
    });
    if (h) {
      handle.current = h;
      setRecording(true);
      if ('vibrate' in navigator) navigator.vibrate?.(8);
    } else {
      setErr('Voice not supported on this browser');
    }
  };

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={disabled}
        aria-label={recording ? 'Stop recording' : 'Start voice input'}
        className="rounded-full flex items-center justify-center transition-all duration-300 relative flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: recording
            ? `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`
            : 'rgba(255,255,255,0.05)',
          border: recording ? 'none' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: recording ? `0 0 20px ${color}66` : 'none',
        }}
      >
        {recording && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${color}` }}
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 16 16" fill="none">
          <rect
            x="5.5" y="1.5" width="5" height="9" rx="2.5"
            stroke={recording ? '#0A0A0F' : 'rgba(245,244,248,0.7)'}
            strokeWidth="1.4"
            fill={recording ? '#0A0A0F' : 'none'}
          />
          <path
            d="M3 7v1a5 5 0 0010 0V7M8 13v2"
            stroke={recording ? '#0A0A0F' : 'rgba(245,244,248,0.7)'}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <AnimatePresence>
        {err && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute right-0 top-full mt-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap z-20"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'rgba(255,130,130,0.12)',
              border: '1px solid rgba(255,130,130,0.25)',
              color: '#FFB4B4',
            }}
          >
            {err}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
