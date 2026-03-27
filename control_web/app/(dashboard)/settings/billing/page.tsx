"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  Wallet,
  Activity,
  Check,
  ChevronRight,
  Monitor,
  Users,
  Clock,
  Download,
  Filter,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft
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

const PLANS = [
  { id: 'lite', name: 'Lite', price: 9 },
  { id: 'starter', name: 'Starter', price: 19 },
  { id: 'plus', name: 'Plus', price: 50, popular: true },
  { id: 'pro', name: 'Pro', price: 100 },
];

const PLAN_DETAILS = {
  lite: {
    name: 'Coasty Lite',
    description: 'Perfect for light personal tasks',
    credits: 100,
    vms: 1,
    features: ['1 always-on VM', '2 agents in parallel', 'Standard search']
  },
  starter: {
    name: 'Coasty Starter',
    description: 'Great for small projects and hobbyists',
    credits: 250,
    vms: 1,
    features: ['1 always-on VM', '4 agents in parallel', 'Standard search']
  },
  plus: {
    name: 'Coasty Plus',
    description: 'Scale complex workflows',
    credits: 600,
    vms: 2,
    features: ['2 always-on VMs', '6 agents in parallel', 'Advanced search & extraction', 'Priority support, 24hr response']
  },
  pro: {
    name: 'Coasty Pro',
    description: 'For power users and businesses',
    credits: 1500,
    vms: 5,
    features: ['5 always-on VMs', '12 agents in parallel', 'Advanced search & extraction', 'Priority support, 12hr response', 'Team collaboration']
  }
};

type PlanType = 'free' | 'pro' | 'master';

