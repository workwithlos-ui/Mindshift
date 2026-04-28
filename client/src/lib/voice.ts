// ============================================================
// MINDSHIFT AI — VOICE INPUT LAYER
// Web Speech API (webkitSpeechRecognition). iOS Safari 14.5+.
// ============================================================

// Minimal ambient types (the real ones are vendor-prefixed and not in lib.dom).
interface SR {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        resultIndex: number;
        results: {
          length: number;
          [i: number]: { 0: { transcript: string }; isFinal: boolean; length: number };
        };
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type SRCtor = new () => SR;

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

function getCtor(): SRCtor | null {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) ?? null;
}

export interface VoiceHandle {
  stop: () => void;
  abort: () => void;
}

export function startDictation(opts: {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
  lang?: string;
}): VoiceHandle | null {
  const Ctor = getCtor();
  if (!Ctor) { opts.onError?.('not-supported'); return null; }

  const rec = new Ctor();
  rec.lang = opts.lang ?? 'en-US';
  rec.continuous = true;
  rec.interimResults = true;

  rec.onresult = (e) => {
    let interim = '';
    let finalText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const transcript = r[0].transcript;
      if (r.isFinal) finalText += transcript;
      else interim += transcript;
    }
    if (interim) opts.onInterim(interim);
    if (finalText) opts.onFinal(finalText);
  };

  rec.onend = () => { opts.onEnd?.(); };
  rec.onerror = (e) => { opts.onError?.(e.error); };

  try { rec.start(); }
  catch (err) { opts.onError?.(String(err)); return null; }

  return {
    stop: () => { try { rec.stop(); } catch { /* ignore */ } },
    abort: () => { try { rec.abort(); } catch { /* ignore */ } },
  };
}
