"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Monitor, Play, Square, Trash2, MoreVertical, Clock, AlertCircle,
  CheckCircle, Loader2, Globe, Terminal, MousePointer2, ScanLine,
  Cpu, MoreHorizontal, Zap, ShieldCheck, Download, RefreshCw, Plus, ArrowLeft, ArrowRight,
  Server, Link as LinkIcon, Command, Layout
} from 'lucide-react';
import { vmApi, pairApi } from '@/lib/api';
import { useAuthStore, useVMStore } from '@/lib/store';
import RemoteDesktop from '@/components/RemoteDesktop';
import ChatPanel from '@/components/ChatPanel';
import Link from 'next/link';

// cn utility embedded for simplicity
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// --------------------------------------------------------------------------------
// Status Configurations
// --------------------------------------------------------------------------------
const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  creating: { color: "blue", icon: Loader2, label: "Creating" },
  starting: { color: "blue", icon: Loader2, label: "Starting" },
  running: { color: "green", icon: CheckCircle, label: "Running" },
  stopping: { color: "yellow", icon: Loader2, label: "Stopping" },
  stopped: { color: "gray", icon: Square, label: "Stopped" },
  error: { color: "red", icon: AlertCircle, label: "Error" },
  deleting: { color: "red", icon: Loader2, label: "Deleting" },
};

