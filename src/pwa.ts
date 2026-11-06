import { registerSW } from 'virtual:pwa-register';

/** Register the service worker and check for a new version whenever the app is opened or brought back. */
export function setupPwa() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url: string, reg: ServiceWorkerRegistration | undefined) {
      if (!reg) return;
      const check = () => { reg.update().catch(() => { /* offline */ }); };
      check();
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      setInterval(check, 30 * 60 * 1000);
    },
  });
}
