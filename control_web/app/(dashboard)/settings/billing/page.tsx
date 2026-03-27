"use client";

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { BarChart, Zap, Clock, TrendingUp } from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function BillingPage() {
  const { user } = useAuthStore();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getUsageData = () => {
    const stats = user?.user_metadata?.token_usage || {};
    const dailyStats = user?.user_metadata?.daily_token_usage || {};

    if (timeframe === 'daily') {
      return {
        act: dailyStats.act || 0,
        ask: dailyStats.ask || 0,
        total: (dailyStats.act || 0) + (dailyStats.ask || 0)
      };
    } else if (timeframe === 'weekly') {
      // Logic for weekly/monthly aggregation from current metadata
      // For now, we use a percentage of total as mock or direct total if metadata is limited
      return {
        act: stats.weekly_act || (stats.act ? Math.floor(stats.act * 0.4) : 0),
        ask: stats.weekly_ask || (stats.ask ? Math.floor(stats.ask * 0.4) : 0),
        total: (stats.weekly_act || 0) + (stats.weekly_ask || 0) || Math.floor((stats.act + stats.ask) * 0.4)
      };
    } else {
      return {
        act: stats.act || 0,
        ask: stats.ask || 0,
        total: (stats.act || 0) + (stats.ask || 0)
      };
    }
  };

  const usage = getUsageData();

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-10">
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

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Token Usage Statistics</h3>
            <div className="flex bg-secondary p-1 rounded-xl border border-border">
              {(['daily', 'weekly', 'monthly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    timeframe === t ? "bg-background text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                <Zap size={16} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Act Tokens</div>
                <div className="text-xl font-black text-foreground">{usage.act.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Ask Tokens</div>
                <div className="text-xl font-black text-foreground">{usage.ask.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Usage Distribution</div>
              <div className="text-xs font-black text-foreground">Total: {usage.total.toLocaleString()}</div>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
              <div
                className="h-full bg-accent-primary transition-all duration-500"
                style={{ width: `${usage.total > 0 ? (usage.act / usage.total) * 100 : 0}%` }}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${usage.total > 0 ? (usage.ask / usage.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-primary" />
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Act</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Ask</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/pricing"
          className="block w-full text-center py-4 bg-accent-primary text-accent-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
        >
          Upgrade My Plan
        </Link>
      </div>
    </div>
  );
}
