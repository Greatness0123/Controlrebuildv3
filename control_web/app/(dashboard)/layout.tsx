"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useAuthStore, useChatStore, useVMStore, useDeviceStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import {
  Command, Monitor, MessageSquare, Cpu, Settings, LogOut, Plus,
  Link as LinkIcon, ChevronLeft, ChevronRight, Loader2, Menu, X, MoreVertical, Edit2, Trash
} from 'lucide-react';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { sessions, setSessions } = useChatStore();
  const { vms, setVMs } = useVMStore();
  const { devices, setDevices } = useDeviceStore();
  const { modal, alert } = useModal();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Auth check
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/auth/login');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login');
        setUser(null);
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setUser]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Load sidebar data
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [chatRes, vmRes, pairRes] = await Promise.all([
          chatApi.list().catch(() => ({ sessions: [] })),
          vmApi.list().catch(() => ({ vms: [] })),
          pairApi.devices().catch(() => ({ devices: [] })),
        ]);
        setSessions(chatRes.sessions);
        setVMs(vmRes.vms);
        setDevices(pairRes.devices);
      } catch {}
      setLoadingData(false);
    };
    loadData();
  }, [user, setSessions, setVMs]);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const handleNewChat = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const runningVm = vms.find(v => v.status === 'running');
      const pairedDevice = devices.find(d => d.status === 'paired');
      const res = await chatApi.create(runningVm?.id, pairedDevice?.id);
      setSessions([res.session, ...sessions]);
      router.push(`/c/${res.session.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create new chat.", { title: 'Chat Error', variant: 'error' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      await chatApi.update(id, { title: editTitle });
      setSessions(sessions.map(s => s.id === id ? { ...s, title: editTitle } : s));
      setEditingSessionId(null);
    } catch (err: any) {
      alert(err.message || "Failed to rename session");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {modal}
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/5">
        {(sidebarOpen || mobileOpen) && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <Command className="text-black w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tighter">CONTROL</span>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex p-1.5 hover:bg-white/5 rounded-md text-zinc-500 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 hover:bg-white/5 rounded-md text-zinc-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-2">
        <button
          onClick={handleNewChat}
          disabled={isCreatingChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        >
          {isCreatingChat && (
            <Loader2 size={14} className="animate-spin text-zinc-500" />
          )}
          {(sidebarOpen || mobileOpen) && (isCreatingChat ? 'Creating...' : 'New Chat Session')}
        </button>
      </div>

      {/* Chat History */}
      {(sidebarOpen || mobileOpen) && (
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-2 py-2">Chats</div>
          {sessions.map((session) => (
            <div key={session.id} className="relative group/session">
              {editingSessionId === session.id ? (
                <div className="flex items-center gap-1 px-3 py-1">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(session.id);
                      if (e.key === 'Escape') setEditingSessionId(null);
                    }}
                    onBlur={() => handleRename(session.id)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              ) : (
                <>
                  <Link
                    href={`/c/${session.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all truncate pr-8 ${
                      pathname === `/c/${session.id}` ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <MessageSquare size={12} className="shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </Link>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/session:flex items-center gap-1 bg-zinc-950 p-1 rounded-md border border-white/5 shadow-xl">
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setEditingSessionId(session.id);
                        setEditTitle(session.title);
                      }}
                      className="p-1 hover:bg-white/10 rounded-md text-zinc-500 hover:text-white transition-all"
                    >
                      <Edit2 size={10} />
                    </button>
                    <button 
                      onClick={async (e) => { 
                        e.preventDefault(); 
                        if (confirm(`Delete session "${session.title}"?`)) {
                          await chatApi.delete(session.id);
                          setSessions(sessions.filter(s => s.id !== session.id));
                          if (pathname === `/c/${session.id}`) router.push('/workspace');
                        }
                      }}
                      className="p-1 hover:bg-red-500/20 rounded-md text-zinc-500 hover:text-red-400 transition-all"
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nav Links */}
      <div className="p-2 space-y-0.5 border-t border-white/5">
        <NavLink href="/workspace" icon={<Command size={14} />} label="Workspace" active={pathname === '/workspace' || pathname === '/'} collapsed={!sidebarOpen && !mobileOpen} />
        <NavLink href="/machines" icon={<Cpu size={14} />} label="Machines" active={pathname === '/machines'} collapsed={!sidebarOpen && !mobileOpen} />
        <NavLink href="/pair" icon={<LinkIcon size={14} />} label="Pair Device" active={pathname === '/pair'} collapsed={!sidebarOpen && !mobileOpen} />
        <NavLink href="/settings" icon={<Settings size={14} />} label="Settings" active={pathname === '/settings'} collapsed={!sidebarOpen && !mobileOpen} />
      </div>

      {/* User */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:bg-white/5 hover:text-red-400 transition-all"
        >
          <LogOut size={14} />
          {(sidebarOpen || mobileOpen) && 'Sign Out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-[100dvh] bg-black text-white flex overflow-hidden">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide in from left) */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 flex flex-col border-r border-white/5 bg-zinc-950 transition-transform duration-250 ease-in-out md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-14'} hidden md:flex flex-col border-r border-white/5 bg-zinc-950/80 transition-all duration-200 shrink-0`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-white/5 bg-zinc-950/80 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <Command className="text-black w-3 h-3" />
            </div>
            <span className="text-sm font-bold tracking-tighter">CONTROL</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 relative">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active, collapsed }: { href: string; icon: ReactNode; label: string; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
        active ? 'bg-white/10 text-white font-medium' : 'text-zinc-500 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {!collapsed && label}
    </Link>
  );
}





