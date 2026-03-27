"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Check,
  ChevronRight,
  Monitor,
  Search,
  Users,
  Clock,
  Download,
  Filter
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
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

export default function BillingPage() {
  const { user } = useAuthStore();
  const [selectedPlanId, setSelectedPlanId] = useState<'lite' | 'starter' | 'plus' | 'pro'>('plus');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
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

  // Transform daily_token_usage for the chart
  const chartData = useMemo(() => {
    if (!userData?.daily_token_usage) return [];

    // daily_token_usage is likely { "YYYY-MM-DD": { "total": N, ... } }
    const usage = userData.daily_token_usage;
    const dates = Object.keys(usage).sort();

    return dates.map(date => {
      const dayData = usage[date];
      const d = new Date(date);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        date: label,
        balance: 0, // We don't have historical balance in the same way yet
        used: dayData.total || 0,
        earned: 0
      };
    });
  }, [userData]);

  const selectedPlan = PLAN_DETAILS[selectedPlanId];
  const currentPlan = userData?.plan || user?.user_metadata?.plan || 'Free';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="BALANCE"
          value={userData ? "0" : "..."}
          subtitle="~0d at current rate"
          unit="credits"
          icon={<Wallet className="w-4 h-4" />}
          color="blue"
        />
        <SummaryCard
          title="EARNED"
          value="+0"
          subtitle="last 30 days"
          icon={<TrendingUp className="w-4 h-4" />}
          color="emerald"
        />
        <SummaryCard
          title="USED"
          value={userData ? (userData.total_token_usage || 0).toString() : "..."}
          subtitle="lifetime usage"
          unit="tokens"
          icon={<Activity className="w-4 h-4" />}
          color="rose"
        />
        <SummaryCard
          title="PLAN"
          value={currentPlan}
          subtitle={currentPlan === 'Free' ? "No plan" : "Active subscription"}
          icon={<div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent -rotate-45" />}
          color="blue"
        />
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

      {/* Graph Section */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-sm font-black">Credit Activity</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-secondary p-1 rounded-lg border border-border">
              {(['area', 'bar'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                    chartType === type ? "bg-background text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex bg-secondary p-1 rounded-lg border border-border">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all",
                    timeRange === range ? "bg-background text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 10 }}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  animationDuration={1000}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 10 }}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#666', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                />
                <Bar dataKey="used" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earned" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-text-muted pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Earned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Used</span>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-muted" />
            <h3 className="text-sm font-black">Transactions</h3>
            <span className="bg-secondary text-text-muted text-[10px] font-black px-1.5 py-0.5 rounded-md">7</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-black uppercase hover:bg-border transition-colors">
              <Filter size={12} />
              All types
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-[10px] font-black uppercase hover:bg-border transition-colors">
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <TransactionItem
            title="Agent Usage"
            subtitle="Mar 11 · Step 0: 1 min on 2815da55-4656-42de-93c7-aa1ae88551da"
            amount="-10"
            balance="bal 0"
            icon={<Zap className="w-4 h-4" />}
          />
          <TransactionItem
            title="Agent Usage"
            subtitle="Mar 11 · Step 1: 1 min on 2815da55-4656-42de-93c7-aa1ae88551da"
            amount="-10"
            balance="bal 10"
            icon={<Zap className="w-4 h-4" />}
          />
          <TransactionItem
            title="Agent Usage"
            subtitle="Mar 11 · Step 11: 1 min on 2815da55-4656-42de-93c7-aa1ae88551da"
            amount="-10"
            balance="bal 20"
            icon={<Zap className="w-4 h-4" />}
          />
          <TransactionItem
            title="Agent Usage"
            subtitle="Mar 11 · Step 6: 1 min on 2815da55-4656-42de-93c7-aa1ae88551da"
            amount="-10"
            balance="bal 30"
            icon={<Zap className="w-4 h-4" />}
          />
          <TransactionItem
            title="Agent Usage"
            subtitle="Mar 11 · Step 1: 1 min on 2815da55-4656-42de-93c7-aa1ae88551da"
            amount="-10"
            balance="bal 40"
            icon={<Zap className="w-4 h-4" />}
          />
          <TransactionItem
            title="Agent Usage"
            subtitle="Feb 23 · Step 3: 4 min on af42929a-efb8-476c-bb14-57798b69c74a"
            amount="-40"
            balance="bal 50"
            icon={<Zap className="w-4 h-4" />}
          />
          <TransactionItem
            title="Agent Usage"
            subtitle="Feb 23 · Step 2: 1 min on af42929a-efb8-476c-bb14-57798b69c74a"
            amount="-10"
            balance="bal 90"
            icon={<Zap className="w-4 h-4" />}
          />
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

function TransactionItem({ title, subtitle, amount, balance, icon }: { title: string, subtitle: string, amount: string, balance: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border hover:border-text-muted/20 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-blue-500 border border-border group-hover:border-blue-500/30 transition-all">
          {icon}
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-black">{title}</div>
          <div className="text-[10px] text-text-muted font-bold">{subtitle}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("text-xs font-black", amount.startsWith('-') ? "text-rose-500" : "text-emerald-500")}>
          {amount}
        </div>
        <div className="text-[9px] text-text-muted font-bold">{balance}</div>
      </div>
    </div>
  );
}
