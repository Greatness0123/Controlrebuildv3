"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { 
  Cpu, MessageSquare, Plus, Monitor, Zap, ArrowRight, Loader2, Settings, Server, Activity
} from 'lucide-react';

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
    return 1; 
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

  const handleStartSession = async (vmId?: string, deviceId?: string) => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const targetVm = vmId || vms.find(v => v.status === 'running')?.id;
      const targetDevice = deviceId || devices.find(d => d.status === 'paired')?.id;
      
      const res = await chatApi.create(targetVm, targetDevice);
      setSessions([res.session, ...sessions]);

      const query = (vmId || deviceId) ? '?monitor=true' : '';
      router.push(`/c/${res.session.id}${query}`);
    } catch (err: any) {
      alert((err.message || "Failed to start session."), { title: 'Session Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const activeVms = vms.filter(v => v.status === 'running');
  const activeDevices = devices.filter(d => d.status === 'paired');

  return (
    <>
      {modal}
      <div className="flex-1 overflow-y-auto w-full relative bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(var(--border-primary)_1px,transparent_1px),linear-gradient(90deg,var(--border-primary)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto p-6 sm:p-10 lg:p-12 relative z-10 w-full">

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20 border-l border-border pl-8 py-2">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-text-muted mb-4">
                <Activity size={12} /> <span className="hidden sm:inline">Operational Overview</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-light tracking-tight mb-4 text-foreground leading-[1.1]">
                {greeting()}, <br/><span className="font-black bg-gradient-to-r from-foreground via-text-secondary to-text-muted bg-clip-text text-transparent">
                  {user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer'}.
                </span>
              </h1>
              <p className="text-text-muted text-sm max-w-sm font-medium leading-relaxed hidden sm:block">
                Connect your AI agents to distributed compute resources across cloud and physical instances.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {(user?.user_metadata?.plan?.toLowerCase() || 'free') === 'free' && (
                <Link
                  href="/pricing"
                  className="px-6 py-4 bg-blue-600/10 border border-blue-600/20 text-blue-500 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-xl hidden sm:block"
                >
                  Upgrade
                </Link>
              )}
              <button
                onClick={() => handleStartSession()}
                disabled={isCreatingChat}
                className="group relative px-6 py-4 sm:px-8 bg-accent-primary text-accent-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl hover:opacity-90 disabled:opacity-50 min-w-14"
              >
                {isCreatingChat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span className="hidden sm:inline whitespace-nowrap">{isCreatingChat ? 'Syncing...' : 'Quick Start'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-24">
            <ActionCard 
              onClick={() => handleStartSession()}
              disabled={isCreatingChat}
              icon={<Zap size={18} />}
              title="Autonomous Agent"
              description="Deploy a task-oriented agent to your primary active resource."
              active
            />
            
            <LinkActionCard 
              href="/machines"
              icon={<Server size={18} />}
              title="Infrastructure"
              description="Manage virtual instances and monitor cloud compute state."
            />

            <LinkActionCard 
              href="/pair"
              icon={<Monitor size={18} />}
              title="Physical Bridges"
              description="Pair your local hardware for remote AI execution."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 border-t border-border">
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Activity size={13} className="text-text-muted" />
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Telemetry</h3>
                </div>
                <div className="bg-card border border-border p-8 rounded-3xl space-y-6">
                  <StatusMetric label="Elastic Instances" count={activeVms.length} total={getPlanLimits()} />
                  <StatusMetric label="Remote Bridges" count={activeDevices.length} total={devices.length} />
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-foreground uppercase tracking-widest">System Nominal</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-medium leading-relaxed">
                      All connection tunnels are authenticated and encrypted. Bridge latency: 42ms.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare size={13} className="text-text-muted" />
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Temporal Log</h3>
                </div>
                <Link href="#" className="text-[9px] font-black text-text-muted hover:text-foreground transition-colors uppercase tracking-widest">View Archives</Link>
              </div>

              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessions.slice(0, 4).map(session => (
                    <Link
                      key={session.id}
                      href={`/c/${session.id}`}
                      className="group p-5 bg-card hover:bg-card-hover border border-border hover:border-border rounded-2xl transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                          <MessageSquare size={14} className="text-text-muted group-hover:text-foreground transition-all" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-text-secondary group-hover:text-foreground truncate mb-0.5">{session.title || 'Active Session'}</h4>
                          <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Instance: {session.vm_id ? 'Cloud' : 'Physical'}</p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-40 bg-secondary border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">No session history detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActionCard({ onClick, disabled, icon, title, description, active }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-8 text-left group transition-all border rounded-2xl flex flex-col min-h-[220px]",
        active ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-card text-foreground border-border hover:border-border",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-6",
          active ? "bg-accent-foreground text-accent-primary" : "bg-secondary text-foreground border border-border"
      )}>
        {icon}
      </div>
      <h3 className="text-sm font-black mb-3 uppercase tracking-tight">{title}</h3>
      <p className={cn("text-[11px] leading-relaxed flex-1 font-medium", active ? "opacity-70" : "text-text-muted")}>{description}</p>
    </button>
  );
}

function LinkActionCard({ href, icon, title, description }: any) {
  return (
    <Link
      href={href}
      className="p-8 text-left group transition-all border border-border hover:border-border rounded-2xl flex flex-col min-h-[220px] bg-card text-foreground"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-6 bg-secondary border border-border text-text-muted group-hover:text-foreground transition-all">
        {icon}
      </div>
      <h3 className="text-sm font-black mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-[11px] text-text-muted leading-relaxed font-medium flex-1">{description}</p>
    </Link>
  );
}

function StatusMetric({ label, count, total }: any) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0">
      <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-foreground">{count}</span>
        <span className="text-[9px] text-text-muted font-bold">/ {total}</span>
      </div>
    </div>
  );
}
