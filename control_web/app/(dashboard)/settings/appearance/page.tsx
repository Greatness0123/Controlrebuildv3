"use client";

import { useAuthStore } from '@/lib/store';
import { Sun, Moon } from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AppearancePage() {
  const { theme, setTheme } = useAuthStore();

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Appearance</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-black text-foreground">Theme</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setTheme('light'); localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); }}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                theme === 'light' ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-background border-border text-text-muted hover:border-border"
              )}
            >
              <Sun size={20} />
              <span className="text-xs font-black uppercase">Light</span>
            </button>
            <button
              onClick={() => { setTheme('dark'); localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); }}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                theme === 'dark' ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-background border-border text-text-muted hover:border-border"
              )}
            >
              <Moon size={20} />
              <span className="text-xs font-black uppercase">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
