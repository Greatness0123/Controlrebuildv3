"use client";

import { useState, useEffect } from 'react';
import { vmApi, chatApi } from '@/lib/api';
import { useVMStore, useChatStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { Cpu, Play, Square, Trash2, Globe, Loader2, Monitor, ExternalLink, Activity, HardDrive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function VMCard({ vm }: { vm: any }) {
  const { modal, alert, confirm } = useModal();
  const { updateVM, destroyVM } = useVMStore((state: any) => ({
    updateVM: state.updateVM,
    destroyVM: (id: string) => state.setVMs(state.vms.filter((v: any) => v.id !== id))
  }));
  const { sessions, setSessions } = useChatStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (vm.status !== 'running') {
      setStats(null);
      return;
    }
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await vmApi.stats(vm.id);
        if (!cancelled) setStats(res.stats);
      } catch {
        if (!cancelled) setStats(null);
      }
    };
    pull();
    const interval = setInterval(pull, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [vm.id, vm.status]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await vmApi.start(vm.id);
      updateVM(vm.id, res.vm);
    } catch (err: any) {
      alert(err.message || 'Failed to start machine', { title: 'Start Failed', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await vmApi.stop(vm.id);
      updateVM(vm.id, res.vm);
    } catch (err: any) {
      alert(err.message || 'Failed to stop machine', { title: 'Stop Failed', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      if (vm.status !== 'running') {
        const res = await vmApi.start(vm.id);
        updateVM(vm.id, res.vm);
      }

      let session = (sessions as any[]).find(s => s.vm_id === vm.id);
      if (!session) {
        const res = await chatApi.create(vm.id);
        session = res.session;
        if (session) {
          setSessions([session, ...sessions]);
        }
      }

      if (session?.id) {
        router.push(`/c/${session.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect to machine', { title: 'Connection Alert', variant: 'error' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm(
      'This will permanently destroy the machine and all its data. This action cannot be undone.',
      { title: `Destroy "${vm.name}"?`, confirmLabel: 'Destroy', cancelLabel: 'Keep it' }
    );
    if (!ok) return;
    setLoading(true);
    try {
      await vmApi.destroy(vm.id);
      destroyVM(vm.id);
    } catch (err: any) {
      alert(err.message || 'Failed to destroy machine', { title: 'Destroy Failed', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const memLimit = Number(stats?.memory_limit) || 0;
  const memUsed = Number(stats?.memory) || 0;
  const memoryUsagePercent =
    memLimit > 0 ? Math.min(100, Math.max(0, (memUsed / memLimit) * 100)) : 0;

  const storLimit = Number(stats?.storage_limit) || 0;
  const storUsed = Number(stats?.storage_used) || 0;
  const storageUsagePercent =
    storLimit > 0 ? Math.min(100, Math.max(0, (storUsed / storLimit) * 100)) : 0;

  const cpuPct = Math.min(100, Math.max(0, Number(stats?.cpu) || 0));
  const memLabel =
    memUsed > 0 ? `${memUsed.toFixed(0)}MB` : vm.status === 'running' ? '—' : '—';
  const memLimitLabel = memLimit > 0 ? `${memLimit.toFixed(0)}MB cap` : '';

  return (
    <>
      {modal}
      <div className="bg-card border border-border rounded-[24px] overflow-hidden flex flex-col group transition-all duration-300 hover:border-accent-primary/30 hover:bg-card-hover backdrop-blur-sm">

        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500",
              vm.status === 'running' 
                ? "bg-accent-primary text-accent-foreground border-accent-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                : "bg-secondary text-text-muted border-border"
            )}>
              {vm.status === 'running' ? <Activity size={16} className="animate-pulse" /> : <Monitor size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{vm.name}</h3>
            </div>
          </div>
            <div className="flex items-center gap-2">
             {vm.instance_url && (
                <a 
                    href={vm.instance_url.includes('/vnc.html') ? vm.instance_url : `${vm.instance_url.endsWith('/') ? vm.instance_url : vm.instance_url + '/'}vnc.html?resize=scale&autoconnect=true`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="md:hidden p-2 bg-secondary border border-border rounded-lg text-text-muted hover:text-foreground transition-all"
                    title="Open External Monitor"
                >
                    <ExternalLink size={12} />
                </a>
            )}
            <div className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border transition-all",
                vm.status === 'running' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-card border-border text-text-muted"
            )}>
                {vm.status === 'running' ? 'Online' : vm.status === 'stopped' ? 'Offline' : vm.status}
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Cpu size={10} /> CPU
                </span>
                <span className="text-[9px] font-mono text-text-secondary">
                  {vm.status === 'running' ? `${cpuPct.toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-700 ease-out"
                  style={{ width: vm.status === 'running' ? `${cpuPct}%` : '0%' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={10} /> Memory
                </span>
                <span className="text-[9px] font-mono text-text-secondary text-right leading-tight max-w-[120px] truncate" title={memLimitLabel}>
                  {vm.status !== 'running' ? '—' : memLimit > 0 ? `${memLabel} / ${memLimit.toFixed(0)}MB` : memLabel}
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-text-muted transition-all duration-700 ease-out"
                  style={{ width: vm.status === 'running' && memLimit > 0 ? `${memoryUsagePercent}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[8px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <HardDrive size={10} /> Storage
                </span>
                <span className="text-[9px] font-mono text-text-secondary">
                  {vm.status !== 'running' || storLimit <= 0
                    ? '—'
                    : `${storUsed.toFixed(1)}GB / ${storLimit.toFixed(1)}GB`}
                </span>
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-text-secondary transition-all duration-700 ease-out"
                  style={{ width: vm.status === 'running' && storLimit > 0 ? `${storageUsagePercent}%` : '0%' }}
                />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-widest truncate max-w-[150px]">
                <Globe size={10} />
                <span className="truncate">{vm.instance_url || 'Internal Mesh Only'}</span>
            </div>
            {vm.instance_url && (
                <button 
                  onClick={() => window.open(vm.instance_url, '_blank')}
                  className="text-[8px] font-black text-text-muted hover:text-foreground transition-all uppercase tracking-widest"
                >
                    Registry Link
                </button>
            )}
          </div>
        </div>

        <div className="p-2 pb-2 px-2">
            <div className="bg-secondary rounded-[20px] p-1 flex items-center gap-1 border border-border">
                {vm.status === 'stopped' ? (
                    <button
                        onClick={handleStart}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-primary text-accent-foreground text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                        <span>Start Machine</span>
                    </button>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={connecting || loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-primary text-accent-foreground text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg"
                    >
                        {connecting ? <Loader2 size={12} className="animate-spin" /> : <Monitor size={12} />}
                        <span className="hidden sm:inline">Connect</span>
                    </button>
                )}
                
                <div className="flex items-center pr-1">
                    {vm.status === 'running' && (
                        <button
                            onClick={handleStop}
                            disabled={loading}
                            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-foreground transition-all disabled:opacity-50"
                            title="Shut Down"
                        >
                            <Square size={12} fill="currentColor" />
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-red-500 transition-all disabled:opacity-50"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
