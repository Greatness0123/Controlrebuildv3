"use client";

import { useState } from 'react';
import { Shield, Key, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';

export default function PrivacyPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/privacy`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset link sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Privacy & Security</h2>

      <div className="space-y-6">
        {/* Security Overview */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Shield size={20} />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">System Security</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            All connections are encrypted with TLS 1.3 and AES-256-GCM. Your session data and AI provider configurations are stored securely in your private Supabase instance.
          </p>
          <div className="flex items-center gap-2 text-emerald-500 pt-2">
            <CheckCircle size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">End-to-end encrypted</span>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Key size={20} />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Authentication</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-foreground">Account Password</p>
                <p className="text-[11px] text-text-muted">Last changed: Never</p>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={loading || sent}
                className="px-4 py-2 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-card-hover transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : sent ? 'Link Sent' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Data Access */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Remote Access Shield</h3>
          </div>
          <p className="text-[11px] text-amber-500/80 leading-relaxed">
            Only paired devices that you have explicitly validated can communicate with this dashboard. You can revoke access at any time from the <b>Pair Device</b> page.
          </p>
        </div>
      </div>
    </div>
  );
}
