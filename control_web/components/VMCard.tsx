"use client";

import { useState, useEffect } from 'react';
import { vmApi, chatApi } from '@/lib/api';
import { useVMStore, useChatStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { Cpu, Play, Square, Trash2, Globe, Loader2, Monitor, ExternalLink } from 'lucide-react';
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
    if (vm.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const res = await vmApi.stats(vm.id);
          setStats(res.stats);
        } catch {}
      }, 5000);
      return () => clearInterval(interval);
    }
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
      // 1. Ensure VM is running
      if (vm.status !== 'running') {
        const res = await vmApi.start(vm.id);
        updateVM(vm.id, res.vm);
      }

      // 2. Find existing session for this VM or create new one
      let session = (sessions as any[]).find(s => s.vm_id === vm.id);
      if (!session) {
        const res = await chatApi.create(vm.id);
        session = res.session;
        if (session) {
          setSessions([session, ...sessions]);
        }
      }

      // 3. Redirect
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

  return (
    <>
      {modal}
      <div className="glass-card overflow-hidden flex flex-col group transition-all duration-300 hover:border-white/10">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border",
              vm.status === 'running' ? "bg-green-500/10 border-green-500/20" : "bg-zinc-500/10 border-zinc-500/20"
            )}>
              <Cpu size={16} className={vm.status === 'running' ? "text-green-400" : "text-zinc-500"} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{vm.name}</h3>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{vm.os_type || 'Ubuntu 22.04'}</p>
            </div>
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            vm.status === 'running' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
          )}>
            {vm.status}
          </div>
          {vm.instance_url && (
            <a 
              href={vm.instance_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="md:hidden p-2 bg-white/5 border border-white/10 rounded-lg text-blue-400"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 space-y-4">
          {/* Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  <span>CPU Core</span>
                  <span className="text-zinc-400">{stats?.cpu || 0}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                    style={{ width: `${stats?.cpu || 0}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  <span>Memory</span>
                  <span className="text-zinc-400">{stats?.memory ? `${(stats.memory / 1024).toFixed(1)}GB` : '0GB'}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: stats ? `${(stats.memory / stats.memory_limit) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                <span>Storage Allocation</span>
                <span className="text-zinc-400">{stats?.storage_used || '4.2'}GB / {stats?.storage_limit || '20'}GB</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                  style={{ width: '21%' }} // Simulated if not in stats
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Globe size={12} />
            <span className="truncate">{vm.instance_url || 'No public URL'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 bg-white/[0.01] border-t border-white/5 flex items-center gap-2">
          {vm.status === 'stopped' && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-white text-black text-[11px] font-bold rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              Start Machine
            </button>
          )}
          {vm.status === 'running' && (
            <button
              onClick={handleConnect}
              disabled={connecting || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <Monitor size={14} />}
              Connect
            </button>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {vm.status === 'running' && vm.instance_url && (
              <a
                href={vm.instance_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                title="Direct View"
              >
                <Globe size={14} />
              </a>
            )}
            {vm.status === 'running' && (
              <button
                onClick={handleStop}
                disabled={loading}
                className="w-10 h-10 flex items-center justify-center border border-white/5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                title="Stop Machine"
              >
                <Square size={14} fill="currentColor" />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center border border-white/5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
              title="Destroy"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
