import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { Icon } from '../../components/shared/Icon';

export default function GhostCursorApp() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState<string | null>(null);
  const [isGuiding, setIsGuiding] = useState(false);
  const [isIdle, setIsIdle] = useState(true);

  const springX = useSpring(0, { damping: 30, stiffness: 200 });
  const springY = useSpring(0, { damping: 30, stiffness: 200 });

  useEffect(() => {
    if (!window.ghostCursorAPI) return;

    const unsubMove = window.ghostCursorAPI.onMove((_, data) => {
      setIsIdle(false);
      springX.set(data.x);
      springY.set(data.y);
      setPos({ x: data.x, y: data.y });
    });

    const unsubMouseMove = window.ghostCursorAPI.onMouseMove((_, data) => {
      if (isIdle) {
        springX.set(data.x);
        springY.set(data.y);
        setPos({ x: data.x, y: data.y });
      }
    });

    const unsubText = window.ghostCursorAPI.onUpdateText((_, data) => {
      setText(data.text);
    });

    const unsubGuiding = window.ghostCursorAPI.onSetGuiding((_, data) => {
      setIsGuiding(data.guiding);
    });

    const unsubIdle = window.ghostCursorAPI.onStartIdle(() => {
      setIsIdle(true);
      setText(null);
    });

    window.ghostCursorAPI.initGhostCursorSettings();

    return () => {
      unsubMove();
      unsubMouseMove();
      unsubText();
      unsubGuiding();
      unsubIdle();
    };
  }, [isIdle]);

  return (
    <div className="relative h-screen w-screen overflow-hidden pointer-events-none select-none">
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-0 left-0 flex flex-col items-center"
      >
        {/* Ghost Cursor SVG */}
        <div className="relative">
           <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-xl"
           >
            <path
              d="M2 2L12 24L16 14L26 10L2 2Z"
              fill="#1c1c1e"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
           </svg>

           {isGuiding && (
             <div className="absolute inset-0 rounded-full animate-ping bg-white/20 scale-150" />
           )}
        </div>

        {/* Text Bubble */}
        <AnimatePresence>
          {text && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="mt-4 max-w-[260px] bg-bg-surface/84 backdrop-blur-md border border-border-subtle rounded-xl p-3 shadow-2xl"
            >
              <p className="text-[13px] font-medium text-white leading-relaxed">{text}</p>

              {/* Done button (visible only in Click mode logic would go here) */}
              <button
                onClick={() => window.ghostCursorAPI.stepCompleted()}
                className="mt-2 w-full py-1.5 bg-white text-black rounded-lg text-[10px] font-bold uppercase tracking-wider pointer-events-auto hover:bg-white/90 active:scale-95 transition-all"
              >
                Done
              </button>

              {/* Bubble Pointer */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-surface border-l border-t border-border-subtle rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
