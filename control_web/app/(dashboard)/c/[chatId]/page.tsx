"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatApi, vmApi } from '@/lib/api';
import { useChatStore, useVMStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import ChatPanel from '@/components/ChatPanel';
import VNCViewer from '@/components/VNCViewer';
import RemoteDesktopViewer from '@/components/RemoteDesktopViewer';
import { 
  Loader2, Cpu, Settings, Trash2, ChevronRight, 
  Monitor, Layout, SplitSquareVertical, Maximize2 
} from 'lucide-react';

export default function ChatSessionPage() {
  const { chatId } = useParams() as { chatId: string };
  const router = useRouter();
  const { sessions, setActiveSession } = useChatStore();
  const { vms, setVMs, updateVM } = useVMStore();
  const { modal, confirm } = useModal();
  
  const [session, setSession] = useState<any>(null);
  const [vm, setVm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splitRatio, setSplitRatio] = useState(40); // % for chat

  useEffect(() => {
    setActiveSession(chatId);
    
    const loadSession = async () => {
      try {
        const chatRes = await chatApi.list();
        const found = chatRes.sessions.find(s => s.id === chatId);
        if (!found) {
          router.push('/');
          return;
        }
        setSession(found);
        
        // Load associated VM
        if (found.vm_id) {
          const vmRes = await vmApi.list();
          const foundVm = vmRes.vms.find(v => v.id === found.vm_id);
          setVm(foundVm);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [chatId, setActiveSession, router]);

  // Handle VM status updates
  useEffect(() => {
    if (!vm) return;
    const interval = setInterval(async () => {
      try {
        const res = await vmApi.list();
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

        <div className="flex items-center gap-2">
          {vm && (
            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
              <div className={`w-1.5 h-1.5 rounded-full ${vm.status === 'running' ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-zinc-600'}`} />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{vm.name}</span>
            </div>
          )}
          {session?.device_id && !vm && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Paired Desktop</span>
            </div>
          )}
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
              userId={session.user_id} 
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
