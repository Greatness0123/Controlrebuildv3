"use client";

import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Privacy & Security</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-black text-foreground">Security</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            All connections are encrypted with TLS 1.3 and AES-256-GCM. Session data is stored securely in your Supabase instance. No data is shared with third parties.
          </p>
          <div className="flex items-center gap-2 text-emerald-500">
            <Shield size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
