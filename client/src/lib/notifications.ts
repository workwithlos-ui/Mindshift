// ============================================================
// MINDSHIFT AI — NOTIFICATION LAYER
// Web Notification API + service-worker-triggered local pings.
// iOS Safari 16.4+ requires the app to be "Add to Home Screen"
// (PWA standalone) before notifications/push will work.
// ============================================================

const SETTINGS_KEY = 'ms_notif_settings';
const LAST_FIRED_KEY = 'ms_notif_last_fired';

export interface NotifSettings {
  enabled: boolean;
  morning: string;   // "HH:mm"  e.g. "06:30"
  midday: string;    // e.g. "13:00"
  evening: string;   // e.g. "21:00"
}

export const DEFAULTS: NotifSettings = {
  enabled: false,
  morning: '06:30',
  midday: '13:00',
  evening: '21:00',
};

export function getSettings(): NotifSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { return DEFAULTS; }
}
export function saveSettings(s: NotifSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}
export function permission(): NotificationPermission {
  if (!isSupported()) return 'denied';
  return Notification.permission;
}
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try { return await Notification.requestPermission(); }
  catch { return 'denied'; }
}

// Standalone / installed PWA detection
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari legacy
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function key(slot: 'morning' | 'midday' | 'evening', dayIso: string) {
  return `${dayIso}:${slot}`;
}

function getLastFiredMap(): Record<string, true> {
  try { return JSON.parse(localStorage.getItem(LAST_FIRED_KEY) ?? '{}'); }
  catch { return {}; }
}
function markFired(k: string) {
  const m = getLastFiredMap();
  m[k] = true;
  // prune old
  const today = new Date().toISOString().split('T')[0];
  const pruned: Record<string, true> = {};
  Object.keys(m).forEach(key => {
    if (key.startsWith(today) || key.startsWith(yesterdayIso()) ) pruned[key] = true;
  });
  localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(pruned));
}
function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function fire(title: string, body: string): void {
  if (!isSupported() || permission() !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'mindshift',
    });
  } catch { /* ignore */ }
}

// Copy-ready notification bodies tied to content sections
const CONTENT = {
  morning: {
    title: 'Activate.',
    body: 'Core Identity online. Build. Earn. Expand.',
  },
  midday: {
    title: 'Reset now.',
    body: 'Remove distractions. Execute the next step.',
  },
  evening: {
    title: 'Close the day.',
    body: 'What did you build? What made money?',
  },
  streakBreak: {
    title: 'Momentum check.',
    body: 'One action puts you back in motion.',
  },
  expansion: {
    title: 'Expansion Mode unlocked.',
    body: '7 days consistent. Scale what works.',
  },
};

/**
 * Check the scheduled local reminders. Call frequently from the
 * app (onVisible, every minute). Fires at most once per slot/day.
 */
export function tick(): void {
  const s = getSettings();
  if (!s.enabled) return;
  if (permission() !== 'granted') return;

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toISOString().split('T')[0];
  const fired = getLastFiredMap();

  (['morning', 'midday', 'evening'] as const).forEach(slot => {
    if (hhmm >= s[slot] && hhmm < addMinutes(s[slot], 15)) {
      const k = key(slot, today);
      if (!fired[k]) {
        fire(CONTENT[slot].title, CONTENT[slot].body);
        markFired(k);
      }
    }
  });
}

function addMinutes(hhmm: string, n: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + n;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function fireStreakBreak(): void {
  fire(CONTENT.streakBreak.title, CONTENT.streakBreak.body);
}
export function fireExpansion(): void {
  fire(CONTENT.expansion.title, CONTENT.expansion.body);
}

/** One-off test notification for the settings UI */
export function testNotify(): void {
  fire('MindShift AI', 'Notifications are live. Mind. Body. Business.');
}
