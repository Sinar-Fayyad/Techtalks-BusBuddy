import { apiFetch, BASE_URL } from '../api';

// All network calls of the app go through here. Never throws.
export const call = (token, path, opts) => apiFetch(path, token, opts);
export const errOf = (r, fallback = 'Something went wrong. Please try again.') =>
  (r && r.data && r.data.error) || fallback;

// multipart upload (license photo). apiFetch always JSON-encodes, so this one uses fetch directly.
export async function upload(token, path, formData) {
  try {
    const res = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: formData,
    });
    let data = {};
    try { data = await res.json(); } catch { data = {}; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: 'Network request failed' } };
  }
}
