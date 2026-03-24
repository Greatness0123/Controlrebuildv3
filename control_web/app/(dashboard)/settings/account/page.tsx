"use client";

import { useAuthStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AccountPage() {
  const { user } = useAuthStore();

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Account</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary text-accent-foreground flex items-center justify-center text-2xl font-black shrink-0">
              {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {user?.user_metadata?.first_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                  : (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')}
              </h3>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
              <span className="inline-flex items-center px-3 py-1 mt-2 bg-card-hover border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-widest">
                {user?.user_metadata?.plan || 'Free'} Plan
              </span>
            </div>
          </div>
        </div>

        <SettingsRow label="Display Name" value={user?.user_metadata?.name || user?.email?.split('@')[0] || '-'} />
        <SettingsRow label="Email Address" value={user?.email || '-'} />
        <SettingsRow label="User ID" value={user?.id?.substring(0, 12) + '...' || '-'} mono />

        <div className="pt-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
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
