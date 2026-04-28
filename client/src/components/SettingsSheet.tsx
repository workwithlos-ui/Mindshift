// ============================================================
// SettingsSheet — notifications, AI profile, install PWA hint.
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSettings, saveSettings, requestPermission, permission,
  isSupported as notifSupported, testNotify,
  isInstalledPWA, isIos,
  type NotifSettings,
} from '@/lib/notifications';
import { getProfile, setProfileNotes, clearMemory } from '@/lib/storage';
import { supabaseEnabled } from '@/lib/supabase';
import { Hairline, EASE } from '@/components/ui-shared';

export function SettingsSheet({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<NotifSettings>(getSettings());
  const [perm, setPerm] = useState<NotificationPermission>('default');
  const [profileText, setProfileText] = useState('');

  useEffect(() => {
    if (!open) return;
    setSettings(getSettings());
    setPerm(permission());
    setProfileText(getProfile().notes.join('\n'));
  }, [open]);

  const toggleEnabled = async () => {
    let next = { ...settings, enabled: !settings.enabled };
    if (next.enabled && perm !== 'granted') {
      const p = await requestPermission();
      setPerm(p);
      if (p !== 'granted') next = { ...next, enabled: false };
    }
    setSettings(next);
    saveSettings(next);
  };

  const updateTime = (slot: 'morning' | 'midday' | 'evening', value: string) => {
    const next = { ...settings, [slot]: value };
    setSettings(next);
    saveSettings(next);
  };

  const saveProfile = () => {
    const notes = profileText.split('\n').map(l => l.trim()).filter(Boolean);
    setProfileNotes(notes);
    if ('vibrate' in navigator) navigator.vibrate?.(8);
  };

  const resetMemory = () => {
    if (confirm('Clear AI conversation memory?')) clearMemory();
  };

  const installed = isInstalledPWA();
  const ios = isIos();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,5,10,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed left-0 right-0 bottom-0 z-50 mx-auto"
            style={{ maxWidth: 640 }}
          >
            <div
              className="rounded-t-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #14141C 0%, #0A0A0F 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div className="sticky top-0 z-10" style={{ background: 'linear-gradient(180deg, #14141C, #14141CF0)' }}>
                <div className="flex items-center justify-between px-5 pt-3 pb-3">
                  <div className="flex-1 flex justify-center">
                    <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 pb-3">
                  <div>
                    <span className="font-mono-stamp text-white/40" style={{ letterSpacing: '0.12em' }}>SETTINGS</span>
                    <h2
                      className="text-white mt-1"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 400,
                        fontSize: '1.4rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Preferences
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <Hairline />
              </div>

              <div className="px-5 py-6 space-y-6">
                {/* Install hint */}
                {!installed && (
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(184,164,255,0.10) 0%, rgba(184,164,255,0.02) 100%)',
                      border: '1px solid rgba(184,164,255,0.2)',
                    }}
                  >
                    <span className="font-mono-stamp" style={{ color: 'var(--amethyst)' }}>
                      INSTALL
                    </span>
                    <p className="text-white/80 text-sm mt-1.5 mb-2" style={{ fontFamily: 'var(--font-ui)' }}>
                      Install MindShift for offline access + notifications.
                    </p>
                    <p className="text-white/50 text-xs" style={{ fontFamily: 'var(--font-ui)', lineHeight: 1.55 }}>
                      {ios
                        ? 'In Safari: tap the Share icon → "Add to Home Screen".'
                        : 'In your browser menu: "Install app" or "Add to Home screen".'}
                    </p>
                  </div>
                )}

                {/* Notifications */}
                <section>
                  <span className="font-mono-stamp text-white/40">NOTIFICATIONS</span>
                  <div className="mt-3 space-y-3">
                    <ToggleRow
                      label="Daily reminders"
                      sub={!notifSupported() ? 'Not supported in this browser'
                        : perm === 'denied' ? 'Blocked — enable in browser settings'
                        : settings.enabled ? 'Morning · Midday · Evening' : 'Tap to enable'}
                      checked={settings.enabled}
                      onChange={toggleEnabled}
                      disabled={!notifSupported() || perm === 'denied'}
                    />
                    {settings.enabled && (
                      <div className="space-y-2 pl-1">
                        <TimeRow label="Morning wake-up" value={settings.morning} onChange={v => updateTime('morning', v)} color="var(--peach)" />
                        <TimeRow label="Midday reset" value={settings.midday} onChange={v => updateTime('midday', v)} color="var(--amethyst)" />
                        <TimeRow label="Evening review" value={settings.evening} onChange={v => updateTime('evening', v)} color="var(--teal)" />
                      </div>
                    )}
                    {perm === 'granted' && (
                      <button
                        onClick={testNotify}
                        className="w-full px-3 py-2.5 rounded-xl text-xs transition-colors"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.1em',
                          color: 'rgba(245,244,248,0.7)',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        SEND TEST NOTIFICATION
                      </button>
                    )}
                    {ios && !installed && (
                      <p className="text-white/35 text-xs leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>
                        On iPhone, notifications only work after you "Add to Home Screen".
                      </p>
                    )}
                  </div>
                </section>

                <Hairline />

                {/* AI memory */}
                <section>
                  <span className="font-mono-stamp text-white/40">AI MEMORY</span>
                  <p className="text-white/60 text-sm mt-1.5 mb-3" style={{ fontFamily: 'var(--font-ui)' }}>
                    Facts the AI should always know. One per line.
                  </p>
                  <textarea
                    value={profileText}
                    onChange={e => setProfileText(e.target.value)}
                    rows={5}
                    placeholder={'Building Los Silva community\nFocused on business acquisition + AI consulting\nMornings are for revenue work'}
                    className="w-full bg-transparent outline-none resize-none p-3 rounded-xl placeholder:text-white/20"
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                      color: '#F5F4F8',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={saveProfile} className="btn-primary flex-1">Save facts</button>
                    <button
                      onClick={resetMemory}
                      className="px-4 py-2.5 rounded-xl text-xs"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.1em',
                        color: 'rgba(255,130,130,0.8)',
                        background: 'rgba(255,130,130,0.08)',
                        border: '1px solid rgba(255,130,130,0.18)',
                      }}
                    >
                      CLEAR HISTORY
                    </button>
                  </div>
                </section>

                <Hairline />

                {/* Sync status */}
                <section>
                  <span className="font-mono-stamp text-white/40">SYNC</span>
                  <div
                    className="mt-3 p-3 rounded-xl flex items-center justify-between"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div>
                      <p className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                        {supabaseEnabled ? 'Cloud sync active' : 'Local only'}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'var(--font-ui)' }}>
                        {supabaseEnabled
                          ? 'Data backed up to Supabase'
                          : 'Data stays on this device'}
                      </p>
                    </div>
                    <span
                      className="pulse-dot"
                      style={{ background: supabaseEnabled ? 'var(--mint)' : 'rgba(255,255,255,0.4)' }}
                    />
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ToggleRow({
  label, sub, checked, onChange, disabled,
}: { label: string; sub: string; checked: boolean; onChange: () => void; disabled?: boolean; }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors disabled:opacity-40"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div>
        <p className="text-white text-sm" style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}>{label}</p>
        <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'var(--font-ui)' }}>{sub}</p>
      </div>
      <span
        className="relative inline-block flex-shrink-0 rounded-full transition-colors"
        style={{
          width: 40, height: 22,
          background: checked ? 'var(--amethyst)' : 'rgba(255,255,255,0.12)',
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all"
          style={{
            width: 18, height: 18,
            left: checked ? 20 : 2,
            background: checked ? '#0A0A0F' : '#F5F4F8',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </span>
    </button>
  );
}

function TimeRow({
  label, value, onChange, color,
}: { label: string; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-1 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-white/75 text-sm" style={{ fontFamily: 'var(--font-ui)' }}>{label}</span>
      </div>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent outline-none text-right tabular-nums"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: '#F5F4F8',
          colorScheme: 'dark',
        }}
      />
    </div>
  );
}
