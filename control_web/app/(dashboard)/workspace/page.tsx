"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useChatStore, useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { 
  Plus, Monitor, Zap, Loader2, Settings, Server, LayoutDashboard, Cpu, LinkIcon
} from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function WorkspaceHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessions, setSessions } = useChatStore();
  const { vms, setVMs } = useVMStore();
  const { devices, setDevices } = useDeviceStore();
  const { modal, alert } = useModal();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [vmRes, devRes, chatRes] = await Promise.all([
          vmApi.list().catch(() => ({ vms: [] })),
          pairApi.devices().catch(() => ({ devices: [] })),
          chatApi.list().catch(() => ({ sessions: [] })),
        ]);
        setVMs(vmRes.vms);
        setDevices(devRes.devices);
        setSessions(chatRes.sessions);
      } catch {}
    };
    load();
  }, [setDevices, setVMs, setSessions]);

  const handleStartSession = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const runningVm = vms.find(v => v.status === 'running')?.id;
      const pairedDevice = devices.find(d => d.status === 'paired')?.id;
      
      const res = await chatApi.create(runningVm, pairedDevice);
      setSessions([res.session, ...sessions]);
      router.push(`/c/${res.session.id}`);
    } catch (err: any) {
      alert((err.message || "Failed to start session."), { title: 'Session Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <>
      {modal}
      <div className="flex-1 overflow-y-auto w-full bg-background">
        <div className="max-w-5xl mx-auto p-6 sm:p-10 lg:p-12">

          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {greeting()}, {user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer'}.
            </h1>
            <p className="text-text-muted text-sm mt-2 font-medium">
              What would you like to do today?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={handleStartSession}
              disabled={isCreatingChat}
              className="p-8 text-left bg-card border border-border rounded-3xl hover:border-border hover:bg-card-hover transition-all group flex flex-col min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent-primary text-accent-foreground flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                {isCreatingChat ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />}
              </div>
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight">Create New Session</h3>
              <p className="text-xs text-text-muted font-medium leading-relaxed">Start a new AI chat session with your active resources.</p>
            </button>

            <Link
              href="/machines"
              className="p-8 text-left bg-card border border-border rounded-3xl hover:border-border hover:bg-card-hover transition-all group flex flex-col min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border text-text-muted group-hover:text-foreground flex items-center justify-center mb-6 transition-colors group-hover:scale-110 transition-transform">
                <Cpu size={24} />
              </div>
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight">View Machines</h3>
              <p className="text-xs text-text-muted font-medium leading-relaxed">Monitor and manage your virtual and remote compute instances.</p>
            </Link>

            <Link
              href="/pair"
              className="p-8 text-left bg-card border border-border rounded-3xl hover:border-border hover:bg-card-hover transition-all group flex flex-col min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border text-text-muted group-hover:text-foreground flex items-center justify-center mb-6 transition-colors group-hover:scale-110 transition-transform">
                <LinkIcon size={24} />
              </div>
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight">Pair Devices</h3>
              <p className="text-xs text-text-muted font-medium leading-relaxed">Connect physical hardware to your cloud agent logic.</p>
            </Link>

            <Link
              href="/settings"
              className="p-8 text-left bg-card border border-border rounded-3xl hover:border-border hover:bg-card-hover transition-all group flex flex-col min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border text-text-muted group-hover:text-foreground flex items-center justify-center mb-6 transition-colors group-hover:scale-110 transition-transform">
                <Settings size={24} />
              </div>
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight">Settings</h3>
              <p className="text-xs text-text-muted font-medium leading-relaxed">Configure your AI provider, API keys, and account preferences.</p>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
