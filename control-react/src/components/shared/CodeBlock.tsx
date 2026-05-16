import React, { useState } from 'react';
import { Icon } from './Icon';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden group">
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-[var(--border-subtle)]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <Icon name={copied ? 'Check' : 'Copy'} size="sm" />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </div>
  );
};
