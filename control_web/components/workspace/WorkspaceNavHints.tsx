'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, MessageSquare, LayoutDashboard, Cpu, GitBranch, LinkIcon } from 'lucide-react';
import {
  WORKSPACE_HINTS_SESSION_KEY,
  workspaceHintsDismissedKey,
} from '@/lib/onboarding';

const HINTS = [
  {
    id: 'session',
    title: 'Chats live here',
    body: 'Recent sessions appear in the sidebar. New Session starts a fresh thread with your chosen machine.',
    href: '/workspace',
    icon: MessageSquare,
  },
  {
    id: 'workspace',
    title: 'Workspace home',
    body: 'Shortcuts to sessions, VMs, pairing, and settings—good starting point after login.',
    href: '/workspace',
    icon: LayoutDashboard,
  },
  {
    id: 'machines',
    title: 'Cloud machines',
    body: 'Start a virtual desktop, watch usage, then Connect to open an agent session on it.',
    href: '/machines',
    icon: Cpu,
  },
  {
    id: 'workflows',
    title: 'Workflows',
    body: 'Build multi-step automations with triggers. Optional Workflow AI helps draft the graph.',
    href: '/workflows',
    icon: GitBranch,
  },
  {
    id: 'pair',
    title: 'Pair a device',
    body: 'Link your physical desktop for remote view and control from the browser.',
    href: '/pair',
    icon: LinkIcon,
  },
];

export function WorkspaceNavHints({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!userId) return;
    try {
      if (localStorage.getItem(workspaceHintsDismissedKey(userId))) return;
      if (sessionStorage.getItem(WORKSPACE_HINTS_SESSION_KEY) !== '1') return;
      sessionStorage.removeItem(WORKSPACE_HINTS_SESSION_KEY);
      setVisible(true);
    } catch {
      /* ignore */
    }
  }, [userId]);

  const dismissAll = () => {
    try {
      localStorage.setItem(workspaceHintsDismissedKey(userId), '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  const h = HINTS[index];
  const Icon = h.icon;
  const last = index === HINTS.length - 1;

  return (
    <div className="fixed bottom-4 right-4 z-[130] w-[min(100vw-2rem,320px)] rounded-2xl border border-border bg-card shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
            <Icon size={16} className="text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
              Quick tip {index + 1}/{HINTS.length}
            </p>
            <p className="text-sm font-bold text-foreground truncate">{h.title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissAll}
          className="p-1.5 rounded-lg text-text-muted hover:text-foreground hover:bg-secondary shrink-0"
          aria-label="Dismiss all tips"
        >
          <X size={16} />
        </button>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-3">{h.body}</p>
      <Link
        href={h.href}
        className="text-[10px] font-black uppercase tracking-widest text-accent-primary hover:underline mb-3 inline-block"
      >
        Open {h.title.split(' ')[0]} tab
      </Link>
      <div className="flex gap-2 mt-2">
        {!last ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="flex-1 py-2.5 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest"
          >
            Next tip
          </button>
        ) : (
          <button
            type="button"
            onClick={dismissAll}
            className="flex-1 py-2.5 rounded-xl bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
