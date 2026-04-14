"use client";

import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Workspace - Control',
  description: 'Your Control workspace. Manage AI sessions, machines, and paired devices. Start new AI automation sessions.',
  keywords: [
    'Control workspace',
    'AI dashboard',
    'computer use workspace',
    'manage AI sessions',
    'AI automation dashboard',
  ],
};
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import {
  Plus,
  Loader2,
  Settings,
  Cpu,
  LinkIcon,
  ArrowRight,
  Sparkles,
  Zap,
  Cloud,
  Bot,
  Terminal,
  Layers,
} from 'lucide-react';
import { WorkspaceNavHints } from '@/components/workspace/WorkspaceNavHints';
import { motion } from 'framer-motion';

type Floater = {
  Icon: typeof Sparkles;
  delay: number;
  dur: number;
};

const FLOAT_LEFT: Floater[] = [
  { Icon: Sparkles, delay: 0, dur: 5 },
  { Icon: Terminal, delay: 0.5, dur: 4.8 },
  { Icon: Cloud, delay: 0.9, dur: 6 },
];

const FLOAT_RIGHT: Floater[] = [
  { Icon: Zap, delay: 0.2, dur: 4.5 },
  { Icon: Bot, delay: 0.6, dur: 5.5 },
  { Icon: Layers, delay: 0.3, dur: 5.2 },
];

function FloaterStack({ items, align }: { items: Floater[]; align: 'left' | 'right' }) {
  return (
    <div
      className={`hidden sm:flex flex-col justify-center gap-10 py-6 w-16 shrink-0 ${
        align === 'left' ? 'items-end pr-2' : 'items-start pl-2'
      }`}
      aria-hidden
    >
      {items.map(({ Icon, delay, dur }, i) => (
        <motion.div
          key={`${align}-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{
            opacity: 1,
            y: [0, -8, 0],
            rotate: [0, align === 'left' ? 5 : -5, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: delay * 0.4 },
            y: { duration: dur, repeat: Infinity, ease: 'easeInOut', delay },
            rotate: { duration: dur * 1.1, repeat: Infinity, ease: 'easeInOut', delay },
          }}
        >
          <Icon
            className={`w-9 h-9 sm:w-11 sm:h-11 stroke-[1.25] ${
              align === 'left'
                ? i === 0
                  ? 'text-amber-500/45'
                  : i === 1
                    ? 'text-emerald-500/40'
                    : 'text-sky-400/35'
                : i === 0
                  ? 'text-yellow-500/40'
                  : i === 1
                    ? 'text-violet-400/40'
                    : 'text-rose-400/35'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function WorkspaceHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessions, setSessions } = useChatStore();
  const { vms, setVMs } = useVMStore();
  const { devices, setDevices } = useDeviceStore();
  const { modal, alert } = useModal();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName =
    user?.user_metadata?.first_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Explorer';

  useEffect(() => {
    const load = async () => {
      try {
        const [vmRes, devRes, chatRes] = await Promise.all([
          vmApi.list().catch(() => ({ vms: [] })),
          pairApi.devices().catch(() => ({ devices: [] })),
          chatApi.list().catch(() => ({ sessions: [] })),
        ]);
        setVMs(vmRes.vms);
        setDevices(devRes.devices);
        setSessions(chatRes.sessions);
      } catch {}
    };
    load();
  }, [setDevices, setVMs, setSessions]);

  const handleStartSession = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const runningVm = vms.find((v) => v.status === 'running')?.id;
      const pairedDevice = devices.find((d) => d.status === 'paired')?.id;

      const res = await chatApi.create(runningVm, pairedDevice);
      setSessions([res.session, ...sessions]);
      router.push(`/c/${res.session.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start session.', { title: 'Session Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const listItemClass =
    'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-card/90 backdrop-blur-sm hover:bg-card-hover hover:border-accent-primary/35 transition-all text-left group shadow-sm';

  return (
    <>
      {modal}
      {user?.id && <WorkspaceNavHints userId={user.id} />}
      <div className="flex-1 overflow-y-auto w-full relative bg-background text-foreground selection:bg-accent-primary selection:text-white font-sans">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

        <div className="max-w-lg mx-auto px-5 sm:px-8 py-10 sm:py-14 relative z-10">
          <section className="mb-12 sm:mb-14">
            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 max-w-3xl mx-auto">
              <FloaterStack items={FLOAT_LEFT} align="left" />

              <div className="flex-1 min-w-0 text-center px-2 sm:px-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mb-5"
                >
                  <Cpu className="w-10 h-10 sm:w-12 sm:h-12 text-accent-primary/25" strokeWidth={1.25} />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-tight uppercase">
                  {greeting()}, <span className="font-walter normal-case text-4xl sm:text-5xl md:text-6xl text-foreground tracking-normal">
                    {displayName}.
                  </span>
                </h1>
                <p className="text-text-secondary text-sm font-medium max-w-md mx-auto leading-relaxed">
                  Your orchestration hub: sessions, machines, paired devices, and settings — in one place.
                </p>
              </div>

              <FloaterStack items={FLOAT_RIGHT} align="right" />
            </div>
          </section>

          <nav className="flex flex-col gap-2 w-full max-w-md mx-auto" aria-label="Workspace actions">
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              onClick={handleStartSession}
              disabled={isCreatingChat}
              className={listItemClass}
            >
              <div className="w-11 h-11 rounded-xl bg-accent-primary text-accent-foreground flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                {isCreatingChat ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black uppercase tracking-tight text-foreground">New session</div>
                <div className="text-[11px] text-text-secondary font-medium mt-0.5">Start an AI session on your preferred compute</div>
              </div>
              <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary shrink-0 transition-colors" />
            </motion.button>

            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Link href="/machines" className={listItemClass}>
                <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:bg-accent-primary group-hover:text-accent-foreground group-hover:border-accent-primary transition-colors">
                  <Cpu size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black uppercase tracking-tight text-foreground">Machines</div>
                  <div className="text-[11px] text-text-secondary font-medium mt-0.5">Virtual and remote instances</div>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary shrink-0 transition-colors" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Link href="/pair" className={listItemClass}>
                <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:bg-accent-primary group-hover:text-accent-foreground group-hover:border-accent-primary transition-colors">
                  <LinkIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black uppercase tracking-tight text-foreground">Pair device</div>
                  <div className="text-[11px] text-text-secondary font-medium mt-0.5">Connect local hardware</div>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary shrink-0 transition-colors" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Link href="/settings" className={listItemClass}>
                <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:bg-accent-primary group-hover:text-accent-foreground group-hover:border-accent-primary transition-colors">
                  <Settings size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black uppercase tracking-tight text-foreground">Settings</div>
                  <div className="text-[11px] text-text-secondary font-medium mt-0.5">Providers, API keys, preferences</div>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary shrink-0 transition-colors" />
              </Link>
            </motion.div>
          </nav>
        </div>
      </div>
    </>
  );
}
