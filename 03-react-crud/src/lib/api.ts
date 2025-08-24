// src/lib/api.ts
export const API_BASE =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const AUTH = import.meta.env.VITE_AUTH_TOKEN ?? '1234';

async function request<T = any>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: AUTH,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  return (ct.includes('application/json') ? res.json() : res.text()) as Promise<T>;
}

export const api = {
  get: <T = any>(p: string) => request<T>(p),
  post: <T = any>(p: string, b: any) =>
    request<T>(p, { method: 'POST', body: JSON.stringify(b) }),
  put: <T = any>(p: string, b: any) =>
    request<T>(p, { method: 'PUT', body: JSON.stringify(b) }),
  patch: <T = any>(p: string, b: any) =>
    request<T>(p, { method: 'PATCH', body: JSON.stringify(b) }),
  del: <T = any>(p: string) => request<T>(p, { method: 'DELETE' }),
};
