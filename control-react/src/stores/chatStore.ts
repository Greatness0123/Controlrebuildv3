import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Step, Action } from '../types/chat';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  id: string;
}

export interface Session {
  id: string;
  title: string;
  lastModified: string;
  mode: 'ask' | 'act' | 'click';
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string | null;
  messages: Record<string, Message[]>; // Keyed by sessionId
  streamingContent: string;
  isProcessing: boolean;
  currentActions: Step[];
  mode: 'ask' | 'act' | 'click';
}

interface ChatActions {
  addSession: (session: Session) => void;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  appendStreamChunk: (chunk: string) => void;
  finalizeStream: (sessionId: string, messageId: string) => void;
  setProcessing: (value: boolean) => void;
  setMode: (mode: 'ask' | 'act' | 'click') => void;
  deleteSession: (id: string) => void;
  clearMessages: (sessionId: string) => void;
  // Action Timeline
  addActionStep: (step: Step) => void;
  updateActionStep: (index: number, update: Partial<Step>) => void;
  clearActions: () => void;
}

export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    persist(
      immer((set) => ({
        sessions: [],
        activeSessionId: null,
        messages: {},
        streamingContent: '',
        isProcessing: false,
        currentActions: [],
        mode: 'act',

        addSession: (session) =>
          set((state) => {
            state.sessions.unshift(session);
            state.activeSessionId = session.id;
          }),

        setActiveSession: (id) =>
          set((state) => {
            state.activeSessionId = id;
          }),

        addMessage: (sessionId, message) =>
          set((state) => {
            if (!state.messages[sessionId]) state.messages[sessionId] = [];
            state.messages[sessionId].push(message);
          }),

        setMessages: (sessionId, messages) =>
          set((state) => {
            state.messages[sessionId] = messages;
          }),

        appendStreamChunk: (chunk) =>
          set((state) => {
            state.streamingContent += chunk;
          }),

        finalizeStream: (sessionId, messageId) =>
          set((state) => {
            if (!state.messages[sessionId]) state.messages[sessionId] = [];
            state.messages[sessionId].push({
              id: messageId,
              role: 'assistant',
              content: state.streamingContent,
              timestamp: new Date().toISOString(),
            });
            state.streamingContent = '';
            state.isProcessing = false;
          }),

        setProcessing: (value) =>
          set((state) => {
            state.isProcessing = value;
          }),

        setMode: (mode) =>
          set((state) => {
            state.mode = mode;
          }),

        deleteSession: (id) =>
          set((state) => {
            state.sessions = state.sessions.filter((s) => s.id !== id);
            delete state.messages[id];
            if (state.activeSessionId === id) state.activeSessionId = null;
          }),

        clearMessages: (sessionId) =>
          set((state) => {
            state.messages[sessionId] = [];
          }),

        addActionStep: (step) =>
          set((state) => {
            state.currentActions.push(step);
          }),

        updateActionStep: (index, update) =>
          set((state) => {
            if (state.currentActions[index]) {
              Object.assign(state.currentActions[index], update);
            }
          }),

        clearActions: () =>
          set((state) => {
            state.currentActions = [];
          }),
      })),
      {
        name: 'control-chat-storage',
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
          mode: state.mode,
        }),
      }
    ),
    { name: 'ChatStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
