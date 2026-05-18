import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/shared/Icon';

const tips = [
  { icon: 'Zap', title: 'Avoid Interactions During ACT', description: "Don't interact with your computer while ACT mode is running tasks." },
  { icon: 'Mic', title: 'Toggle Greetings', description: 'Enable or disable greeting voice in settings. Greetings wait if locked.' },
  { icon: 'WifiOff', title: 'Offline Mode', description: 'Cached settings and account data work offline. Offline TTS is used automatically.' },
  { icon: 'Command', title: 'Wake Word', description: 'Say "Hey Control" to activate. Enable auto-send for automatic transcription.' },
  { icon: 'Keyboard', title: 'Keyboard Shortcuts', description: 'Ctrl+Space: Toggle chat | Alt+Z: Stop task | Escape: Clear input' },
];

export const TipsCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-20 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-xl"
        >
          <div className="text-text-muted shrink-0">
            <Icon name={tips[index].icon as any} size="md" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h4 className="text-[11px] font-bold uppercase tracking-wider">{tips[index].title}</h4>
            <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{tips[index].description}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
