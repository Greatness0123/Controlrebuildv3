"use client";

import { Command } from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AboutPage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">About</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center">
              <Command size={24} className="text-foreground" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Control Web</h3>
              <p className="text-xs text-text-muted">v0.1.0-alpha</p>
            </div>
          </div>
          <SettingsRow label="Platform" value="Web Application" />
          <SettingsRow label="Database" value="Supabase" />
          <SettingsRow label="Compute" value="Docker SDK" />
          <SettingsRow label="Signaling" value="Supabase Realtime" />
        </div>
        <p className="text-[10px] font-black text-text-muted text-center uppercase tracking-widest">
          © 2026 Advanced Agentic Coding Inc.
        </p>
      </div>
    </div>
  );
}

function SettingsRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0 last:pb-0">
      <span className="text-xs text-text-muted font-bold uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs text-foreground", mono && "font-mono")}>{value}</span>
    </div>
  );
}
