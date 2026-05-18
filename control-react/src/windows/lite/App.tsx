import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/shared/Icon';
import { Spinner } from '../../components/shared/Spinner';

export default function LiteApp() {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [mode, setMode] = useState<'ask' | 'act' | 'click'>('act');

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;
    setIsProcessing(true);
    setResponse(null);
    try {
      await window.liteAPI.executeTask({ text: inputValue }, mode);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!window.liteAPI) return;

    const unsubStream = window.liteAPI.onAIStream((_, data) => {
      setResponse(prev => (prev || '') + data.text);
    });

    const unsubResponse = window.liteAPI.onAIResponse((_, data) => {
      setIsProcessing(false);
    });

    return () => {
      unsubStream();
      unsubResponse();
    };
  }, []);

  return (
    <div className="flex flex-col w-[360px] pointer-events-auto select-none">
      {/* Lite Bar */}
      <motion.div
        className="h-14 bg-bg-base/90 backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl flex items-center px-2 gap-1 group"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="p-2 text-text-muted group-hover:text-text-primary transition-colors cursor-grab active:cursor-grabbing" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Icon name="GripVertical" size="md" />
        </div>

        <div className="p-2 text-text-muted shrink-0">
          <Icon name={mode === 'ask' ? 'MessageSquare' : mode === 'act' ? 'Zap' : 'MousePointer'} size="md" />
        </div>

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask or give a task..."
          className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-text-primary placeholder:text-text-disabled"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        />

        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
           <button className="p-2 rounded-lg hover:bg-white/10 text-text-muted transition-colors">
             <Icon name="Mic" size="md" />
           </button>
           <button
            onClick={isProcessing ? () => window.liteAPI.stopTask() : handleSend}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isProcessing ? 'bg-red-500 text-white' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
           >
             {isProcessing ? <Icon name="Square" size="sm" /> : <Icon name="ArrowUp" size="sm" />}
           </button>
        </div>
      </motion.div>

      {/* Response Drawer */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-xl overflow-hidden relative"
          >
            <div className="text-xs text-text-secondary leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar">
              {response}
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex justify-between items-center">
               <button
                onClick={() => window.chatAPI.showWindow('chat')}
                className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors"
               >
                 Open Full Chat →
               </button>
               <button
                onClick={() => setResponse(null)}
                className="text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors"
               >
                 Dismiss
               </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-surface to-transparent pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
