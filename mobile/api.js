export const BASE_URL = 'http://192.168.2.165:3000'; // ← ipconfig IPv4 if different

export async function loginRequest(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.status === 200, status: res.status, data };
}

// NEW — one helper for every logged-in call: adds the Bearer token for us.
export async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.status >= 200 && res.status < 300, status: res.status, data };
}
