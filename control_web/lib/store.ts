import { create } from 'zustand';

// ─── Auth Store ───
interface AuthState {
  user: any | null;
  loading: boolean;
  setUser: (user: any | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

// ─── Chat Store ───
interface ChatSession {
  id: string;
  title: string;
  vm_id?: string;
  device_id?: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'action';
  content: string;
  screenshot_url?: string;
  action_type?: string;
  action_data?: any;
  created_at: string;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  setSessions: (sessions: ChatSession[]) => void;
  setActiveSession: (id: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
}));

// ─── VM Store ───
interface VM {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'creating' | 'error' | 'stopping' | 'deleting';
  novnc_port?: number;
  instance_url?: string;
  ip?: string;
  created_at: string;
}

interface VMState {
  vms: VM[];
  activeVMId: string | null;
  setVMs: (vms: VM[]) => void;
  setActiveVM: (id: string | null) => void;
  updateVM: (id: string, data: Partial<VM>) => void;
}

export const useVMStore = create<VMState>((set) => ({
  vms: [],
  activeVMId: null,
  setVMs: (vms) => set({ vms }),
  setActiveVM: (id) => set({ activeVMId: id }),
  updateVM: (id, data) =>
    set((state) => ({
      vms: state.vms.map((vm) => (vm.id === id ? { ...vm, ...data } : vm)),
    })),
}));
// ─── Device Store ───
interface Device {
  id: string;
  name: string;
  status: 'paired' | 'pending' | 'revoked';
  last_seen?: string;
  created_at: string;
}

interface DeviceState {
  devices: Device[];
  setDevices: (devices: Device[]) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  setDevices: (devices) => set({ devices }),
}));
