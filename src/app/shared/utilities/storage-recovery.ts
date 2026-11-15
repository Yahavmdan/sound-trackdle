/**
 * Saved browser data from older app versions must never leave the page blank.
 * - On a new app version, cached data (movie list) is dropped; preferences are kept.
 * - If the app fails right after loading, all saved data is cleared and the page reloads once.
 */
const VERSION_KEY = 'app_version';
const RECOVERED_KEY = 'storage_recovered';
const STARTUP_WINDOW_MS = 8000;
const CACHED_KEYS = ['movies'];
const loadedAt = Date.now();

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function prepareStorage(appVersion: string): void {
  safe(() => {
    if (localStorage.getItem(VERSION_KEY) === appVersion) return;
    CACHED_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(VERSION_KEY, appVersion);
  }, undefined);
}

export function recoverFromStartupError(force = false): void {
  if (!force && Date.now() - loadedAt > STARTUP_WINDOW_MS) return;
  if (safe(() => sessionStorage.getItem(RECOVERED_KEY), '1')) return; // only once per tab
  safe(() => {
    sessionStorage.setItem(RECOVERED_KEY, '1');
    localStorage.clear();
  }, undefined);
  location.reload();
}

/** JSON from localStorage, or null when missing / unreadable (the bad value is removed). */
export function readJson<T>(key: string): T | null {
  return safe(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }, null);
}

export function writeJson(key: string, value: unknown): void {
  safe(() => localStorage.setItem(key, JSON.stringify(value)), undefined);
}
