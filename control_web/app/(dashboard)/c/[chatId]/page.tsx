"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import ChatPanel from '@/components/ChatPanel';
import VNCViewer from '@/components/VNCViewer';
import RemoteDesktopViewer from '@/components/RemoteDesktopViewer';
import {
  Loader2, Cpu, Settings, Trash2, ChevronRight,
  Monitor, Layout, SplitSquareVertical, Maximize2, MessageSquare
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
  const { vms, setVMs } = useVMStore();
  const { modal, confirm } = useModal();

  const currentSession = useMemo(() => sessions.find(s => s.id === chatId), [sessions, chatId]);
  const [currentVm, setCurrentVm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [splitRatio, setSplitRatio] = useState(40); // % for chat
  const [showViewer, setShowViewer] = useState(false); // Closed by default as requested

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
        setSessions(chatRes.sessions);

        const vmRes = await vmApi.list();
        setVMs(vmRes.vms);
        setCurrentVm(vmRes.vms.find(v => v.id === found.vm_id));

        try {
          const pairRes = await pairApi.devices();
          const { useDeviceStore } = await import('@/lib/store');
          useDeviceStore.getState().setDevices(pairRes.devices);
        } catch { }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [chatId, setActiveSession, router, setSessions, setVMs]);

  // Handle VM status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await vmApi.list();
        setVMs(res.vms);
      } catch { }
    }, 10000);
    return () => clearInterval(interval);
  }, [setVMs]);

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
    } catch { }
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
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-950 shrink-0 relative z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate text-white">{currentSession?.title || 'Active Session'}</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                  Control: {currentVm?.name || currentSession?.device_id?.split('-')[0] || 'Cloud Node'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Launch Monitor Button (Both VM and Device) */}
            {typeof window !== 'undefined' && (
              <div className="flex md:hidden items-center gap-2">
                {currentVm?.instance_url ? (
                  <a
                    href={currentVm.instance_url.includes('/vnc.html') ? currentVm.instance_url : `${currentVm.instance_url.endsWith('/') ? currentVm.instance_url : currentVm.instance_url + '/'}vnc.html?resize=scale&autoconnect=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg shadow-white/5"
                  >
                    <Monitor size={12} /> Monitor
                  </a>
                ) : currentSession?.device_id ? (
                  <Link
                    href={`/remote/${currentSession.device_id}`}
                    target="_blank"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg shadow-white/5"
                  >
                    <Monitor size={12} /> Monitor
                  </Link>
                ) : null}
              </div>
            )}

            <div className="hidden md:flex items-center gap-1.5 ml-3 mr-1">
              <button
                onClick={() => setShowViewer(!showViewer)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  showViewer ? "bg-white text-black shadow-lg shadow-white/10" : "bg-white/5 text-zinc-500 hover:bg-white/10"
                )}
                title={showViewer ? "Close Monitor" : "Open Monitor"}
              >
                <Monitor size={14} />
              </button>
            </div>

            <div className="hidden md:block h-6 w-px bg-white/5 mx-1" />

            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-zinc-600 transition-all"
              title="Delete Session"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </header>

        {/* Split View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-black">
          {/* Chat Panel */}
          <div
            style={{ width: typeof window !== 'undefined' && window.innerWidth > 768 ? `${splitRatio}%` : '100%' }}
            className="flex-[4] md:flex-none md:h-full md:min-w-[300px] flex flex-col border-b md:border-b-0 md:border-r border-white/5"
          >
            <ChatPanel sessionId={chatId} />
          </div>

          {/* VM or Remote Viewer Panel */}
          {showViewer && (
            <>
              {/* Resizer */}
              <div
                className="hidden md:flex w-1 bg-white/5 hover:bg-blue-500/50 cursor-col-resize transition-colors items-center justify-center group shrink-0"
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

              <div className="hidden md:flex flex-1 flex flex-col bg-zinc-900 overflow-hidden relative animate-in slide-in-from-right-10 duration-500 border-l border-white/5">
                {currentSession?.device_id ? (
                  <RemoteDesktopViewer
                    key={`device-${currentSession.device_id}`}
                    deviceId={currentSession.device_id}
                    className="flex-1"
                  />
                ) : currentSession?.vm_id ? (
                  <VNCViewer
                    key={`vm-${currentSession.vm_id}`}
                    url={currentVm?.instance_url}
                    status={currentVm?.status}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 gap-4">
                    <Monitor size={48} className="opacity-10" />
                    <p className="text-xs uppercase tracking-widest font-bold">No Resource Selected</p>
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
