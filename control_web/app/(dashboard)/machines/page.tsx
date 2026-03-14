"use client";

import { useEffect, useState } from 'react';
import { vmApi } from '@/lib/api';
import { useVMStore } from '@/lib/store';
import VMCard from '@/components/VMCard';
import { useModal } from '@/lib/useModal';
import { Plus, Cpu, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function MachinesPage() {
  const { vms, setVMs } = useVMStore();
  const { modal, alert, prompt } = useModal();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadVMs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vmApi.list();
      setVMs(res.vms);
    } catch (err: any) {
      setError(err.message || 'Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVMs();
  }, []);

  const handleCreate = async () => {
    const name = await prompt('Enter a name for your new machine:', 'Ubuntu Desktop', { title: 'Create New Machine' });
    if (!name) return;

    setCreating(true);
    try {
      const res = await vmApi.create(name);
      setVMs([...vms, res.vm]);
    } catch (err: any) {
      alert(err.message || 'Failed to create machine', { title: 'Error', variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {modal}
      <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Header */}
      <header className="min-h-16 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-3 sm:py-0 border-b border-white/5 gap-3 sm:gap-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Cpu size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Virtual Machines</h1>
            <p className="text-[11px] text-zinc-500 font-medium">Manage your isolated computer instances</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadVMs}
            className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-zinc-500 hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-lg shadow-white/10"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create Machine
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
          </div>
        ) : vms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6">
              <Cpu size={40} className="text-zinc-700" />
            </div>
            <h2 className="text-xl font-bold mb-2">No machines found</h2>
            <p className="text-zinc-500 text-sm max-w-xs mb-8">Create your first virtual machine to start using AI agents on a desktop environment.</p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-screen-2xl mx-auto">
            {vms.map((vm) => (
              <VMCard key={vm.id} vm={vm} />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-8 py-4 border-t border-white/5 bg-zinc-950/50 flex items-center justify-between text-[11px] text-zinc-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span>Docker Engine Connected</span>
          </div>
          <div>{vms.length} / 5 Machines used</div>
        </div>
        <Link href="/settings" className="hover:text-white transition-colors">View Plan Usage</Link>
      </div>
    </div>
    </>
  );
}
