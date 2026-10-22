// One fetch helper for all pages. Never throws: network problems become { ok:false, status:0 }.
export type ApiResult<T = any> = { ok: boolean; status: number; data: T };

export async function api<T = any>(
  token: string | null,
  path: string,
  opts: { method?: string; body?: unknown; form?: FormData } = {}
): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    let body: BodyInit | undefined;
    if (opts.form) {
      body = opts.form;
    } else if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opts.body);
    }
    const res = await fetch(`/api${path}`, { method: opts.method ?? 'GET', headers, body });
    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('api() network error:', err);
    return { ok: false, status: 0, data: { error: 'Cannot reach the server. Check your connection and try again.' } as any };
  }
}

export function errorOf(r: ApiResult, fallback = 'Something went wrong. Please try again.'): string {
  return (r.data && (r.data as any).error) || fallback;
}
