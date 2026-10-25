// mobile/api.js
// apiFetch(path, token, options) → { status, ok, data }  (never throws)
// ← T6: request timeout + AbortController + always resolve to a value

// Expo Go reads EXPO_PUBLIC_* at bundle time; callers pass paths relative to /api.
const serverUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.20:3000').replace(/\/+$/, '');
export const BASE_URL = `${serverUrl.endsWith('/api') ? serverUrl : `${serverUrl}/api`}`;

const DEFAULT_TIMEOUT_MS = 10000;

export async function apiFetch(path, token, options = {}) {
  // options may carry timeoutMs alongside normal fetch options
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, body, ...rest } = options || {};

  // Callers sometimes pass a plain object, sometimes an already-stringified body.
  const payload =
    body === undefined || body === null
      ? undefined
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
      ...rest,
      body: payload,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(payload !== undefined ? { 'Content-Type': 'application/json' } : null),
        ...(headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {}; // 204 / non-JSON body → callers still get a usable object
    }

    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    // Timeout, DNS failure, server down, or abort → a normal value, never a throw.
    // status 0 is deliberately not a real HTTP code, so every caller's `!r.ok` path fires.
    return { status: 0, ok: false, data: { error: 'Network request failed or timed out' } };
  } finally {
    clearTimeout(timer);
  }
}