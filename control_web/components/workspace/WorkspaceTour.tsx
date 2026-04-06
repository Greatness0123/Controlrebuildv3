'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  WORKSPACE_TOUR_SESSION_KEY,
  workspaceTourDoneKey,
} from '@/lib/onboarding';

const STEPS: { title: string; body: string; highlight: string; navigateTo?: string }[] = [
  {
    title: 'Sidebar navigation',
    body: 'Use the rail on the left to move between areas. Collapse it on desktop to save space; on mobile, open it from the menu icon.',
    highlight: 'Workspace, Machines, Workflows, and Pair Device are the core tabs.',
    navigateTo: '/workspace',
  },
  {
    title: 'Start a session',
    body: 'Click New Session to open a chat tied to a running cloud machine or a paired desktop. The agent sees the remote screen and can act or answer in Ask mode.',
    highlight: 'Tip: start a VM under Machines first, or pair your desktop from Pair Device.',
    navigateTo: '/machines',
  },
  {
    title: 'Workspace home',
    body: 'The home grid is your launch pad: new session, machines, pairing, and settings. Use it when you are not inside a chat.',
    highlight: 'Initiate Protocol starts a fresh AI session.',
    navigateTo: '/workspace',
  },
  {
    title: 'Machines',
    body: 'Create and start cloud desktops here. When a machine is online, stats update every few seconds while it runs.',
    highlight: 'Connect jumps into a chat already linked to that VM.',
    navigateTo: '/machines',
  },
  {
    title: 'Act vs Ask',
    body: 'In the chat composer, toggle Act to drive the UI, or Ask for explanations only. Act runs real clicks and keys—verify important steps.',
    highlight: 'Look for the pointer icon (Act) and question bubble (Ask).',
    navigateTo: undefined,
  },
];

export function WorkspaceTour({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!userId) return;
    try {
      const fromOnboarding = sessionStorage.getItem(WORKSPACE_TOUR_SESSION_KEY) === '1';
      if (fromOnboarding) {
        sessionStorage.removeItem(WORKSPACE_TOUR_SESSION_KEY);
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [userId]);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(workspaceTourDoneKey(userId), '1');
    } catch {
      /* ignore */
    }
  }, [userId]);

  const handleNext = () => {
    const nextStep = step + 1;
    if (nextStep < STEPS.length) {
      if (step === STEPS.length - 2 && STEPS[step + 1].navigateTo) {
        router.push(STEPS[step + 1].navigateTo!);
      }
      setStep(nextStep);
    }
  };

  const skip = () => close();

  if (!open) return null;

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ws-tour-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
            Step {step + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={skip}
            className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-foreground flex items-center gap-1"
          >
            Skip tour
            <X size={14} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div
            className="mb-5 rounded-xl border border-border bg-secondary/50 p-3 flex gap-2"
            aria-hidden
          >
            <div className="w-14 shrink-0 rounded-lg bg-background border border-border flex flex-col py-2 px-1.5 gap-1.5">
              <div className="h-2 w-full rounded bg-accent-primary/30" />
              <div className="h-1.5 w-3/4 rounded bg-border" />
              <div className="h-1.5 w-full rounded bg-border" />
              <div className="h-1.5 w-5/6 rounded bg-border" />
            </div>
            <div className="flex-1 rounded-lg border border-dashed border-border bg-background/50 min-h-[88px] flex items-center justify-center text-[9px] font-bold text-text-muted uppercase tracking-wider text-center px-2">
              Main area — chat, workspace, or machines
            </div>
          </div>

          <h3 id="ws-tour-title" className="text-lg font-black text-foreground tracking-tight">
            {s.title}
          </h3>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">{s.body}</p>
          <p className="mt-3 text-xs text-accent-primary font-medium leading-relaxed border-l-2 border-accent-primary pl-3">
            {s.highlight}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border bg-secondary/30">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((i) => Math.max(0, i - 1))}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          {last ? (
            <button
              type="button"
              onClick={close}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-foreground text-background text-[10px] font-black uppercase tracking-widest"
            >
              Next
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
