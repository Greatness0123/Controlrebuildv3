"use client";

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
  User, Shield, Zap, Key, Database, Globe, Bell, Palette, FileDown,
  Save, Loader2, Sparkles, Command, Terminal, ChevronRight,
  MessageCircle, Info, Sun, Moon, Lock, CreditCard, LogOut
} from 'lucide-react';
import Link from 'next/link';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type SettingsTab = 'account' | 'billing' | 'privacy' | 'notifications' | 'appearance' | 'apikeys' | 'data' | 'provider' | 'terminal' | 'feedback' | 'about';

const MENU_SECTIONS = [
  {
    title: null,
    items: [
      { id: 'account', icon: <User size={16} />, label: 'Account', desc: 'Manage your profile' },
      { id: 'billing', icon: <CreditCard size={16} />, label: 'Billing & Credits', desc: 'Manage billing' },
      { id: 'privacy', icon: <Lock size={16} />, label: 'Privacy & Security', desc: 'Privacy settings' },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      { id: 'appearance', icon: <Palette size={16} />, label: 'Appearance', desc: 'Customize app' },
      { id: 'apikeys', icon: <Key size={16} />, label: 'API Keys', desc: 'Manage keys' },
      { id: 'provider', icon: <Sparkles size={16} />, label: 'AI Provider', desc: 'AI model provider' },
      { id: 'terminal', icon: <Terminal size={16} />, label: 'Terminal', desc: 'Permissions' },
      { id: 'data', icon: <FileDown size={16} />, label: 'Data & Export', desc: 'Manage data' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { id: 'feedback', icon: <MessageCircle size={16} />, label: 'Feedback', desc: 'Send feedback' },
      { id: 'about', icon: <Info size={16} />, label: 'About', desc: 'About Coasty' },
    ],
  },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useAuthStore();
  const activeTab = pathname.split('/').pop() || 'account';

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Settings Navigation */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0 bg-background">
          <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Settings</span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-border hover:bg-card-hover transition-all text-text-secondary"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {MENU_SECTIONS.map((section, si) => (
              <div key={si} className="space-y-1">
                {section.title && (
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-3 py-2">{section.title}</p>
                )}
                {section.items.map(item => (
                  <Link
                    key={item.id}
                    href={`/settings/${item.id}`}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all group",
                      activeTab === item.id
                        ? "bg-card border border-border shadow-sm"
                        : "hover:bg-card-hover"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      activeTab === item.id ? "bg-accent-primary text-accent-foreground" : "bg-card border border-border text-text-muted"
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-foreground block">{item.label}</span>
                      <span className="text-[11px] text-text-muted block truncate">{item.desc}</span>
                    </div>
                    <ChevronRight size={14} className={cn(
                      "text-text-muted shrink-0 transition-transform",
                      activeTab === item.id && "translate-x-0.5"
                    )} />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
