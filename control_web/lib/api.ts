const BACKEND_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://20.164.16.171:8000');

import { getAccessToken, getSupabaseClient } from './supabase';

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

export const chatApi = {
  list: async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return { sessions: data };
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to backend:', err);
      return apiFetch<{ sessions: any[] }>('/api/chat/list');
    }
  },
  create: (vmId?: string, deviceId?: string) =>
    apiFetch<{ session: any }>('/api/chat/create', {
      method: 'POST',
      body: JSON.stringify({ vm_id: vmId, device_id: deviceId }),
    }),
  messages: async (sessionId: string) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { messages: data };
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to backend:', err);
      return apiFetch<{ messages: any[] }>(`/api/chat/${sessionId}/messages`);
    }
  },
  update: (sessionId: string, data: { vm_id?: string | null; device_id?: string | null; title?: string; ai_status?: string }) =>
    apiFetch<{ session: any }>(`/api/chat/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (sessionId: string) =>
    apiFetch<{ success: boolean }>(`/api/chat/${sessionId}`, { method: 'DELETE' }),

  uploadFile: async (sessionId: string, file: File): Promise<{ file_url: string; file_type: string; filename: string }> => {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'File upload failed');
    }
    return res.json();
  },

  getProviderConfig: () => apiFetch<{ config: any }>('/api/chat/provider-config'),
  saveProviderConfig: (config: any) =>
    apiFetch<{ success: boolean }>('/api/chat/provider-config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  getTerminalPermission: () => apiFetch<{ permission: string }>('/api/chat/terminal-permission'),
  setTerminalPermission: (permission: string) =>
    apiFetch<{ success: boolean; permission: string }>('/api/chat/terminal-permission', {
      method: 'POST',
      body: JSON.stringify(permission),
    }),

  sendMessage: async function* (sessionId: string, message: string, fileUrl?: string, mode?: string) {
    const token = await getAccessToken();
    const res = await fetch(`${BACKEND_URL}/api/chat/${sessionId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, file_url: fileUrl, mode: mode || 'act' }),
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

export const vaultApi = {
  list: () => apiFetch<any[]>('/api/secrets/list'),
  create: (data: any) => apiFetch<any>('/api/secrets/', {
    method: 'POST', body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch<any>(`/api/secrets/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/secrets/${id}`, { method: 'DELETE' }),
};

export const configApi = {
  get: (key: string) => apiFetch<{ value: any }>(`/api/config/${key}`),
  set: (key: string, value: any) =>
    apiFetch<{ success: boolean }>(`/api/config/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
};
