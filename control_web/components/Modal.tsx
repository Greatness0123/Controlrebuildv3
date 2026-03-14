"use client";

import { useEffect, useRef, ReactNode } from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModalVariant = 'info' | 'success' | 'error' | 'warning' | 'confirm' | 'prompt';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (value?: string) => void;
  variant?: ModalVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  defaultValue?: string;
  placeholder?: string;
  dismissible?: boolean;
}

// ─── Icon & colour maps ───────────────────────────────────────────────────────

const variantConfig: Record<ModalVariant, {
  icon: ReactNode;
  iconBg: string;
  confirmBtn: string;
}> = {
  info: {
    icon: <Info size={22} className="text-blue-400" />,
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  success: {
    icon: <CheckCircle2 size={22} className="text-green-400" />,
    iconBg: 'bg-green-500/10 border-green-500/20',
    confirmBtn: 'bg-green-500 hover:bg-green-600 text-white',
  },
  error: {
    icon: <AlertCircle size={22} className="text-red-400" />,
    iconBg: 'bg-red-500/10 border-red-500/20',
    confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: <AlertTriangle size={22} className="text-orange-400" />,
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    confirmBtn: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  confirm: {
    icon: <AlertTriangle size={22} className="text-orange-400" />,
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    confirmBtn: 'bg-red-500 hover:bg-red-600 text-white',
  },
  prompt: {
    icon: <Info size={22} className="text-purple-400" />,
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    confirmBtn: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Modal({
  open,
  onClose,
  onConfirm,
  variant = 'info',
  title,
  message,
  confirmLabel,
  cancelLabel = 'Close',
  defaultValue = '',
  placeholder = 'Type here...',
  dismissible = true,
}: ModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(defaultValue);
  const cfg = variantConfig[variant];
  const isConfirm = variant === 'confirm';
  const isPrompt = variant === 'prompt';

  // Reset input value when modal opens
  useEffect(() => {
    if (open && isPrompt) {
      setInputValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (open) {
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [open, isPrompt, defaultValue]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm(isPrompt ? inputValue : undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 animate-fade-in-up overflow-hidden"
        style={{ animationDuration: '0.2s' }}
      >
        {/* Top accent strip */}
        <div className={`h-0.5 w-full ${
          variant === 'error' ? 'bg-red-500' :
          variant === 'success' ? 'bg-green-500' :
          variant === 'warning' || variant === 'confirm' ? 'bg-orange-500' :
          variant === 'prompt' ? 'bg-purple-500' :
          'bg-blue-500'
        }`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cfg.iconBg}`}>
                {cfg.icon}
              </div>
              <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-all ml-2 shrink-0"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Message */}
          <p className="text-sm text-zinc-400 leading-relaxed mb-4 pl-[3.25rem]">
            {message}
          </p>

          {/* Input field for prompt variant */}
          {isPrompt && (
            <div className="pl-[3.25rem] mb-6">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
                placeholder={placeholder}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {(isConfirm || isPrompt) && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all"
              >
                {cancelLabel || 'Cancel'}
              </button>
            )}
            <button
              ref={confirmRef}
              onClick={handleConfirm}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${cfg.confirmBtn}`}
            >
              {confirmLabel ?? (isConfirm ? 'Confirm' : isPrompt ? 'Submit' : 'OK')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

