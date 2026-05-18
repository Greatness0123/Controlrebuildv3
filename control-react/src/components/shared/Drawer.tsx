import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: number | string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 480
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width }}
            className="relative h-full bg-[var(--bg-base)] border-l border-[var(--border-strong)] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <Icon name="X" size="lg" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
