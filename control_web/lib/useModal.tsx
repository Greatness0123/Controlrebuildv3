"use client";

import { useState, useCallback, ReactNode } from 'react';
import Modal, { ModalVariant } from '@/components/Modal';

interface ShowOptions {
  variant?: ModalVariant;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

/**
 * useModal — drop-in replacement for window.alert(), window.confirm(), and window.prompt()
 */
export function useModal() {
  const [state, setState] = useState<(ShowOptions & { open: boolean }) | null>(null);

  const close = useCallback(() => {
    setState(null);
  }, []);

  /** Replaces window.alert() */
  const alert = useCallback((message: string, opts?: Partial<Omit<ShowOptions, 'message'>>) => {
    setState({ open: true, message, variant: 'error', title: 'Error', ...opts });
  }, []);

  /** Replaces window.confirm() — resolves true/false */
  const confirm = useCallback((message: string, opts?: Partial<Omit<ShowOptions, 'message'>>): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        variant: 'confirm',
        title: 'Are you sure?',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        ...opts,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, []);

  /** Replaces window.prompt() — resolves string | null */
  const prompt = useCallback((message: string, defaultValue?: string, opts?: Partial<Omit<ShowOptions, 'message'>>): Promise<string | null> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        variant: 'prompt',
        title: 'Input Required',
        confirmLabel: 'Submit',
        cancelLabel: 'Cancel',
        defaultValue,
        ...opts,
        onConfirm: (value) => resolve(value ?? null),
        onCancel: () => resolve(null),
      });
    });
  }, []);

  /** Show an info / success / any variant */
  const show = useCallback((opts: ShowOptions) => {
    setState({ open: true, ...opts });
  }, []);

  const modal: ReactNode = state ? (
    <Modal
      open={state.open}
      onClose={() => { 
        if (state.onCancel) state.onCancel();
        close(); 
      }}
      onConfirm={state.onConfirm}
      variant={state.variant ?? 'info'}
      title={state.title ?? 'Notice'}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      defaultValue={state.defaultValue}
    />
  ) : null;

  return { modal, alert, confirm, prompt, show };
}
