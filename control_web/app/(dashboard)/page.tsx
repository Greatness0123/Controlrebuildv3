"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { Cpu, MessageSquare, Plus, Monitor, Zap, ArrowRight, Loader2 } from 'lucide-react';

export default function WorkspaceHome() {
  const router = useRouter();
  const { sessions, setSessions } = useChatStore();
  const { vms, setVMs } = useVMStore();
  const { devices, setDevices } = useDeviceStore();
  const { modal, alert } = useModal();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    pairApi.devices().then(res => setDevices(res.devices)).catch(() => {});
  }, [setDevices]);

  const handleNewChat = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      // Prioritize paired devices for "Machine Control"
      const pairedDevice = devices.find(d => d.status === 'paired');
      const runningVm = vms.find(v => v.status === 'running');
      
      const res = await chatApi.create(runningVm?.id, pairedDevice?.id);
      setSessions([res.session, ...sessions]);
      router.push(`/c/${res.session.id}`);
    } catch (err: any) {
      alert((err.message || "Could not start session. Check your connection."), { title: 'Session Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <>
      {modal}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 gradient-text-white">Welcome to your Workspace</h1>
        <p className="text-zinc-500 text-sm mb-8 sm:mb-10">Your AI-powered control center. What would you like to do?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={handleNewChat}
            disabled={isCreatingChat}
            className="glass-card p-6 text-left group cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-all">
              {isCreatingChat ? (
                <Loader2 size={18} className="text-blue-400 animate-spin" />
              ) : (
                <MessageSquare size={18} className="text-blue-400" />
              )}
            </div>
            <h3 className="text-sm font-bold mb-1">{isCreatingChat ? 'Starting...' : 'New Chat'}</h3>
            <p className="text-[11px] text-zinc-600">Start a new AI agent session on a virtual machine</p>
          </button>

          <Link href="/machines" className="glass-card p-6 text-left group">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-3">
              <Cpu size={18} className="text-purple-400" />
            </div>
            <h3 className="text-sm font-bold mb-1">Manage Machines</h3>
            <p className="text-[11px] text-zinc-600">Create, start, or stop your virtual computers</p>
          </Link>

          <Link href="/pair" className="glass-card p-6 text-left group">
            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-3">
              <Monitor size={18} className="text-green-400" />
            </div>
            <h3 className="text-sm font-bold mb-1">Pair Desktop</h3>
            <p className="text-[11px] text-zinc-600">Connect your local system for remote access</p>
          </Link>

          <Link href="/settings" className="glass-card p-6 text-left group">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-3">
              <Zap size={18} className="text-orange-400" />
            </div>
            <h3 className="text-sm font-bold mb-1">Settings</h3>
            <p className="text-[11px] text-zinc-600">Configure AI providers and account preferences</p>
          </Link>
        </div>

        {/* Recent Chats */}
        {sessions.length > 0 && (
          <div className="text-left">
            <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 px-1">Recent Sessions</h2>
            <div className="space-y-1">
              {sessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  href={`/c/${session.id}`}
                  className="flex items-center justify-between p-3 glass-card"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={14} className="text-zinc-500" />
                    <span className="text-sm">{session.title}</span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-600" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
