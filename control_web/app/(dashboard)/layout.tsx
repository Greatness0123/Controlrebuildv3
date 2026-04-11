"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSession, getSupabaseClient } from '@/lib/supabase';
import { chatApi, vmApi, pairApi } from '@/lib/api';
import { useAuthStore, useChatStore, useVMStore, useDeviceStore } from '@/lib/store';
import { useModal } from '@/lib/useModal';
import { useTheme } from 'next-themes';
import { clearCache } from '@/lib/cache';
import {
  Command, Monitor, MessageSquare, Cpu, Settings, LogOut, Plus, Sun, Moon, GitBranch,
  Link as LinkIcon, ChevronLeft, ChevronRight, Loader2, Menu, X, Trash, Edit2, LayoutDashboard, Crown, Shield, FolderOpen, ShoppingBag, History
} from 'lucide-react';
import { WorkspaceTour } from '@/components/workspace/WorkspaceTour';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme();
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
  const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);

  useEffect(() => {
    const loginWithReturn = () => {
      const q = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.push(`/auth/login${q}`);
    };
    
    getSession().then((session) => {
      if (!session) loginWithReturn();
      else { setUser(session.user); setLoading(false); }
    });
    
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { loginWithReturn(); setUser(null); }
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router, setUser, setLoading, pathname]);

  const toggleTheme = () => {
    setNextTheme(nextTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!user || !pathname) return;
    if (pathname.startsWith('/onboarding')) return;
    if (user.user_metadata?.onboarding_completed === false) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      chatApi.list().catch(() => ({ sessions: [] })),
      vmApi.list().catch(() => ({ vms: [] })),
      pairApi.devices().catch(() => ({ devices: [] })),
    ]).then(([chatRes, vmRes, pairRes]) => {
      setSessions(chatRes.sessions);
      setVMs(vmRes.vms);
      setDevices(pairRes.devices);
      setLoadingData(false);
    });
  }, [user]);

  const handleSignOut = async () => {
    clearCache();
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
    if (!editTitle.trim()) { setEditingSessionId(null); return; }
    try {
      await chatApi.update(id, { title: editTitle });
      setSessions(sessions.map(s => s.id === id ? { ...s, title: editTitle } : s));
      setEditingSessionId(null);
    } catch (err: any) {
      alert(err.message || "Failed to rename session");
    }
  };

  const handleDeleteSession = async (id: string, title: string) => {
    await chatApi.delete(id);
    setSessions(sessions.filter(s => s.id !== id));
    if (pathname === `/c/${id}`) router.push('/workspace');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  const isCollapsed = !sidebarOpen;

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {modal}

      <div className="h-12 flex items-center px-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">

          <div className="w-7 h-7 flex items-center justify-center shrink-0 transition-all group-hover:scale-110 text-foreground">
            <Command size={16} strokeWidth={2.5} />
          </div>
          {(sidebarOpen || isMobile) && (
            <span className="text-[13px] font-black tracking-tighter truncate">CONTROL</span>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-1.5 hover:bg-card-hover rounded-md text-text-muted transition-colors shrink-0"
            title={sidebarOpen ? "Collapse" : "Expand"}
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-text-muted">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-2 shrink-0">
        <button
          onClick={handleNewChat}
          disabled={isCreatingChat}
          className={cn(
            "h-9 flex items-center gap-2 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]",
            (sidebarOpen || isMobile) 
              ? "w-full px-3 bg-accent-primary text-accent-foreground font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:bg-opacity-90" 
              : "w-10 justify-center bg-card border border-border text-foreground hover:bg-card-hover"
          )}
          title="New Chat Session"
        >
          {isCreatingChat
            ? <Loader2 size={14} className="animate-spin shrink-0" />
            : <Plus size={16} strokeWidth={3} className="shrink-0" />
          }
          {(sidebarOpen || isMobile) && (
            <span className="truncate">{isCreatingChat ? 'Syncing...' : 'New Session'}</span>
          )}
        </button>

        <button
          onClick={() => setShowChatHistoryModal(true)}
          className={cn(
            "mt-2 h-9 flex items-center gap-2 rounded-xl transition-all",
            (sidebarOpen || isMobile) 
              ? "w-full px-3 bg-card border border-border text-text-secondary hover:bg-card-hover hover:text-foreground" 
              : "w-10 justify-center bg-card border border-border text-text-secondary hover:bg-card-hover"
          )}
          title="Chat History"
        >
          <History size={16} strokeWidth={2.5} className="shrink-0" />
          {(sidebarOpen || isMobile) && (
            <span className="truncate text-[10px] font-bold uppercase tracking-widest">Chat History</span>
          )}
        </button>
      </div>

      {showChatHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowChatHistoryModal(false)} />
          <div className="relative w-full max-w-md max-h-[80vh] bg-secondary border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <History size={18} strokeWidth={2.5} className="text-text-secondary" />
                <span className="text-sm font-black uppercase tracking-widest text-foreground">Chat History</span>
              </div>
              <button
                onClick={() => setShowChatHistoryModal(false)}
                className="p-1.5 hover:bg-card-hover rounded-lg text-text-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-xs">No chat sessions yet</div>
              ) : (
                sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/c/${session.id}`}
                    onClick={() => { setShowChatHistoryModal(false); isMobile && setMobileOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                      pathname === `/c/${session.id}`
                        ? 'bg-accent-primary/10 text-accent-primary font-medium'
                        : 'text-text-secondary hover:bg-card-hover hover:text-foreground'
                    )}
                  >
                    <MessageSquare size={14} className="shrink-0 opacity-60" />
                    <span className="truncate flex-1">{session.title}</span>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {session.updated_at ? new Date(session.updated_at).toLocaleDateString() : ''}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {!sidebarOpen && !isMobile && <div className="flex-1" />}

      <div className="flex-1 flex flex-col min-h-0 justify-between">
        <div className="flex-1" />
        <div className="py-2 border-t border-border space-y-0.25 shrink-0">
          <NavLink href="/workspace" icon={<LayoutDashboard size={14} />} label="Workspace" active={pathname === '/workspace'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/machines" icon={<Cpu size={14} />} label="Machines" active={pathname === '/machines'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/files" icon={<FolderOpen size={14} />} label="File Manager" active={pathname === '/files'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/workflows" icon={<GitBranch size={14} />} label="Workflows" active={pathname === '/workflows'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/marketplace" icon={<ShoppingBag size={14} />} label="Marketplace" active={pathname === '/marketplace'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/pair" icon={<LinkIcon size={14} />} label="Pair Device" active={pathname === '/pair'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/vault" icon={<Shield size={14} />} label="Secure Vault" active={pathname === '/vault'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/pricing" icon={<Crown size={14} className="text-yellow-500/50" />} label="Pricing Plans" active={pathname === '/pricing'} collapsed={isCollapsed && !isMobile} />
          <NavLink href="/settings" icon={<Settings size={14} />} label="Settings" active={pathname === '/settings'} collapsed={isCollapsed && !isMobile} />
        </div>
      </div>

      <div className="p-2 border-t border-border space-y-0.5 shrink-0">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:bg-card-hover hover:text-foreground transition-all",
            (sidebarOpen || isMobile) ? "" : "justify-center"
          )}
          title={nextTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {nextTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {(sidebarOpen || isMobile) && (nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>

        {(sidebarOpen || isMobile) && (
          <div className="px-3 py-1">
            <span className="text-[10px] font-bold text-foreground truncate block">
              {user?.user_metadata?.first_name
                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                : (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')}
            </span>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all",
            (sidebarOpen || isMobile) ? "" : "justify-center"
          )}
          title="Sign Out"
        >
          <LogOut size={13} />
          {(sidebarOpen || isMobile) && 'Sign Out'}
        </button>
      </div>
    </>
  );

  return (
    <div className={cn(
      "h-[100dvh] flex overflow-hidden bg-background text-foreground"
    )}>
      <WorkspaceTour userId={user.id} />

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] w-72 flex flex-col border-r border-border bg-secondary transition-transform duration-250 ease-in-out md:hidden",
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent isMobile />
      </aside>

      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-secondary transition-all duration-200 shrink-0",
        sidebarOpen ? 'w-60' : 'w-14'
      )}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

        <div className="md:hidden flex items-center h-12 px-2 border-b border-border bg-secondary shrink-0 gap-1.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-card-hover rounded-lg text-text-secondary transition-colors"
          >
            <Menu size={18} />
          </button>
          
          <div className="flex items-center gap-2 min-w-0">

            <div className="w-6 h-6 flex items-center justify-center shrink-0 text-foreground">
              <Command size={14} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-black tracking-tighter truncate">CONTROL</span>
          </div>

          <Link
            href="/workspace"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-[10px] font-bold text-text-secondary hover:text-foreground hover:bg-card-hover transition-all"
          >
            <LayoutDashboard size={12} />
            <span className="hidden sm:inline">Workspace</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({
  href, icon, label, active, collapsed
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center h-8 px-3 rounded-lg text-xs transition-all relative group",
        active ? 'bg-card-hover text-foreground font-bold' : 'text-text-secondary hover:bg-card hover:text-foreground',
        "gap-3"
      )}

    >
      <div className="w-5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      {!collapsed && <span className="truncate">{label}</span>}

      {collapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-secondary border border-border rounded-xl text-[10px] font-black text-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none z-50 shadow-2xl">
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-secondary border-l border-b border-border rotate-45" />
          {label}
        </div>
      )}
    </Link>
  );
}
