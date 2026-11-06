// Used by the single-file preview build, which has no service worker.
export function registerSW(_opts?: unknown) { return () => Promise.resolve(); }
