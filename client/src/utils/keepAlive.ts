const DEFAULT_BACKEND_URL = 'https://fairhour.onrender.com';
const KEEP_ALIVE_ENDPOINT = '/health';
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

declare global {
  interface Window {
    __fairhourKeepAliveTimer?: number;
  }
}

const getBackendUrl = () =>
  (import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, '');

const pingBackend = async () => {
  try {
    await fetch(`${getBackendUrl()}${KEEP_ALIVE_ENDPOINT}`, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('FairHour keep-alive ping failed:', error);
    }
  }
};

export function startBackendKeepAlive() {
  if (typeof window === 'undefined' || window.__fairhourKeepAliveTimer) {
    return;
  }

  void pingBackend();
  window.__fairhourKeepAliveTimer = window.setInterval(() => {
    void pingBackend();
  }, KEEP_ALIVE_INTERVAL_MS);
}
