const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://20.164.16.171:8000';

import { getAccessToken } from './supabase';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── VM API ───
export const vmApi = {
  list: () => apiFetch<{ vms: any[] }>('/api/vm/list'),
  create: (name: string) => apiFetch<{ vm: any }>('/api/vm/create', {
    method: 'POST', body: JSON.stringify({ name }),
  }),
  start: (id: string) => apiFetch<{ vm: any }>(`/api/vm/${id}/start`, { method: 'POST' }),
  stop: (id: string) => apiFetch<{ vm: any }>(`/api/vm/${id}/stop`, { method: 'POST' }),
  destroy: (id: string) => apiFetch<{ success: boolean }>(`/api/vm/${id}`, { method: 'DELETE' }),
  stats: (id: string) => apiFetch<{ stats: any }>(`/api/vm/${id}/stats`),
};

// ─── Chat API ───
export const chatApi = {
  list: () => apiFetch<{ sessions: any[] }>('/api/chat/list'),
  create: (vmId?: string, deviceId?: string) =>
    apiFetch<{ session: any }>('/api/chat/create', {
      method: 'POST',
      body: JSON.stringify({ vm_id: vmId, device_id: deviceId }),
    }),
  messages: (sessionId: string) =>
    apiFetch<{ messages: any[] }>(`/api/chat/${sessionId}/messages`),
  update: (sessionId: string, data: { vm_id?: string | null; device_id?: string | null; title?: string }) =>
    apiFetch<{ session: any }>(`/api/chat/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (sessionId: string) =>
    apiFetch<{ success: boolean }>(`/api/chat/${sessionId}`, { method: 'DELETE' }),

  // SSE stream
  sendMessage: async function* (sessionId: string, message: string) {
    const token = await getAccessToken();
    const res = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            yield JSON.parse(line.slice(6));
          } catch { }
        }
      }
    }
  },
};

// ─── Pairing API ───
export const pairApi = {
  generate: (deviceName: string) =>
    apiFetch<{ device_id: string; code: string; expires_at: string }>('/api/pair/generate', {
      method: 'POST', body: JSON.stringify({ device_name: deviceName }),
    }),
  validate: (code: string) =>
    apiFetch<{ device_id: string; name: string; status: string }>('/api/pair/validate', {
      method: 'POST', body: JSON.stringify({ code }),
    }),
  devices: () => apiFetch<{ devices: any[] }>('/api/pair/devices'),
  updateStatus: (deviceId: string, status: string) =>
    apiFetch<{ id: string; status: string }>(`/api/pair/${deviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  revoke: (deviceId: string) =>
    apiFetch<{ success: boolean }>(`/api/pair/${deviceId}`, { method: 'DELETE' }),
};
