"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import ChatPanel from '@/components/ChatPanel';
import VNCViewer from '@/components/VNCViewer';
import RemoteDesktopViewer from '@/components/RemoteDesktopViewer';
import {
  Loader2, Monitor, Trash2, Command, ChevronDown, Server, Laptop,
  PlayCircle, PauseCircle, Square, MousePointer, HandMetal, Cpu, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatSessionPage() {
  const { chatId } = useParams() as { chatId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useAuthStore();
  const { 
    sessions, setActiveSession, setSessions,
    aiState, setAiState, mousePos, setMousePos,
    isStreaming, setStreaming
  } = useChatStore();
  const { vms, setVMs } = useVMStore();
  const { devices, setDevices } = useDeviceStore();
  const { modal, confirm } = useModal();
  const [hitlRequired, setHitlRequired] = useState(false);

  const currentSession = useMemo(() => sessions.find(s => s.id === chatId), [sessions, chatId]);
  const [currentVm, setCurrentVm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splitRatio, setSplitRatio] = useState(42); // % for chat
  const [showViewer, setShowViewer] = useState(false);

  const monitor = searchParams.get('monitor');
  useEffect(() => {
    if (monitor === 'true') setShowViewer(true);
  }, [monitor]);

  useEffect(() => {
    setActiveSession(chatId);

    const loadSession = async () => {
      try {
        const chatRes = await chatApi.list();
        const found = chatRes.sessions.find(s => s.id === chatId);
        if (!found) { router.push('/workspace'); return; }
        setSessions(chatRes.sessions);

        const [vmRes, pairRes] = await Promise.all([
          vmApi.list().catch(() => ({ vms: [] })),
          pairApi.devices().catch(() => ({ devices: [] })),
        ]);
        setVMs(vmRes.vms);
        setDevices(pairRes.devices);
        setCurrentVm(vmRes.vms.find(v => v.id === found.vm_id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [chatId]);

  // Poll VM status every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await vmApi.list();
        setVMs(res.vms);
        const session = useChatStore.getState().sessions.find(s => s.id === chatId);
        if (session?.vm_id) {
          setCurrentVm(res.vms.find(v => v.id === session.vm_id));
        }
      } catch { }
    }, 15000);
    return () => clearInterval(interval);
  }, [chatId]);

  const handleDelete = async () => {
    const ok = await confirm('This will permanently delete this chat session and all its history.', {
      title: 'Delete Session?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await chatApi.delete(chatId);
      router.push('/workspace');
    } catch { }
  };

  // Determine viewer target - use the current session's vm or device
  const activeVmId = currentSession?.vm_id;
  const activeDeviceId = currentSession?.device_id;
  const activeVm = vms.find(v => v.id === activeVmId);
  const activeDevice = devices.find(d => d.id === activeDeviceId);
  const hasTarget = !!(activeVmId || activeDeviceId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
      </div>
    );
  }

  return (
    <>
      {modal}
      <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
        {/* Session Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-secondary shrink-0 relative z-30">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
               <div className={cn(
                  "p-2 rounded-lg border transition-all",
                  (!activeVmId && !activeDeviceId) ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-card border-border text-zinc-400"
                )}>
                  {activeDeviceId ? <Laptop size={14} /> : <Cpu size={14} />}
               </div>
               <div className="min-w-0">
                  <h1 className="text-xs font-black text-foreground truncate uppercase tracking-tighter">
                    {activeVm?.name || activeDevice?.name || 'Unassigned'}
                  </h1>
               </div>
            </div>

            <div className="h-4 w-px bg-border mx-1 hidden md:block" />

            {/* AI Controls in Header */}
            <div className="hidden lg:flex items-center gap-2">
              {aiState !== 'idle' && (
                <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg px-2 py-0.5">
                  <button 
                    onClick={async () => {
                      const nextState = aiState === 'paused' ? 'running' : 'paused';
                      setAiState(nextState);
                      try { await chatApi.update(chatId, { ai_status: nextState } as any); } catch {}
                    }}
                    className="hover:text-white text-zinc-500 transition-colors"
                  >
                    {aiState === 'paused' ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                  </button>
                  <button 
                    onClick={async () => { setStreaming(false); setAiState('idle'); try { await chatApi.update(chatId, { ai_status: 'stopped' } as any); } catch {} }}
                    className="text-red-500/50 hover:text-red-500 transition-colors"
                  >
                    <Square size={10} fill="currentColor" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Target Selector */}
            <div className="relative group/selector">
              <button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-foreground hover:bg-card-hover transition-all shadow-xl">
                <span className="hidden sm:inline">{activeVm?.name || activeDevice?.name || 'Assign Target'}</span>
                <Server size={14} className="sm:hidden" />
                <ChevronDown size={12} className="opacity-50 transition-transform group-hover/selector:rotate-180" />
              </button>
              
              <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover/selector:opacity-100 group-hover/selector:visible transition-all z-50">
                <div className="p-3">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Available Resources</h4>
                  <div className="space-y-1">
                    {vms.map((vm) => {
                      const isSelected = activeVmId === vm.id && !activeDeviceId;
                      return (
                      <button
                        key={vm.id}
                        onClick={async () => {
                          await chatApi.update(chatId, { vm_id: vm.id, device_id: null });
                          // Update local store immediately
                          const res = await chatApi.list();
                          setSessions(res.sessions);
                          setShowViewer(true);
                          toast.success(`Connected to ${vm.name}`);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                          isSelected ? "bg-accent-primary text-accent-foreground" : "hover:bg-card-hover text-text-secondary"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Cpu size={14} />
                          <span className="text-[11px] font-bold uppercase">{vm.name}</span>
                        </div>
                        {isSelected && <Check size={12} />}
                      </button>
                    )})}
                    {devices.map((device) => {
                      const isSelected = activeDeviceId === device.id;
                      return (
                      <button
                        key={device.id}
                        onClick={async () => {
                          await chatApi.update(chatId, { device_id: device.id, vm_id: null });
                          // Update local store immediately
                          const res = await chatApi.list();
                          setSessions(res.sessions);
                          setShowViewer(true);
                          toast.success(`Connected to ${device.name}`);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                          isSelected ? "bg-accent-primary text-accent-foreground" : "hover:bg-card-hover text-text-secondary"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Laptop size={14} />
                          <span className="text-[11px] font-bold uppercase">{device.name}</span>
                        </div>
                        {isSelected && <Check size={12} />}
                      </button>
                    )})}
                  </div>
                </div>
                {(vms.filter(v => v.status === 'running').length === 0 && devices.filter(d => d.status === 'paired').length === 0) && (
                  <div className="px-3 py-6 text-[9px] text-zinc-800 font-bold uppercase tracking-[0.2em] text-center border border-dashed border-white/5 rounded-xl m-1">No Active Nodes</div>
                )}
                <div className="mt-2 pt-2 border-t border-white/5">
                  <Link href="/machines" className="block w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-center text-[9px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-widest">
                    Manage Resources
                  </Link>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-white/5 mx-1" />

            {/* Desktop monitor toggle */}
            {hasTarget && (
              <button 
              onClick={() => setShowViewer(!showViewer)}
              className={cn(
                "p-2.5 rounded-xl border transition-all flex items-center gap-2",
                showViewer ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-card border-border text-text-muted hover:text-foreground"
              )}
              title="Toggle Viewer"
            >
              <Monitor size={15} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Monitor</span>
            </button>
            )}

            <button
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 rounded-xl text-zinc-700 transition-all border border-transparent hover:border-red-500/20"
              title="Delete Session"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </header>

        {/* Split View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Chat Panel — fills full width when monitor is hidden */}
          <div
            className={cn(
              "flex flex-col min-h-0 border-white/5 transition-all duration-300",
              showViewer ? "hidden md:flex md:border-r" : "flex flex-1"
            )}
            style={showViewer ? { width: `${splitRatio}%`, minWidth: '280px' } : {}}
          >
            <ChatPanel sessionId={chatId} />
          </div>

          {/* Viewer Panel */}
          {showViewer && (
            <>
              {/* Resizer */}
              <div
                className="hidden md:flex w-1 bg-white/5 hover:bg-blue-500/50 cursor-col-resize transition-colors items-center justify-center shrink-0"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startRatio = splitRatio;
                  const onMouseMove = (moveE: MouseEvent) => {
                    const delta = (moveE.clientX - startX) / window.innerWidth * 100;
                    setSplitRatio(Math.min(70, Math.max(20, startRatio + delta)));
                  };
                  const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                }}
              >
                <div className="w-1 h-8 bg-zinc-800 rounded-full" />
              </div>

              <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden relative animate-in slide-in-from-right-10 duration-300">
                {activeDeviceId ? (
                  <RemoteDesktopViewer
                    key={`device-${activeDeviceId}`}
                    deviceId={activeDeviceId}
                    className="flex-1"
                  />
                ) : activeVmId ? (
                  <VNCViewer
                    key={`vm-${activeVmId}`}
                    url={activeVm?.instance_url}
                    status={activeVm?.status}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-700 gap-4">
                    <Monitor size={40} className="opacity-20" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">No Resource Selected</p>
                    <p className="text-[9px] text-zinc-700">Select a VM or paired device in the chat header</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
