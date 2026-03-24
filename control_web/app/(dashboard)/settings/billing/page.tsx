"use client";

import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

export default function BillingPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <h2 className="text-lg font-black text-foreground">Billing & Credits</h2>
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-black text-foreground">Current Plan</h3>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Plan</span>
            <span className="text-xs font-black text-foreground uppercase">{user?.user_metadata?.plan || 'Free'}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">ACT Usage</span>
            <span className="text-xs font-black text-foreground">
              {user?.user_metadata?.actUsed || 0} / {(user?.user_metadata?.plan?.toLowerCase() || 'free') === 'master' ? '∞' : (user?.user_metadata?.plan?.toLowerCase() || 'free') === 'pro' ? '200' : '10'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">ASK Usage</span>
            <span className="text-xs font-black text-foreground">
              {user?.user_metadata?.askUsed || 0} / {(user?.user_metadata?.plan?.toLowerCase() || 'free') === 'master' ? '∞' : (user?.user_metadata?.plan?.toLowerCase() || 'free') === 'pro' ? '500' : '200'}
            </span>
          </div>
        </div>
        <Link
          href="/pricing"
          className="block w-full text-center py-4 bg-accent-primary text-accent-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
}
