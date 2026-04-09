"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import { chatApi } from '@/lib/api';
import Link from 'next/link';
import {
  TrendingUp,
  Wallet,
  Activity,
  Check,
  ChevronRight,
  Clock,
  Download,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  MousePointerClick,
  MessageCircleQuestion,
  Fuel,
  User,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

type DailyUsageRow = { date: string; short: string; ask: number; act: number };

function usageRowsFromProfile(daily: Record<string, { ask?: number; act?: number }> | undefined): DailyUsageRow[] {
  if (!daily || typeof daily !== 'object') return [];
  return Object.keys(daily)
    .sort()
    .map((date) => ({
      date,
      short: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ask: daily[date].ask || 0,
      act: daily[date].act || 0,
    }));
}

function aggregateUsageFromMessages(
  rows: { created_at: string; role: string; action_type: string | null }[]
): DailyUsageRow[] {
  const dayMap = new Map<string, { ask: number; act: number }>();
  for (const m of rows) {
    const day = (m.created_at || '').slice(0, 10);
    if (!day || day.length < 10) continue;
    if (!dayMap.has(day)) dayMap.set(day, { ask: 0, act: 0 });
    const b = dayMap.get(day)!;
    const isAct = m.role === 'action' || Boolean(m.action_type);
    if (isAct) b.act += 1;
    else if (m.role === 'user') b.ask += 1;
  }
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      short: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ask: v.ask,
      act: v.act,
    }));
}

function bucketUsageByRange(rows: DailyUsageRow[], range: 'daily' | 'weekly' | 'monthly') {
  if (range === 'daily') {
    return rows.map((r) => ({ date: r.short, ask: r.ask, act: r.act }));
  }
  const map = new Map<string, { ask: number; act: number }>();
  for (const r of rows) {
    let key: string;
    if (range === 'weekly') {
      const d = new Date(r.date + 'T12:00:00');
      const x = new Date(d);
      const day = x.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      x.setDate(x.getDate() + diff);
      key = x.toISOString().slice(0, 10);
    } else {
      key = r.date.slice(0, 7);
    }
    const prev = map.get(key) || { ask: 0, act: 0 };
    prev.ask += r.ask;
    prev.act += r.act;
    map.set(key, prev);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      date:
        range === 'monthly'
          ? new Date(key + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : new Date(key + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ask: v.ask,
      act: v.act,
    }));
}

function bucketTokensByRange(
  daily: { date: string; total: number }[],
  range: 'daily' | 'weekly' | 'monthly'
): { label: string; total: number }[] {
  if (range === 'daily') {
    return daily.map((r) => ({
      label: new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: r.total,
    }));
  }
  const map = new Map<string, number>();
  for (const r of daily) {
    let key: string;
    if (range === 'weekly') {
      const d = new Date(r.date + 'T12:00:00');
      const x = new Date(d);
      const day = x.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      x.setDate(x.getDate() + diff);
      key = x.toISOString().slice(0, 10);
    } else {
      key = r.date.slice(0, 7);
    }
    map.set(key, (map.get(key) || 0) + r.total);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      label:
        range === 'monthly'
          ? new Date(key + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : new Date(key + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
    }));
}

const PLANS = [
  { id: 'lite', name: 'Lite', price: 9 },
  { id: 'starter', name: 'Starter', price: 19 },
  { id: 'plus', name: 'Plus', price: 50, popular: true },
  { id: 'pro', name: 'Pro', price: 100 },
];

const PLAN_DETAILS = {
  lite: {
    name: 'Control Lite',
    description: 'Perfect for light personal tasks',
    credits: 100,
    vms: 1,
    features: ['1 always-on VM', '2 agents in parallel', 'Standard search']
  },
  starter: {
    name: 'Control Starter',
    description: 'Great for small projects and hobbyists',
    credits: 250,
    vms: 1,
    features: ['1 always-on VM', '4 agents in parallel', 'Standard search']
  },
  plus: {
    name: 'Control Plus',
    description: 'Scale complex workflows',
    credits: 600,
    vms: 2,
    features: ['2 always-on VMs', '6 agents in parallel', 'Advanced search & extraction', 'Priority support, 24hr response']
  },
  pro: {
    name: 'Control Pro',
    description: 'For power users and businesses',
    credits: 1500,
    vms: 5,
    features: ['5 always-on VMs', '12 agents in parallel', 'Advanced search & extraction', 'Priority support, 12hr response', 'Team collaboration']
  }
};

type PlanType = 'free' | 'pro' | 'master';

