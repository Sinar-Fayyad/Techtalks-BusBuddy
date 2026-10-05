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
