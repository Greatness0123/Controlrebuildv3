"use client";

import { useEffect, useState } from 'react';
import { vmApi, pairApi } from '@/lib/api';
import { useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import VMCard from '@/components/VMCard';
import { useModal } from '@/lib/useModal';
import { Cpu, Loader2, AlertCircle, RefreshCw, Monitor, Link as LinkIcon, Plus } from 'lucide-react';
import Link from 'next/link';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function MachinesPage() {
  const { user } = useAuthStore();
  const { vms, setVMs } = useVMStore();
  const { devices, setDevices } = useDeviceStore();
  const { modal, alert, prompt } = useModal();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [vmRes, pairRes] = await Promise.all([
        vmApi.list().catch(() => ({ vms: [] })),
        pairApi.devices().catch(() => ({ devices: [] })),
      ]);
      setVMs(vmRes.vms);
      setDevices(pairRes.devices);
    } catch (err: any) {
      setError(err.message || 'Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const getPlanLimits = () => {
    const plan = user?.user_metadata?.plan?.toLowerCase() || 'free';
    if (plan === 'master') return 10;
    if (plan === 'pro') return 5;
    return 1;
  };

  const pairedDevices = devices.filter(d => d.status === 'paired');

  return (
    <>
      {modal}
      <div className="flex-1 flex flex-col min-h-0 bg-background">

        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border shrink-0 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shrink-0">
              <Cpu size={16} className="text-purple-400" />
            </div>
            <h1 className="text-sm font-black tracking-tight text-foreground">Machines</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-card border border-border rounded-xl text-text-muted hover:text-foreground transition-all shrink-0"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-accent-primary text-accent-foreground rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg shrink-0 min-w-[40px] justify-center"
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />}
              <span className="hidden sm:inline">New Machine</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-12">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">VM Utilization</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-foreground">{vms.length} / {getPlanLimits()}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Active Instances</span>
                  </div>
                  <div className="mt-4 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-primary transition-all duration-1000"
                      style={{ width: `${Math.min(100, (vms.length / getPlanLimits()) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Remote Bridges</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-foreground">{pairedDevices.length}</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Paired Devices</span>
                  </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Current Plan</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-foreground uppercase tracking-tight">{user?.user_metadata?.plan || 'Free'}</span>
                    <Link href="/pricing" className="text-[10px] text-accent-primary font-black uppercase tracking-widest hover:opacity-80 transition-all">Upgrade</Link>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-40 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
              </div>
            ) : (
              <>

                <section>
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-text-muted" />
                      <h2 className="text-[11px] font-black text-text-muted uppercase tracking-widest">Virtual Machines</h2>
                    </div>
                  </div>
                  {vms.length === 0 ? (
                    <div className="p-12 flex flex-col items-center text-center border border-dashed border-border rounded-3xl bg-card">
                      <Cpu size={32} className="text-text-muted mb-4 opacity-20" />
                      <h3 className="text-sm font-bold mb-1">No Virtual Machines</h3>
                      <p className="text-[10px] text-text-secondary max-w-[240px] mb-6">Spin up an isolated cloud environment to run your AI agents.</p>
                      <button onClick={handleCreate} className="px-6 py-2 bg-accent-primary text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all">
                        Create Machine
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vms.map((vm) => (
                        <VMCard key={vm.id} vm={vm} />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-6 px-1 pt-6 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-text-muted" />
                      <h2 className="text-[11px] font-black text-text-muted uppercase tracking-widest">Remote Machines</h2>
                    </div>
                  </div>
                  {pairedDevices.length === 0 ? (
                    <div className="p-12 flex flex-col items-center text-center border border-dashed border-border rounded-3xl bg-card">
                      <LinkIcon size={32} className="text-text-muted mb-4 opacity-20" />
                      <h3 className="text-sm font-bold mb-1">No Paired Devices</h3>
                      <p className="text-[10px] text-text-secondary max-w-[240px] mb-6">Pair your local computer to control it remotely with the AI.</p>
                      <Link href="/pair" className="px-6 py-2 bg-accent-primary text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all">
                        Pair a Device
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pairedDevices.map((device) => (
                        <div key={device.id} className="glass-card p-6 group">
                          <div className="flex items-start justify-between mb-6">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                              <Monitor size={18} className="text-blue-500" />
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-card rounded-full border border-border">
                              <div className="w-1 h-1 rounded-full bg-blue-500" />
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Remote</span>
                            </div>
                          </div>
                          <div className="space-y-1 mb-6">
                            <h3 className="text-sm font-bold group-hover:text-blue-400 transition-colors">{device.name}</h3>
                            <p className="text-[10px] text-text-muted font-medium font-mono uppercase tracking-tighter opacity-60">
                              {device.status.toUpperCase()} • ID: {device.id.split('-')[0]}
                            </p>
                          </div>
                          <Link
                            href={`/remote/${device.id}`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-card-hover transition-all text-foreground"
                          >
                            Access Console
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>

        {/* <div className="px-8 py-3 border-t border-border bg-secondary/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Network Active</span>
            </div>
            <div>{vms.length} / {getPlanLimits()} VM UTILIZATION • {pairedDevices.length} REMOTE INSTANCES</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="opacity-50">Local Docker Engine V24.0.0</span>
          </div>
        </div> */}
      </div>
    </>
  );
}
