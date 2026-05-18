import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOverlayStore } from '../../stores/overlayStore';
import { useOverlay } from '../../hooks/useOverlay';
import { Icon } from '../../components/shared/Icon';

export default function OverlayApp() {
  useOverlay();
  const { isVisible, isMinimized, actions, setVisible, setMinimized, clearActions } = useOverlayStore();
  const [glowType, setGlowType] = useState<string | null>(null);
  const [pinRequired, setPinRequired] = useState(false);
  const [pinValue, setPinRequiredValue] = useState('');

  useEffect(() => {
    if (!window.overlayAPI) return;

    const unsubGlow = window.overlayAPI.onShowVisualEffect((_, data) => {
      setGlowType(data.type);
      setTimeout(() => setGlowType(null), 3000);
    });

    const unsubPin = window.overlayAPI.onRequestPinAndToggle(() => {
      setPinRequired(true);
    });

    return () => {
      unsubGlow();
      unsubPin();
    };
  }, []);

  const handlePinSubmit = async () => {
    const res = await window.overlayAPI.verifyPin(pinValue);
    if (res.valid) {
      setPinRequired(false);
      setPinRequiredValue('');
      await window.overlayAPI.unlockApp(pinValue);
      window.chatAPI.toggleChat();
    } else {
      setPinRequiredValue('');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden pointer-events-none select-none">
      {/* PIN Modal */}
      <AnimatePresence>
        {pinRequired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10005] flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-bg-elevated border border-border-strong rounded-2xl p-8 w-80 shadow-2xl space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">Enter PIN</h2>
                <p className="text-xs text-text-muted">This device is protected. Enter your PIN to continue.</p>
              </div>
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pinValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPinRequiredValue(val);
                  if (val.length === 4) {
                    // Auto-submit logic or use button
                  }
                }}
                className="w-full bg-black/40 border-none rounded-xl py-4 text-center text-2xl tracking-[1em] text-white outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              <div className="flex gap-3">
                 <button onClick={() => setPinRequired(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-text-secondary text-xs font-bold uppercase hover:bg-white/10 transition-colors">Cancel</button>
                 <button onClick={handlePinSubmit} className="flex-1 py-3 rounded-xl bg-white text-black text-xs font-bold uppercase hover:bg-white/90 transition-colors">Confirm</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edge Glow Effect */}
      <AnimatePresence>
        {glowType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 pointer-events-none z-0 border-[6px] ${glowType === 'task-active' ? 'border-purple-500/30' : 'border-blue-500/30'} blur-md`}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setMinimized(false)}
            className="fixed bottom-6 right-6 w-4 h-4 bg-white rounded-full shadow-2xl pointer-events-auto cursor-pointer border-2 border-black group"
          >
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-25" />
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="fixed top-6 right-6 w-[380px] bg-bg-base/82 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
          >
            <header className="flex items-center justify-between px-4 h-12 bg-white/5 border-b border-white/5 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
               <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  <Icon name="GripVertical" size="md" className="text-text-muted cursor-grab active:cursor-grabbing" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Action Feed</span>
               </div>
               <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
                  <button
                    onClick={() => window.chatAPI.stopTask()}
                    className="p-2 rounded-md hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                  >
                    <Icon name="Square" size="sm" />
                  </button>
                  <button
                    onClick={() => setMinimized(true)}
                    className="p-2 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                  >
                    <Icon name="Minus" size="sm" />
                  </button>
               </div>
            </header>

            <div className="p-4 space-y-3">
              <AnimatePresence initial={false}>
                {actions.slice(-3).map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="flex items-start gap-4 p-3 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon name="Play" size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-white truncate">{action.tool}</div>
                      <div className="text-[11px] text-text-muted line-clamp-1">{JSON.stringify(action.parameters)}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {actions.length === 0 && (
                <div className="py-8 text-center text-[11px] font-medium text-text-disabled uppercase tracking-widest">
                  Waiting for task...
                </div>
              )}
            </div>

            {actions.length > 0 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className="h-1 bg-white origin-left"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
