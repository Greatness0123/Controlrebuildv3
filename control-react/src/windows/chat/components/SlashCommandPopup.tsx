import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/shared/Icon';
import { IconName } from '../../../components/shared/Icon';

interface Command {
  command: string;
  description: string;
}

interface SlashCommandPopupProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: string) => void;
}

export const SlashCommandPopup: React.FC<SlashCommandPopupProps> = ({
  commands,
  selectedIndex,
  onSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedItem = containerRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const getIconForCommand = (cmd: string): IconName => {
    const c = cmd.toLowerCase();
    if (c.includes('web')) return 'Globe';
    if (c.includes('cmd') || c.includes('terminal')) return 'Terminal';
    if (c.includes('file') || c.includes('read')) return 'FileText';
    if (c.includes('code') || c.includes('edit')) return 'Code';
    if (c.includes('media') || c.includes('audio')) return 'Volume2';
    if (c.includes('screenshot')) return 'Camera';
    if (c.includes('reset')) return 'RotateCcw';
    if (c.includes('clear')) return 'Trash2';
    return 'Zap';
  };

  if (commands.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-bg-surface/95 backdrop-blur-md border border-border-strong rounded-xl shadow-2xl z-50 py-2 scrollbar-none"
      ref={containerRef}
    >
      {commands.map((cmd, index) => (
        <div
          key={cmd.command}
          onClick={() => onSelect(cmd.command)}
          className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
            index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${index === selectedIndex ? 'bg-white text-black' : 'bg-bg-elevated text-text-muted'}`}>
            <Icon name={getIconForCommand(cmd.command)} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-bold ${index === selectedIndex ? 'text-white' : 'text-text-primary'}`}>
              {cmd.command}
            </div>
            {cmd.description && (
              <div className="text-[11px] text-text-muted truncate">
                {cmd.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};
