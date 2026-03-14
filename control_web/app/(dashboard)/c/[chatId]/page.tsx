"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import ChatPanel from '@/components/ChatPanel';
import VNCViewer from '@/components/VNCViewer';
import RemoteDesktopViewer from '@/components/RemoteDesktopViewer';
import { 
  Loader2, Cpu, Settings, Trash2, ChevronRight, 
  Monitor, Layout, SplitSquareVertical, Maximize2 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatSessionPage() {
  const { chatId } = useParams() as { chatId: string };
  const router = useRouter();
  const { sessions, setActiveSession, setSessions } = useChatStore();
  const { vms, setVMs, updateVM } = useVMStore();
  const { modal, confirm } = useModal();
  
  const [session, setSession] = useState<any>(null);
  const [vm, setVm] = useState<any>(null);
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splitRatio, setSplitRatio] = useState(40); // % for chat

  useEffect(() => {
    setActiveSession(chatId);
    
    const loadSession = async () => {
      try {
        // Load sessions and populate store
        const chatRes = await chatApi.list();
        const found = chatRes.sessions.find(s => s.id === chatId);
        if (!found) {
          router.push('/');
          return;
        }
        setSessions(chatRes.sessions);
        setSession(found);
        
        // Always load VMs into the store so the target selector works
        const vmRes = await vmApi.list();
        setVMs(vmRes.vms);
        if (found.vm_id) {
          const foundVm = vmRes.vms.find(v => v.id === found.vm_id);
          setVm(foundVm || null);
        }
        
        // Always load devices into the store so the target selector works
        try {
          const pairRes = await pairApi.devices();
          const { useDeviceStore } = await import('@/lib/store');
          useDeviceStore.getState().setDevices(pairRes.devices);
          if (found.device_id) {
            const foundDev = pairRes.devices.find(d => d.id === found.device_id);
            setDevice(foundDev || null);
          }
        } catch { /* devices endpoint might not be available */ }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [chatId, setActiveSession, router, setSessions, setVMs]);

  // Handle VM status updates — keep local state AND store in sync
  useEffect(() => {
    if (!vm) return;
    const interval = setInterval(async () => {
      try {
        const res = await vmApi.list();
        setVMs(res.vms); // Keep store in sync
        const updated = res.vms.find(v => v.id === vm.id);
        if (updated && updated.status !== vm.status) {
          setVm(updated);
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [vm]);

  const handleDelete = async () => {
    const ok = await confirm('This will permanently delete this chat session and its history.', {
      title: 'Delete Session?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await chatApi.delete(chatId);
      router.push('/');
    } catch {}
  };

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
      <div className="flex-1 flex flex-col min-h-0 bg-black">
        {/* Session Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
            <Layout size={12} />
            <span>Session</span>
            <ChevronRight size={10} />
          </div>
          <h2 className="text-sm font-bold truncate">{session?.title}</h2>
        </div>

        {/* Dynamic target display */}
        {(() => {
          const currentTarget = vm ? { type: 'vm', name: vm.name } : device ? { type: 'device', name: device.name } : null;
          return currentTarget && (
            <div className={cn(
                "flex items-center gap-2 px-2.5 py-1 rounded-lg border",
                currentTarget.type === 'vm' ? "bg-white/5 border-white/10" : "bg-blue-500/10 border-blue-500/20"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                currentTarget.type === 'vm' ? (vm?.status === 'running' ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-white/20') : 'bg-blue-500 animate-pulse'
              )} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                currentTarget.type === 'vm' ? 'text-zinc-500' : 'text-blue-400'
              )}>
                {currentTarget.name}
              </span>
            </div>
          );
        })()}

        <div className="flex items-center gap-2">
          <div className="h-6 w-px bg-white/5 mx-1" />
          <button 
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md text-zinc-600 transition-all"
            title="Delete Session"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Split View */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Panel */}
        <div style={{ width: `${splitRatio}%` }} className="min-w-[300px] flex flex-col">
          <ChatPanel sessionId={chatId} />
        </div>

        {/* Resizer */}
        <div 
          className="w-1 bg-white/5 hover:bg-blue-500/50 cursor-col-resize transition-colors flex items-center justify-center group"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startRatio = splitRatio;
            const onMouseMove = (moveE: MouseEvent) => {
              const deltaX = moveE.clientX - startX;
              const deltaRatio = (deltaX / window.innerWidth) * 100;
              setSplitRatio(Math.min(70, Math.max(20, startRatio + deltaRatio)));
            };
            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          <div className="w-1 h-8 bg-zinc-800 rounded-full group-hover:bg-blue-400 transition-colors" />
        </div>

        {/* VM or Remote Viewer Panel */}
        <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">
          {session?.device_id ? (
            <RemoteDesktopViewer 
              deviceId={session.device_id} 
              className="flex-1"
            />
          ) : (
            <VNCViewer 
              url={vm?.instance_url} 
              status={vm?.status}
              className="flex-1"
            />
          )}
        </div>
      </div>
      </div>
    </>
  );
}