export default function BillingPage() {
  const { user } = useAuthStore();
  const [selectedPlanId, setSelectedPlanId] = useState<'lite' | 'starter' | 'plus' | 'pro'>('plus');
  const [tokenChartRange, setTokenChartRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (data) {
        setUserData(data);
      }
      setLoading(false);
    }
    fetchUserData();
  }, [user]);

  // Combined Ask and Act usage data
  const usageData = useMemo(() => {
    if (!userData?.daily_usage || Object.keys(userData.daily_usage).length === 0) {
        return [
            { date: 'Mar 21', ask: 4, act: 2 },
            { date: 'Mar 22', ask: 10, act: 5 },
            { date: 'Mar 23', ask: 7, act: 8 },
            { date: 'Mar 24', ask: 12, act: 4 },
            { date: 'Mar 25', ask: 15, act: 10 },
            { date: 'Mar 26', ask: 8, act: 12 },
            { date: 'Mar 27', ask: 20, act: 15 },
        ];
    }
    const usage = userData.daily_usage;
    const dates = Object.keys(usage).sort();
    return dates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ask: usage[date].ask || 0,
        act: usage[date].act || 0
    }));
  }, [userData]);

  // Token usage data transformation
  const tokenData = useMemo(() => {
    if (!userData?.daily_token_usage || Object.keys(userData.daily_token_usage).length === 0) return [];
    const usage = userData.daily_token_usage;
    const dates = Object.keys(usage).sort();

    const raw = dates.map(date => ({
        date: date,
        total: usage[date].total || 0
    }));

    return raw.map(r => ({ ...r, label: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));
  }, [userData]);

  const selectedPlan = PLAN_DETAILS[selectedPlanId];
  const currentPlan = (userData?.plan || user?.user_metadata?.plan || 'Free') as string;

  const planLimits: Record<PlanType, { act: number; ask: number }> = {
      free: { act: 10, ask: 200 },
      pro: { act: 200, ask: 500 },
      master: { act: 999999, ask: 999999 }
  };

  const normalizedPlan = currentPlan.toLowerCase() as PlanType;
  const currentLimits = planLimits[normalizedPlan] || planLimits.free;
  const isActLimitReached = (userData?.act_count || 0) >= currentLimits.act;
  const isAskLimitReached = (userData?.ask_count || 0) >= currentLimits.ask;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Plan Usage Status */}
      {(isActLimitReached || isAskLimitReached) && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-500">
            <AlertTriangle size={20} />
            <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest">Plan limits reached</p>
                <p className="text-[10px] opacity-80 font-bold">You have exhausted your current plan's {isActLimitReached ? 'ACT' : 'ASK'} limits. Upgrade to continue using AI features.</p>
            </div>
            <Link href="/pricing" className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90">Upgrade</Link>
          </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="ACT COUNT"
          value={userData?.act_count?.toString() || "0"}
          subtitle={`Limit: ${currentLimits.act === 999999 ? '∞' : currentLimits.act}`}
          unit="actions"
          icon={<Activity className="w-4 h-4" />}
          color="rose"
        />
        <SummaryCard
          title="ASK COUNT"
          value={userData?.ask_count?.toString() || "0"}
          subtitle={`Limit: ${currentLimits.ask === 999999 ? '∞' : currentLimits.ask}`}
          unit="queries"
          icon={<Users className="w-4 h-4" />}
          color="emerald"
        />
        <SummaryCard
          title="TOTAL TOKENS"
          value={userData ? (userData.total_token_usage || 0).toString() : "..."}
          subtitle="lifetime usage"
          unit="tokens"
          icon={<Zap className="w-4 h-4" />}
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
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity size={16} />
            </div>
            <h3 className="text-sm font-black">AI Usage Analytics</h3>
          </div>
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
              <Line type="monotone" dataKey="ask" stroke="#10b981" strokeWidth={3} dot={false} name="Ask Mode" />
              <Line type="monotone" dataKey="act" stroke="#f43f5e" strokeWidth={3} dot={false} name="Act Mode" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graph Section: Tokens */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Zap size={16} />
            </div>
            <h3 className="text-sm font-black">Token Consumption</h3>
          </div>

          <div className="flex bg-secondary p-1 rounded-lg border border-border">
            {(['daily', 'weekly', 'monthly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTokenChartRange(range)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                  tokenChartRange === range ? "bg-background text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tokenData}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
              <Area type="monotone" dataKey="total" stroke="#A855F7" fillOpacity={1} fill="url(#colorTokens)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan Selector */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-black text-foreground">Choose Your Plan</h3>
          <p className="text-xs text-text-muted mt-1">Subscribe to unlock AI features and get monthly credits</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex bg-secondary p-1 rounded-2xl border border-border">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2",
                  selectedPlanId === plan.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-text-muted hover:text-foreground"
                )}
              >
                {plan.name} <span className="opacity-50">${plan.price}</span>
              </button>
            ))}
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-4">
            <span>Save <span className="text-foreground">$2,950/mo</span> vs human</span>
            <span className="w-px h-3 bg-border" />
            <span><span className="text-foreground">18-24 hrs</span> saved monthly</span>
            <span className="w-px h-3 bg-border" />
            <span><span className="text-foreground">60x</span> cheaper</span>
          </div>

          {/* Plan Detail Card */}
          <div className="w-full max-w-3xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  {PLANS.find(p => p.id === selectedPlanId)?.popular && (
                    <span className="bg-foreground text-background text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-text-muted to-foreground opacity-20" />
                    <h4 className="text-sm font-black">{selectedPlan.name}</h4>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">${PLANS.find(p => p.id === selectedPlanId)?.price}</span>
                    <span className="text-text-muted text-sm font-bold">/month</span>
                  </div>
                  <p className="text-xs text-text-muted font-bold">{selectedPlan.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-secondary/50 p-3 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                    <Zap size={16} />
                  </div>
                  <div className="text-xs font-black">{selectedPlan.credits} credits<span className="text-text-muted font-bold">/month</span></div>
                </div>
                <div className="bg-[#12121a] p-3 rounded-xl border border-blue-500/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Monitor size={16} />
                  </div>
                  <div className="text-xs font-black">{selectedPlan.vms} always-on VMs</div>
                </div>
              </div>

              <button className="w-full py-4 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                Subscribe to {selectedPlanId.charAt(0).toUpperCase() + selectedPlanId.slice(1)} <ChevronRight size={14} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 pt-4 border-t border-border">
                {selectedPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-text-muted">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, unit, icon, color }: { title: string, value: string, subtitle: string, unit?: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'rose' }) {
  const colorClasses = {
    blue: "text-blue-500 bg-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    rose: "text-rose-500 bg-rose-500/10"
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{title}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black">{value}</span>
          {unit && <span className="text-[10px] font-bold text-text-muted">{unit}</span>}
        </div>
        <div className="flex items-center gap-1">
          {color === 'rose' || title === 'BALANCE' ? (
            <ArrowDownLeft size={10} className="text-rose-500" />
          ) : color === 'emerald' ? (
            <ArrowUpRight size={10} className="text-emerald-500" />
          ) : (
             <div className="w-1 h-1 rounded-full bg-text-muted opacity-50" />
          )}
          <span className="text-[9px] font-bold text-text-muted">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
