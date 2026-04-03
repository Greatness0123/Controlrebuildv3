"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { 
  Plus, Monitor, Zap, Loader2, Settings, Server, LayoutDashboard, Cpu, LinkIcon, ArrowRight, Activity, Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
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
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
      const runningVm = vms.find(v => v.status === 'running')?.id;
      const pairedDevice = devices.find(d => d.status === 'paired')?.id;
      
      const res = await chatApi.create(runningVm, pairedDevice);
      setSessions([res.session, ...sessions]);
      router.push(`/c/${res.session.id}`);
    } catch (err: any) {
      alert((err.message || "Failed to start session."), { title: 'Session Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <>
      {modal}
      <div className="flex-1 overflow-y-auto w-full relative bg-background text-foreground selection:bg-accent-primary selection:text-white font-sans">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto p-6 sm:p-12 relative z-10">


          <header className="mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6"
            >
               <Activity size={10} className="text-accent-primary" /> Station: Secure Connection
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-none uppercase">
              {greeting()}, <br /> <span className="text-text-muted transition-colors">{user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer'}.</span>
            </h1>
            <p className="text-text-secondary text-base font-medium max-w-xl leading-relaxed">
              Your orchestration dashboard. Monitor compute instances, pair local hardware, and deploy new AI agents into your unified digital environment.
            </p>
          </header>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ y: -5 }}
              onClick={handleStartSession}
              disabled={isCreatingChat}
              className="p-8 text-left bg-card border border-border rounded-3xl hover:border-accent-primary/50 transition-all group flex flex-col min-h-[220px] relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <div className="w-14 h-14 rounded-2xl bg-accent-primary text-accent-foreground flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform relative z-10 transition-colors">
                {isCreatingChat ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
              </div>
              <div className="relative z-10 flex-1">
                <h3 className="text-xl font-black mb-3 uppercase tracking-tighter text-foreground">Initiate Protocol</h3>
                <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-xs">Deploy a new AI session onto your prioritized compute resources instantly.</p>
              </div>
              <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary transition-colors relative z-10 mt-auto" />
            </motion.button>


            <Link href="/machines">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 text-left bg-card border border-border rounded-3xl transition-all group flex flex-col min-h-[220px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border text-foreground flex items-center justify-center mb-8 group-hover:bg-accent-primary group-hover:text-accent-foreground group-hover:border-accent-primary transition-all group-hover:scale-110 shadow-lg">
                  <Cpu size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black mb-3 uppercase tracking-tighter text-foreground">Machine Grid</h3>
                  <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-xs">Visualize and control your active remote and virtual machine instances.</p>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary transition-colors mt-auto" />
              </motion.div>
            </Link>

            <Link href="/pair">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 text-left bg-card border border-border rounded-3xl transition-all group flex flex-col min-h-[220px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border text-foreground flex items-center justify-center mb-8 group-hover:bg-accent-primary group-hover:text-accent-foreground group-hover:border-accent-primary transition-all group-hover:scale-110 shadow-lg">
                  <LinkIcon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black mb-3 uppercase tracking-tighter text-foreground">Device Bridge</h3>
                  <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-xs">Manage local hardware connections and authorize physical system access.</p>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary transition-colors mt-auto" />
              </motion.div>
            </Link>

            <Link href="/settings">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 text-left bg-card border border-border rounded-3xl transition-all group flex flex-col min-h-[220px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border text-foreground flex items-center justify-center mb-8 group-hover:bg-accent-primary group-hover:text-accent-foreground group-hover:border-accent-primary transition-all group-hover:scale-110 shadow-lg">
                  <Settings size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black mb-3 uppercase tracking-tighter text-foreground">System Config</h3>
                  <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-xs">Configure AI providers, API endpoints, and global orchestration logic.</p>
                </div>
                <ArrowRight size={18} className="text-text-muted group-hover:text-accent-primary transition-colors mt-auto" />
              </motion.div>
            </Link>
          </div>


          <footer className="mt-24 pt-8 border-t border-border flex items-center justify-between opacity-50">
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