export default function BillingPage() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'lite' | 'starter' | 'plus' | 'pro'>('plus');
  const [chartRange, setChartRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [userData, setUserData] = useState<any>(null);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [messageUsageDaily, setMessageUsageDaily] = useState<DailyUsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const supabase = getSupabaseClient();
      const [userRes, actionsRes] = await Promise.all([
        supabase.from('users').select('*').eq('auth_id', user.id).single(),
        chatApi.recentActions(15),
      ]);

      if (userRes.data) {
        setUserData(userRes.data);
        const internalId = userRes.data.id as string;
        // Broaden billing window to capture more usage data (default: 365 days)
        const since = new Date();
        since.setDate(since.getDate() - 365);

        // First try to fetch from billing_metrics table (more reliable)
        const { data: billingRows, error: billingErr } = await supabase
          .from('billing_metrics')
          .select('created_at, mode, tokens')
          .eq('user_id', internalId)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: true });

        if (!billingErr && billingRows && billingRows.length > 0) {
          // Aggregate from billing_metrics
          const dayMap = new Map<string, { ask: number; act: number; tokens: number }>();
          for (const row of billingRows) {
            const day = (row.created_at || '').slice(0, 10);
            if (!day || day.length < 10) continue;
            if (!dayMap.has(day)) dayMap.set(day, { ask: 0, act: 0, tokens: 0 });
            const b = dayMap.get(day)!;
            if (row.mode === 'act') b.act += 1;
            else b.ask += 1;
            b.tokens += row.tokens || 0;
          }
          const billingDerived = Array.from(dayMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({
              date,
              short: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              ask: v.ask,
              act: v.act,
            }));
          setMessageUsageDaily(billingDerived);
          // Improve total token visibility by deriving from billing_metrics when available
          const lifetimeTokens = billingRows.reduce((sum: number, r: any) => sum + (r.tokens || 0), 0);
          if (typeof lifetimeTokens === 'number') {
            setUserData((prev: any) => prev ? { ...prev, total_token_usage: lifetimeTokens } : prev);
          }
        } else {
          // Fallback: aggregate from chat_messages
          const { data: msgs, error: msgErr } = await supabase
            .from('chat_messages')
            .select('created_at, role, action_type, chat_sessions!inner(user_id)')
            .eq('chat_sessions.user_id', internalId)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: true });
          if (!msgErr && msgs) {
            setMessageUsageDaily(aggregateUsageFromMessages(msgs as any));
          } else {
            setMessageUsageDaily([]);
          }
        }
      }
      if (actionsRes.actions) {
        setRecentActions(actionsRes.actions);
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const profileUsageDaily = useMemo(
    () => usageRowsFromProfile(userData?.daily_token_usage),
    [userData]
  );

  const usageDailySource = useMemo(() => {
    const profileSum = profileUsageDaily.reduce((s, r) => s + r.ask + r.act, 0);
    if (profileUsageDaily.length > 0 && profileSum > 0) return profileUsageDaily;
    return messageUsageDaily;
  }, [profileUsageDaily, messageUsageDaily]);

  const usageData = useMemo(
    () => bucketUsageByRange(usageDailySource, chartRange),
    [usageDailySource, chartRange]
  );

  const tokenDailyRaw = useMemo(() => {
    if (!userData?.daily_token_usage || typeof userData.daily_token_usage !== 'object') return [];
    const usage = userData.daily_token_usage as Record<string, { total?: number }>;
    return Object.keys(usage)
      .sort()
      .map((date) => ({ date, total: usage[date]?.total || 0 }));
  }, [userData]);

  const tokenData = useMemo(
    () => bucketTokensByRange(tokenDailyRaw, chartRange),
    [tokenDailyRaw, chartRange]
  );

  const selectedPlan = PLAN_DETAILS[selectedPlanId];
  const currentPlan = (userData?.plan || user?.user_metadata?.plan || 'Free') as string;

  const planLimits: Record<string, { act: number; ask: number }> = {
      free: { act: 10, ask: 200 },
      pro: { act: 200, ask: 500 },
      master: { act: 999999, ask: 999999 }
  };

  const currentLimits = planLimits[currentPlan.toLowerCase()] || planLimits.free;
  const isActLimitReached = (userData?.act_count || 0) >= currentLimits.act;
  const isAskLimitReached = (userData?.ask_count || 0) >= currentLimits.ask;

  const isDark = mounted && resolvedTheme === 'dark';
  const strokeColor = isDark ? '#fafafa' : '#18181b';
  const askStroke = isDark ? '#a3e635' : '#4d7c0f';
  const actStroke = isDark ? '#f472b6' : '#be185d';
  const mutedStroke = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';
  const gradientId = `colorTokens-${isDark ? 'dark' : 'light'}`;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 bg-background">
      {/* Plan Usage Status */}
      {(isActLimitReached || isAskLimitReached) && (
          <div className="bg-foreground text-background rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} />
            <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest">Plan limits reached</p>
                <p className="text-[10px] opacity-80 font-bold">You have exhausted your current plan's {isActLimitReached ? 'ACT' : 'ASK'} limits. Upgrade to continue using AI features.</p>
            </div>
            <Link href="/pricing" className="px-4 py-2 bg-background text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90">Upgrade</Link>
          </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="ACT ACTIONS"
          value={userData?.act_count?.toString() || "0"}
          subtitle={`Limit: ${currentLimits.act === 999999 ? '∞' : currentLimits.act}`}
          unit="actions"
          icon={<MousePointerClick className="w-4 h-4" />}
          color="rose"
        />
        <SummaryCard
          title="ASK QUERIES"
          value={userData?.ask_count?.toString() || "0"}
          subtitle={`Limit: ${currentLimits.ask === 999999 ? '∞' : currentLimits.ask}`}
          unit="queries"
          icon={<MessageCircleQuestion className="w-4 h-4" />}
          color="emerald"
        />
        <SummaryCard
          title="TOTAL TOKENS"
          value={userData ? (userData.total_token_usage || 0).toString() : "..."}
          subtitle="lifetime usage"
          unit="tokens"
          icon={<Fuel className="w-4 h-4" />}
          color="blue"
        />
        <SummaryCard
          title="PLAN"
          value={currentPlan}
          subtitle={currentPlan.toLowerCase() === 'free' ? "No active plan" : "Active subscription"}
          icon={<div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent -rotate-45" />}
          color="blue"
        />
      </div>

      {/* Graph Section: Usage */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground border border-border">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">AI usage</h3>
              <p className="text-[10px] text-text-muted font-medium">
                From your profile when available; otherwise estimated from chat activity.
              </p>
            </div>
          </div>
          <div className="flex bg-secondary p-1 rounded-lg border border-border self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={cn(
                  'px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all',
                  chartRange === range ? 'bg-background text-foreground shadow-sm' : 'text-text-muted hover:text-foreground'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData.length > 0 ? usageData : [{ date: 'No data', ask: 0, act: 0 }]}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={mutedStroke} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '1px' }} />
              <Line type="monotone" dataKey="ask" stroke={askStroke} strokeWidth={2} dot={false} name="Ask (messages)" />
              <Line type="monotone" dataKey="act" stroke={actStroke} strokeWidth={2} strokeDasharray="6 4" dot={false} name="Act (actions)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graph Section: Tokens */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground border border-border">
              <Fuel size={16} />
            </div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Token Consumption</h3>
          </div>

          <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide hidden sm:block">Same range as usage</p>
        </div>

        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tokenData.length > 0 ? tokenData : [{ label: 'No data', total: 0 }]}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={mutedStroke} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '10px' }} />
              <Area type="monotone" dataKey="total" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-muted" />
            <h3 className="text-sm font-black">Recent Activity</h3>
            <span className="bg-secondary text-text-muted text-[10px] font-black px-1.5 py-0.5 rounded-md">
              {recentActions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-black uppercase hover:bg-border transition-colors">
              <Filter size={12} />
              Filter
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {recentActions.length > 0 ? (
            recentActions.map((action, i) => (
              <TransactionItem
                key={action.id || i}
                title={action.role === 'action' ? `Action: ${action.action_type || 'Unknown'}` : action.role === 'user' ? 'User Message' : 'Assistant Response'}
                subtitle={`${new Date(action.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${action.session_id ? ` · Session: ${String(action.session_id).slice(0, 8)}` : ''}`}
                amount={action.role === 'action' ? "-1 act" : action.role === 'user' ? "query" : "resp"}
                balance=""
                icon={action.role === 'action' ? <MousePointerClick className="w-4 h-4" /> : action.role === 'user' ? <User className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              />
            ))
          ) : (
            <div className="py-12 text-center bg-card border border-dashed border-border rounded-2xl">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No recent activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, unit, icon, color }: { title: string, value: string, subtitle: string, unit?: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{title}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary text-foreground border border-border">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-foreground">{value}</span>
          {unit && <span className="text-[10px] font-bold text-text-muted">{unit}</span>}
        </div>
        <div className="flex items-center gap-1">
           <div className="w-1 h-1 rounded-full bg-text-muted opacity-50" />
          <span className="text-[9px] font-bold text-text-muted">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ title, subtitle, amount, balance, icon }: { title: string, subtitle: string, amount: string, balance: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border hover:border-text-muted/20 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground border border-border group-hover:border-foreground/30 transition-all">
          {icon}
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-black">{title}</div>
          <div className="text-[10px] text-text-muted font-bold">{subtitle}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-black text-foreground">
          {amount}
        </div>
        <div className="text-[9px] text-text-muted font-bold">{balance}</div>
      </div>
    </div>
  );
}
