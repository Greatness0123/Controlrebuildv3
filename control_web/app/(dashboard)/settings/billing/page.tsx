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
    const today = new Date().toISOString().split('T')[0];

    let act = user?.user_metadata?.actUsed || 0;
    let ask = user?.user_metadata?.askUsed || 0;

    if (timeframe === 'daily') {
      const todayData = dailyStats[today] || { total: 0, prompt: 0, candidates: 0 };
      return {
        prompt: todayData.prompt || 0,
        candidates: todayData.candidates || 0,
        total: todayData.total || 0,
        act: Math.min(act, 5), // Mock daily distribution
        ask: Math.min(ask, 10)
      };
    } else if (timeframe === 'weekly') {
      let prompt = 0, candidates = 0, total = 0;
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      });

      last7Days.forEach(date => {
        if (dailyStats[date]) {
          prompt += dailyStats[date].prompt || 0;
          candidates += dailyStats[date].candidates || 0;
          total += dailyStats[date].total || 0;
        }
      });
      return {
        prompt, candidates, total,
        act: Math.min(act, 20),
        ask: Math.min(ask, 50)
      };
    } else {
      const totalTokens = user?.user_metadata?.total_token_usage || 0;
      let prompt = 0, candidates = 0;
      Object.values(dailyStats).forEach((day: any) => {
        prompt += day.prompt || 0;
        candidates += day.candidates || 0;
      });
      return {
        prompt: prompt || Math.floor(totalTokens * 0.7),
        candidates: candidates || Math.floor(totalTokens * 0.3),
        total: totalTokens || (prompt + candidates),
        act: act,
        ask: ask
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
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Prompt Tokens</div>
                <div className="text-xl font-black text-foreground">{usage.prompt.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Candidate Tokens</div>
                <div className="text-xl font-black text-foreground">{usage.candidates.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Usage Distribution</div>
              <div className="text-xs font-black text-foreground">Total Units</div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted">
                  <span>Tokens (Prompt vs Candidates)</span>
                  <span>{usage.total.toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-accent-primary transition-all duration-500"
                    style={{ width: `${usage.total > 0 ? (usage.prompt / usage.total) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${usage.total > 0 ? (usage.candidates / usage.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted">
                  <span>Agent Actions (Act vs Ask)</span>
                  <span>{(usage.act + usage.ask).toLocaleString()}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(usage.act + usage.ask) > 0 ? (usage.act / (usage.act + usage.ask)) * 100 : 0}%` }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(usage.act + usage.ask) > 0 ? (usage.ask / (usage.act + usage.ask)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 border-t border-border pt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-primary" />
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Prompt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Candidates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Act</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
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
