"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Activity,
  Command,
  Sparkles,
  Zap,
  Cloud,
  Bot,
  Terminal,
  Layers,
} from 'lucide-react';
import { WorkspaceNavHints } from '@/components/workspace/WorkspaceNavHints';
import { motion } from 'framer-motion';

const floaters = [
  { Icon: Sparkles, className: 'left-[4%] top-[8%] text-amber-500/35', delay: 0, dur: 5 },
  { Icon: Zap, className: 'right-[6%] top-[18%] text-yellow-400/30', delay: 0.4, dur: 4.5 },
  { Icon: Cloud, className: 'left-[10%] bottom-[12%] text-sky-400/25', delay: 0.8, dur: 6 },
  { Icon: Bot, className: 'right-[12%] bottom-[20%] text-violet-400/30', delay: 0.2, dur: 5.5 },
  { Icon: Terminal, className: 'left-[18%] top-[42%] text-emerald-500/25', delay: 1.1, dur: 4.8 },
  { Icon: Layers, className: 'right-[20%] top-[38%] text-rose-400/22', delay: 0.6, dur: 5.2 },
  { Icon: Cpu, className: 'left-1/2 -translate-x-1/2 top-[2%] text-accent-primary/15 w-16 h-16', delay: 0, dur: 7 },
];

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
          <section className="relative text-center mb-12 sm:mb-14 min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center">
            <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
              {floaters.map(({ Icon, className, delay, dur }, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${className}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: 1,
                    y: [0, -10, 0],
                    rotate: [0, i % 2 === 0 ? 4 : -4, 0],
                  }}
                  transition={{
                    opacity: { duration: 0.6, delay: delay * 0.5 },
                    y: { duration: dur, repeat: Infinity, ease: 'easeInOut', delay },
                    rotate: { duration: dur * 1.2, repeat: Infinity, ease: 'easeInOut', delay },
                  }}
                >
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.25} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 relative z-[1]"
            >
              <Activity size={10} className="text-accent-primary" /> Station: Secure Connection
            </motion.div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-3 leading-tight uppercase relative z-[1]">
              {greeting()},
              <br />
              <span className="font-walter normal-case text-4xl sm:text-5xl md:text-6xl text-foreground block mt-2 tracking-normal">
                {displayName}.
              </span>
            </h1>
            <p className="text-text-secondary text-sm font-medium max-w-md mx-auto leading-relaxed relative z-[1]">
              Your orchestration hub: sessions, machines, paired devices, and settings — in one place.
            </p>
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

          <footer className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 opacity-50">
            <div className="flex items-center gap-3">
              <Command size={14} className="text-text-muted" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">OS Build: Control-X v2.4</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">Station Active</p>
          </footer>
        </div>
      </div>
    </>
  );
}
