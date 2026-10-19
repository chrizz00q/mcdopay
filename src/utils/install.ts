/* Install-to-home-screen support.
   Chrome, Edge and Android fire `beforeinstallprompt`; iPhone Safari never does,
   so iOS users get step-by-step instructions instead. */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  canPrompt: boolean;
  installed: boolean;
}

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = { canPrompt: false, installed: false };
const listeners = new Set<() => void>();

function setState(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  // Registered at import time because the event can fire before React mounts.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    setState({ canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    setState({ canPrompt: false, installed: true });
  });
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getInstallState = () => state;

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const event = deferred;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  setState({ canPrompt: false, installed: outcome === 'accepted' });
  return outcome;
}

export function detectEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIOS: false, inAppBrowser: false, standalone: false };
  }
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inAppBrowser = /FBAN|FBAV|Instagram|Messenger|Line\/|Snapchat|TikTok|Twitter/i.test(ua);
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return { isIOS, inAppBrowser, standalone };
}

/* "Not now" snoozes the banner for two weeks. Kept outside the app data so
   resetting your data does not bring the banner back. */
const DISMISS_KEY = 'mcdopay:install-dismissed';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export function isInstallSnoozed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

export function snoozeInstall(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
