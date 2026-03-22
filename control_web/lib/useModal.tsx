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

export function useModal() {
  const [state, setState] = useState<(ShowOptions & { open: boolean }) | null>(null);

  const close = useCallback(() => {
    setState(null);
  }, []);

  const alert = useCallback((message: string, opts?: Partial<Omit<ShowOptions, 'message'>>) => {
    setState({ open: true, message, variant: 'error', title: 'Error', ...opts });
  }, []);

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