// --------------------------------------------------------------------------------
// MachineCard Subcomponent
// --------------------------------------------------------------------------------
function MachineCard({ machine, onSelect, onUpdate, onDelete }: any) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const status = statusConfig[machine.status] || statusConfig.stopped;
  const StatusIcon = status.icon;
  const isTransitioning = ["creating", "starting", "stopping", "deleting"].includes(machine.status);

  const handleAction = async (action: string) => {
    setLoadingAction(action);
    try {
      if (action === 'start') {
        await vmApi.start(machine.id);
        toast.success("Machine starting...");
        onUpdate(machine.id, { status: 'starting' });
      } else if (action === 'stop') {
        await vmApi.stop(machine.id);
        toast.success("Machine stopping...");
        onUpdate(machine.id, { status: 'stopping' });
      } else if (action === 'delete') {
        await vmApi.destroy(machine.id);
        toast.success("Machine deleted");
        onDelete(machine.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className={cn(
      "relative flex flex-col overflow-hidden group transition-all duration-300 h-full rounded-xl",
      "border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/20 hover:shadow-lg",
      machine.status === "error" && "border-red-500/20 bg-red-500/[0.02]"
    )}>
      {machine.status === "running" && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      )}
      {(machine.status === "creating" || machine.status === "starting") && (
        <div className="absolute top-0 inset-x-0 h-px overflow-hidden">
          <div className="h-full w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)", animation: "slide 2s linear infinite" }} />
        </div>
      )}

      <div className="p-5 pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-base font-medium truncate pr-2 flex items-center gap-2 text-white">
              {machine.name}
              {(machine.ip || machine.instance_url) ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  <Server className="h-2.5 w-2.5" /> Cloud
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                  Local
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-500 truncate">
              {machine.ip ? `IP: ${machine.ip}` : 'Local Container'}
            </p>
          </div>
          <button onClick={() => handleAction('delete')} className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-5 pt-0 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            machine.status === "running" ? "bg-emerald-500/10 text-emerald-400" :
              machine.status === "stopped" ? "bg-white/[0.05] text-zinc-400" :
                machine.status === "error" ? "bg-red-500/10 text-red-500" :
                  "bg-blue-500/10 text-blue-400"
          )}>
            <StatusIcon className={cn("h-3 w-3", isTransitioning && "animate-spin")} />
            {status.label}
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2 pt-1">
          {(machine.status === "stopped" || machine.status === "error") && (
            <button
              onClick={() => handleAction("start")}
              disabled={loadingAction !== null}
              className="flex-1 h-9 rounded-xl font-medium bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center text-sm disabled:opacity-50"
            >
              {loadingAction === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4 mr-1.5" /> Start</>}
            </button>
          )}

          {machine.status === "running" && (
            <>
              <button
                onClick={() => onSelect(machine)}
                className="flex-1 h-9 rounded-xl font-medium bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center text-sm"
              >
                <Monitor className="h-4 w-4 mr-1.5" /> Open
              </button>
              <button
                onClick={() => handleAction("stop")}
                disabled={loadingAction !== null}
                className="h-9 w-9 p-0 rounded-xl border border-white/20 hover:bg-white/10 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {loadingAction === "stop" ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Square className="h-3.5 w-3.5 text-white" />}
              </button>
            </>
          )}

          {isTransitioning && (
            <button disabled className="flex-1 h-9 rounded-xl bg-white/5 text-zinc-400 flex items-center justify-center text-sm">
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> {status.label}...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// Main Dashboard Component
// --------------------------------------------------------------------------------
export default function Dashboard() {
  const router = useRouter();
  const { vms, setVMs, updateVM } = useVMStore();
  const { user, loading: authLoading } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const fetchMachines = async () => {
    try {
      const vmRes = await vmApi.list();
      setVMs(vmRes.vms);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Failed to load machines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMachines();
  }, [user]);

  // Handle rapid polling for state transitions
  useEffect(() => {
    const transitioning = vms.some(m => ["creating", "starting", "stopping"].includes(m.status));
    if (transitioning) {
      const interval = setInterval(fetchMachines, 3000);
      return () => clearInterval(interval);
    }
  }, [vms]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMachines();
    setRefreshing(false);
  };

  const handleCreateNew = async () => {
    setCreating(true);
    try {
      await vmApi.create(`Ubuntu-VM-${Math.floor(Math.random() * 1000)}`);
      toast.success("Creating new machine...");
      await fetchMachines();
    } catch (err: any) {
      toast.error(err.message || "Failed to create machine");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    setVMs(vms.filter(v => v.id !== id));
  };

  const handleUpdate = (id: string, data: any) => {
    updateVM(id, data);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <span className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Loading Workspace...</span>
        </div>
      </div>
    );
  }

  const runningMachines = vms.filter(m => m.status === "running").length;
  const creatingMachines = vms.filter(m => m.status === "creating").length;
  const stoppedMachines = vms.filter(m => m.status === "stopped").length;
  const totalMachines = vms.length;

  const filteredMachines = statusFilter === "all" ? vms : vms.filter(m => m.status === statusFilter);

  const statusFilters = [
    { id: "all", label: "All", count: totalMachines },
    { id: "running", label: "Running", count: runningMachines },
    { id: "creating", label: "Creating", count: creatingMachines },
    { id: "stopped", label: "Stopped", count: stoppedMachines },
  ];

  // Selected Machine View (Remote Desktop + Chat)
  if (selectedMachine) {
    return (
      <div className="h-[100dvh] bg-black text-white flex flex-col font-sans overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-black/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedMachine(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Back</span>
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2">
              <Cpu className="text-zinc-500 w-4 h-4" />
              <h1 className="text-sm font-bold tracking-tight">{selectedMachine.name}</h1>
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] uppercase font-bold tracking-widest">Running</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedMachine.instance_url && (
              <a
                href={selectedMachine.instance_url.includes('/vnc.html') ? selectedMachine.instance_url : `${selectedMachine.instance_url.endsWith('/') ? selectedMachine.instance_url : selectedMachine.instance_url + '/'}vnc.html?resize=scale&autoconnect=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                <Monitor size={12} /> Launch Monitor
              </a>
            )}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold cursor-pointer ring-2 ring-black">
              {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row min-h-0 bg-black overflow-hidden relative">
          <div className="hidden md:block flex-1 relative bg-[#0a0a0a]">
            <RemoteDesktop vmId={selectedMachine.id} noVncPort={selectedMachine.novnc_port} instanceUrl={selectedMachine.instance_url} />
          </div>
          <div className="flex-1 md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-black flex flex-col shrink-0 overflow-hidden h-full relative z-10">
            <ChatPanel sessionId={`chat-${selectedMachine.id}`} />
          </div>
        </main>
      </div>
    );
  }

  // Grid Dashboard View (Coasty Inspired)
  return (
    <div className="h-[100dvh] bg-black text-white overflow-y-auto scrollbar-invisible relative font-sans">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[30%] -right-[15%] h-[60%] w-[50%] rounded-full opacity-[0.04] blur-[120px] bg-white" />
        <div className="absolute -bottom-[20%] -left-[10%] h-[50%] w-[40%] rounded-full opacity-[0.035] blur-[100px] bg-white" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)]" style={{ backgroundSize: "80px 80px" }} />
      </div>

      <div className="container mx-auto p-4 sm:p-8 max-w-7xl space-y-6 sm:space-y-8 relative z-10 pt-14 md:pt-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shrink-0 shadow-lg">
                <Command size={20} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Virtual Machines</h1>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm mt-3 leading-relaxed">
              Manage your AI-powered desktop environments. Spin up isolated sessions and let agents handle your tasks.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>
            <Link
              href="/workspace"
              className="hidden sm:flex h-10 px-5 rounded-xl gap-2 font-bold bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all items-center justify-center text-xs sm:text-sm"
            >
              <Layout className="h-4 w-4" />
              Open Workspace
            </Link>
            <button
              onClick={handleCreateNew}
              disabled={creating}
              className="flex-1 md:flex-none h-10 px-5 rounded-xl gap-2 font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center text-xs sm:text-sm shadow-xl shadow-white/5"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              New Machine
            </button>
          </div>
        </motion.div>

        {/* Status Filters */}
        {vms.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm transition-all duration-200 flex items-center gap-2",
                  statusFilter === filter.id
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-transparent hover:border-white/10'
                )}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={cn(
                    "text-[10px] tabular-nums px-2 py-0.5 rounded-full font-bold",
                    statusFilter === filter.id ? 'bg-black/20' : 'bg-white/10'
                  )}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Machines Grid */}
        {vms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/[0.02] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/[0.015] blur-3xl" />

            <div className="relative flex flex-col items-center px-6 py-20 text-center">
              <div className="mb-10 flex items-center gap-3">
                {[Globe, Terminal, MousePointer2, ScanLine, Cpu].map((Icon, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-zinc-400">
                    <Icon className="h-5 w-5" />
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-3xl font-bold tracking-tight mb-4">True AI Agent with full computer access</h2>
                <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed mb-12">
                  Spin up an isolated virtual machine and let AI agents browse the web, run terminals, and control the desktop — hands-free.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mb-12">
                {[
                  { icon: MousePointer2, title: "Full desktop control", desc: "AI moves the mouse, types, clicks, and navigates like a real user." },
                  { icon: Zap, title: "Any task automated", desc: "Browser, terminal, and UI — all agents work together in one VM." },
                  { icon: ShieldCheck, title: "Isolated & safe", desc: "Each machine runs in its own container — your local system stays untouched." },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <motion.div key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 text-left hover:bg-white/[0.05] hover:border-white/20 transition-all">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-base font-bold mb-2 text-white">{title}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                <button onClick={handleCreateNew} disabled={creating} className="h-14 px-8 rounded-2xl gap-3 font-bold bg-white text-black hover:bg-zinc-200 transition-all flex items-center text-base disabled:opacity-50 mx-auto">
                  {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  Create your first machine
                </button>
              </motion.div>
            </div>
          </motion.div>
        ) : filteredMachines.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-20 flex flex-col items-center justify-center">
              <Monitor className="h-12 w-12 text-zinc-600 mb-6" />
              <h3 className="text-lg font-bold mb-2">No {statusFilter !== 'all' ? statusFilter : ''} machines</h3>
              <p className="text-sm text-zinc-500">
                {statusFilter === 'all' ? 'No machines found.' : `No machines are currently ${statusFilter}.`}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((machine, i) => (
              <motion.div key={machine.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                <MachineCard machine={machine} onSelect={setSelectedMachine} onUpdate={handleUpdate} onDelete={handleDelete} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
