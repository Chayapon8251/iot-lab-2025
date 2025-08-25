// src/lib/api.ts
// เลือก BASE แบบ production ก่อนเสมอ แล้วค่อย fallback
const RAW_BASE =
  import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? (import.meta.env.VITE_DEV_API_URL || 'http://localhost:3000/api/v1') : '')
  || 'https://database-iot5.onrender.com/api/v1';

// ตัด "/" ท้าย BASE เพื่อป้องกัน // ซ้อน
const API_BASE = RAW_BASE.replace(/\/+$/, '');

// ใช้ชื่อ env ให้ตรงกับที่ตั้งไว้บน Render: VITE_API_SECRET
const API_SECRET = import.meta.env.VITE_API_SECRET || '';

// helper รวม path ให้ถูกเสมอ
const join = (p: string) => `${API_BASE}${p.startsWith('/') ? p : '/' + p}`;

async function request<T = any>(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // ใส่เป็น x-api-secret (ถ้า backend ใช้แบบนี้)
  if (API_SECRET) headers['x-api-secret'] = API_SECRET;

  const res = await fetch(join(path), {
    method: options.method || 'GET',
    headers,
    body: options.body,
    mode: 'cors',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[${res.status}] ${res.statusText} @ ${join(path)} :: ${text}`);
  }

  const ct = res.headers.get('content-type') || '';
  return (ct.includes('application/json') ? res.json() : res.text()) as Promise<T>;
}

export const api = {
  get: <T = any>(p: string) => request<T>(p),
  post: <T = any>(p: string, b: any) => request<T>(p, { method: 'POST', body: JSON.stringify(b) }),
  put:  <T = any>(p: string, b: any) => request<T>(p, { method: 'PUT',  body: JSON.stringify(b) }),
  patch:<T = any>(p: string, b: any) => request<T>(p, { method: 'PATCH',body: JSON.stringify(b) }),
  del:  <T = any>(p: string)        => request<T>(p, { method: 'DELETE' }),
};

export { API_BASE };
