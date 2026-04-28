// ============================================================
// JOURNAL SCREEN — Oracle Edition
// Peach accent. Distraction-free writing canvas.
// ============================================================

import { useState, useEffect } from 'react';
import { VoiceMic } from '@/components/VoiceMic';
import { motion, AnimatePresence } from 'framer-motion';
import { reachInfluenceAffirmations } from '@/lib/content';
import {
  AffirmationCard,
  PageHeader,
  Hairline,
  SectionLabel,
  TogglePills,
  EASE,
} from '@/components/ui-shared';
import {
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from '@/lib/storage';

type JournalView = 'write' | 'entries';

export default function Journal() {
  const [view, setView] = useState<JournalView>('write');
  const [draft, setDraft] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  useEffect(() => {
    setEntries(getJournalEntries());
  }, []);

  const handleSave = () => {
    if (!draft.trim()) return;
    const entry = saveJournalEntry(draft.trim());
    setEntries(prev => [entry, ...prev]);
    setDraft('');
    setSaved(true);
    if ('vibrate' in navigator) navigator.vibrate?.(10);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id: string) => {
    deleteJournalEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="min-h-screen safe-top"
    >
      <div className="container pt-8 pb-32">
        <PageHeader
          stamp="JOURNAL · REFLECTION"
          title="Reflect."
          subtitle="Capture thoughts. Clarify ideas. Ship better."
          accent="var(--peach)"
          right={
            <TogglePills
              value={view}
              onChange={setView}
              options={[
                { value: 'write', label: 'Write' },
                { value: 'entries', label: `Log · ${entries.length}` },
              ]}
            />
          }
        />

        <AnimatePresence mode="wait">
          {view === 'write' ? (
            <motion.div
              key="write"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <SectionLabel accent="var(--peach)">REACH & INFLUENCE</SectionLabel>
              <div className="mb-8">
                <AffirmationCard affirmations={reachInfluenceAffirmations} accent="var(--peach)" variant="peach" />
              </div>

              <Hairline className="mb-8" />

              <SectionLabel
                accent="var(--citrine)"
                right={
                  <span className="font-mono-stamp text-white/40">
                    {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'}
                  </span>
                }
              >
                TODAY'S REFLECTION
              </SectionLabel>

              <div
                className="rounded-[1.5rem] p-6 relative mb-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,184,154,0.05) 0%, rgba(20,20,30,0.9) 100%)',
                  border: '1px solid rgba(255,184,154,0.15)',
                  minHeight: 320,
                  boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 60px -20px rgba(255,184,154,0.08)',
                }}
              >
                {/* Subtle paper texture via noise */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                />
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="What's on your mind today? Write freely…"
                  rows={12}
                  className="relative z-10 w-full bg-transparent outline-none resize-none placeholder:text-white/20"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300,
                    fontSize: '1.1rem',
                    lineHeight: 1.7,
                    letterSpacing: '0.005em',
                    color: 'rgba(245,244,248,0.95)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono-stamp text-white/35">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                </span>
                <div className="flex items-center gap-3">
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 font-mono-stamp"
                      style={{ color: 'var(--mint)' }}
                    >
                      <span className="pulse-dot" style={{ background: 'var(--mint)' }} />
                      SAVED
                    </motion.span>
                  )}
                  <VoiceMic
                    onFinalText={(t) => setDraft(prev => (prev + (prev.endsWith(' ') || !prev ? '' : ' ') + t).trimStart())}
                    color="#FFB49A"
                    size={38}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!draft.trim()}
                    className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                      background: draft.trim()
                        ? 'linear-gradient(180deg, #FFCBAE 0%, #FFA17A 100%)'
                        : undefined,
                      boxShadow: draft.trim() ? '0 4px 16px rgba(255,184,154,0.25)' : 'none',
                    }}
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="entries"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {entries.length === 0 ? (
                <div className="text-center py-20">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: 'rgba(255,184,154,0.08)',
                      border: '1px solid rgba(255,184,154,0.2)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 3H13V15H4V3Z" stroke="var(--peach)" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M7 7H11M7 10H11" stroke="var(--peach)" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p
                    className="text-white/50 mb-1.5"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.2rem' }}
                  >
                    No entries yet.
                  </p>
                  <p className="text-white/30 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                    Write your first reflection.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {entries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3, ease: EASE }}
                    >
                      {selectedEntry?.id === entry.id ? (
                        <div
                          className="card-elevated p-5"
                          style={{
                            borderColor: 'rgba(255,184,154,0.22)',
                            boxShadow: '0 20px 60px -20px rgba(255,184,154,0.1)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-mono-stamp" style={{ color: 'var(--peach)' }}>
                              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                            </span>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="font-mono-stamp hover:opacity-80 transition-opacity"
                                style={{ color: 'var(--coral)' }}
                              >
                                DELETE
                              </button>
                              <button
                                onClick={() => setSelectedEntry(null)}
                                className="font-mono-stamp text-white/35 hover:text-white/60 transition-colors"
                              >
                                CLOSE
                              </button>
                            </div>
                          </div>
                          <p
                            className="leading-relaxed whitespace-pre-wrap"
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 300,
                              fontSize: '1.05rem',
                              lineHeight: 1.7,
                              color: 'rgba(245,244,248,0.95)',
                            }}
                          >
                            {entry.content}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full text-left card-solid p-4 transition-all duration-300 hover:scale-[1.005] group"
                          style={{
                            borderColor: 'rgba(255,255,255,0.07)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono-stamp text-white/40">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                            </span>
                            <span className="font-mono-stamp text-white/30">
                              {entry.content.trim().split(/\s+/).length} WORDS
                            </span>
                          </div>
                          <p
                            className="text-white/70 text-sm leading-relaxed line-clamp-2"
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 300 }}
                          >
                            {entry.content}
                          </p>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
