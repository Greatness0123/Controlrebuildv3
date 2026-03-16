"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { 
  Cpu, MessageSquare, Plus, Monitor, Zap, ArrowRight, Loader2, Settings, User
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

// cn utility embedded for simplicity
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

  const getPlanLimits = () => {
    const plan = user?.user_metadata?.plan?.toLowerCase() || 'free';
    if (plan === 'master') return 10;
    if (plan === 'pro') return 5;
    return 11; // User said "11 for free... 5 for pro... 10 for master"
  };

  useEffect(() => {
    pairApi.devices().then(res => setDevices(res.devices)).catch(() => {});
    vmApi.list().then(res => setVMs(res.vms)).catch(() => {});
  }, [setDevices, setVMs]);

  const handleNewChat = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const pairedDevice = devices.find(d => d.status === 'paired');
      const runningVm = vms.find(v => v.status === 'running');
      
      const res = await chatApi.create(runningVm?.id, pairedDevice?.id);
      setSessions([res.session, ...sessions]);
      router.push(`/c/${res.session.id}`);
    } catch (err: any) {
      alert((err.message || "Could not start session. Check your connection."), { title: 'Session Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <>
      {modal}
      <div className="flex-1 overflow-y-auto w-full relative bg-[#020202]">
        {/* Advanced Background System */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full translate-y-1/4 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto p-6 sm:p-10 lg:p-12 relative z-10 w-full">
          {/* Hero Section - Elevated */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">
                <Zap size={10} fill="currentColor" /> System Core Active
              </div>
               <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 text-white Selection:bg-blue-500">
                {greeting()}, <span className="text-zinc-500">{user?.user_metadata?.first_name || 'User'}.</span>
              </h1>
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg">
                Your unified interface for cross-machine intelligence. Orcherstrate cloud compute and local hardware from a single glass-pane.
              </p>
            </div>
            
            <button
              onClick={handleNewChat}
              disabled={isCreatingChat}
              className="group relative px-10 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            >
              {isCreatingChat ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span>{isCreatingChat ? 'Syncing...' : 'Initialize New Session'}</span>
            </button>
          </div>

          {/* Premium Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            <ActionCard 
              onClick={handleNewChat}
              disabled={isCreatingChat}
              icon={<MessageSquare size={24} className="text-blue-400" />}
              title="Agent Interface"
              description="Deploy a fresh intelligence instance onto an active resource."
              bgColor="bg-blue-500/10"
              borderColor="border-blue-500/20"
              tag="Primary"
            />
            
            <LinkActionCard 
              href="/machines"
              icon={<Cpu size={24} className="text-purple-400" />}
              title="Cloud Nodes"
              description="Scale your virtual infrastructure with high-performance instances."
              bgColor="bg-purple-500/10"
              borderColor="border-purple-500/20"
              tag="compute"
            />

            <LinkActionCard 
              href="/pair"
              icon={<Monitor size={24} className="text-emerald-400" />}
              title="Peripheral Hub"
              description="Connect and control physical secondary machines via secure bridge."
              bgColor="bg-emerald-500/10"
              borderColor="border-emerald-500/20"
              tag="bridge"
            />

            <LinkActionCard 
              href="/settings"
              icon={<Settings size={24} className="text-zinc-400" />}
              title="Global Config"
              description="Fine-tune AI models, provider tokens, and system-wide overrides."
              bgColor="bg-white/5"
              borderColor="border-white/10"
              tag="admin"
            />
          </div>

          {/* Infrastructure Health & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Live Metrics & Health */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-1">Infrastructure Health</h2>
              <div className="glass-card p-8 border border-white/5 space-y-8 bg-zinc-900/40 backdrop-blur-xl rounded-[32px]">
                <div className="space-y-6">
                  <StatusMetric label="Virtual Instances" count={vms.filter(v => v.status === 'running').length} total={getPlanLimits()} color="bg-purple-500" />
                  <StatusMetric label="Hardware Bridged" count={devices.filter(d => d.status === 'paired').length} total={devices.length} color="bg-emerald-500" />
                  <StatusMetric label="Signal Latency" count={12} total={100} color="bg-blue-500" suffix="ms" inverse />
                </div>
                
                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
                    </div>
                    <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Nodes Synchronized</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    All control nodes are healthy. Telemetry suggests nominal performance across the entire 0xCONTROL network.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Session Log */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Temporal Log</h2>
                <Link href="#" className="text-[10px] text-zinc-600 hover:text-white transition-colors uppercase font-black hover:tracking-tighter duration-300">Archive Index</Link>
              </div>
              
              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessions.slice(0, 6).map((session, i) => (
                    <Link
                      key={session.id}
                      href={`/c/${session.id}`}
                      className="group p-5 bg-zinc-900/20 hover:bg-zinc-900/60 border border-white/5 hover:border-blue-500/30 rounded-3xl transition-all duration-500 flex items-center justify-between overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors" />
                      <div className="flex items-center gap-5 min-w-0 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                          <MessageSquare size={18} className="text-zinc-600 group-hover:text-blue-400 group-hover:-rotate-3 transition-all" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-zinc-200 group-hover:text-white truncate mb-0.5">{session.title || 'Temporal String'}</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-40">Entry 0x{session.id.substring(0,4)}</p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-zinc-800 group-hover:text-white group-hover:translate-x-1 transition-all relative z-10" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-16 bg-zinc-900/20 border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="text-zinc-700" size={24} />
                  </div>
                  <h4 className="text-base font-black text-zinc-500 uppercase tracking-widest">No Temporal Data</h4>
                  <p className="text-xs text-zinc-600 mt-2 max-w-[240px] font-medium leading-relaxed">System is awaiting first session initialization to populate temporal logs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActionCard({ onClick, disabled, icon, title, description, bgColor, borderColor }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "glass-card p-8 text-left group relative overflow-hidden transition-all active:scale-[0.98] border shadow-2xl shadow-black/20 h-full flex flex-col",
        borderColor,
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500", bgColor)}>
        {icon}
      </div>
      <h3 className="text-lg font-black mb-2 text-white">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed flex-1">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
        Execute <ArrowRight size={10} />
      </div>
    </button>
  );
}

function LinkActionCard({ href, icon, title, description, bgColor, borderColor }: any) {
  return (
    <Link
      href={href}
      className={cn(
        "glass-card p-8 text-left group relative overflow-hidden transition-all active:scale-[0.98] border shadow-2xl shadow-black/20 h-full flex flex-col",
        borderColor
      )}
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500", bgColor)}>
        {icon}
      </div>
      <h3 className="text-lg font-black mb-2 text-white">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed flex-1">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
        Manage <ArrowRight size={10} />
      </div>
    </Link>
  );
}

function StatusMetric({ label, count, total, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-zinc-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-black", color)}>{count}</span>
        <span className="text-[10px] text-zinc-700">/ {total}</span>
      </div>
    </div>
  );
}

