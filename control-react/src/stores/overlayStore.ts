import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface OverlayState {
  isVisible: boolean;
  isMinimized: boolean;
  actions: any[];
  position: { x: number; y: number };
  interactionMode: 'none' | 'all';
}

interface OverlayActions {
  setVisible: (value: boolean) => void;
  setMinimized: (value: boolean) => void;
  pushAction: (action: any) => void;
  clearActions: () => void;
  setPosition: (pos: { x: number; y: number }) => void;
  setInteractionMode: (mode: 'none' | 'all') => void;
}

export const useOverlayStore = create<OverlayState & OverlayActions>()(
  devtools(
    immer((set) => ({
      isVisible: true,
      isMinimized: false,
      actions: [],
      position: { x: 0, y: 0 },
      interactionMode: 'none',

      setVisible: (value) =>
        set((state) => {
          state.isVisible = value;
        }),

      setMinimized: (value) =>
        set((state) => {
          state.isMinimized = value;
        }),

      pushAction: (action) =>
        set((state) => {
          state.actions.push(action);
        }),

      clearActions: () =>
        set((state) => {
          state.actions = [];
        }),

      setPosition: (pos) =>
        set((state) => {
          state.position = pos;
        }),

      setInteractionMode: (mode) =>
        set((state) => {
          state.interactionMode = mode;
        }),
    })),
    { name: 'OverlayStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
