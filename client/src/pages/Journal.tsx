// ============================================================
// JOURNAL SCREEN — Clean, distraction-free writing
// Reach & Influence Protocol surfaces before writing.
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reachInfluenceAffirmations, formatStamp } from '@/lib/content';
import {
  AffirmationCard,
  PageHeader,
  Hairline,
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
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDelete = (id: string) => {
    deleteJournalEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen"
    >
      <div className="container pt-14 pb-32">
        <div className="flex items-start justify-between mb-6">
          <PageHeader title="Journal." stamp="JOURNAL · REFLECTION" />
          {/* View toggle */}
          <div
            className="flex mt-1 rounded-full p-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['write', 'entries'] as JournalView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 rounded-full text-xs transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.02em',
                  background: view === v ? '#E8E0D0' : 'transparent',
                  color: view === v ? '#0A0A0B' : 'rgba(255,255,255,0.4)',
                }}
              >
                {v === 'write' ? 'Write' : `Entries (${entries.length})`}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'write' ? (
            <motion.div
              key="write"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Reach & Influence Protocol */}
              <div className="mb-3">
                <span className="font-mono-stamp text-white/30">Reach & Influence Protocol</span>
              </div>
              <AffirmationCard affirmations={reachInfluenceAffirmations} />

              <Hairline className="my-7" />

              {/* Writing area */}
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono-stamp text-white/30">Today's Reflection</span>
                <span className="font-mono-stamp text-white/20">{wordCount} words</span>
              </div>

              <div
                className="rounded-2xl p-5 relative"
                style={{
                  background: 'rgba(17,17,19,0.7)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/91190584/JbwyyshxtMaKpm7nvUYhjz/hero-journal-PSCsty5gkNgXCzgaLS2pso.webp)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'rgba(10,10,11,0.88)', backdropFilter: 'blur(2px)' }}
                />
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="What's on your mind today? Write freely..."
                  rows={10}
                  className="relative z-10 w-full bg-transparent text-[#F5F4F1] outline-none resize-none placeholder:text-white/20 leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300,
                    fontSize: '1.05rem',
                    lineHeight: 1.7,
                    letterSpacing: '0.005em',
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-white/25 text-xs" style={{ fontFamily: 'var(--font-ui)' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-3">
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sage text-xs"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}
                    >
                      SAVED ✓
                    </motion.span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!draft.trim()}
                    className="btn-bone disabled:opacity-30 disabled:cursor-not-allowed"
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {entries.length === 0 ? (
                <div className="text-center py-16">
                  <p
                    className="text-white/25 text-lg mb-2"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
                  >
                    No entries yet.
                  </p>
                  <p className="text-white/20 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>
                    Write your first reflection.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {selectedEntry?.id === entry.id ? (
                        <div
                          className="rounded-2xl p-5"
                          style={{ background: 'rgba(17,17,19,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-mono-stamp text-white/35">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-terra/60 text-xs hover:text-terra transition-colors"
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em' }}
                              >
                                DELETE
                              </button>
                              <button
                                onClick={() => setSelectedEntry(null)}
                                className="text-white/30 text-xs hover:text-white/60 transition-colors"
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.08em' }}
                              >
                                CLOSE
                              </button>
                            </div>
                          </div>
                          <p
                            className="text-[#F5F4F1] leading-relaxed whitespace-pre-wrap"
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '1rem', lineHeight: 1.7 }}
                          >
                            {entry.content}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full text-left rounded-2xl p-4 transition-all duration-200 group"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono-stamp text-white/30">
                              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="font-mono-stamp text-white/20">
                              {entry.content.trim().split(/\s+/).length} words
                            </span>
                          </div>
                          <p
                            className="text-white/60 text-sm leading-relaxed line-clamp-2"
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
