"use client";

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import { LogOut, Save, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName }
      });
      if (error) throw error;
      setUser(data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground">Account</h2>
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-bold text-text-muted hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border text-foreground rounded-xl text-xs font-black hover:bg-card-hover transition-all"
          >
            <Edit2 size={14} />
            Edit Profile
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary text-accent-foreground flex items-center justify-center text-2xl font-black shrink-0">
              {user?.user_metadata?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
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

        {isEditing ? (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <SettingsRow label="First Name" value={user?.user_metadata?.first_name || '-'} />
            <SettingsRow label="Last Name" value={user?.user_metadata?.last_name || '-'} />
            <SettingsRow label="Email Address" value={user?.email || '-'} />
            <SettingsRow label="User ID" value={user?.id?.substring(0, 12) + '...' || '-'} mono />
          </>
        )}

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
