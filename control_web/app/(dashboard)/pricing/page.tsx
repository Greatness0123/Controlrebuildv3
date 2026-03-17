"use client";

import { useAuthStore } from '@/lib/store';
import { Check, Zap, Shield, Crown, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UpgradeButton from '@/components/UpgradeButton';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const currentPlan = user?.user_metadata?.plan?.toLowerCase() || 'free';

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Ideal for individual exploration and basic task automation.",
      vms: 1,
      sessions: 100,
      features: [
        "1 Cloud VM Instance",
        "100 Task Sessions / Mo",
        "Community Support",
        "Standard Agent Latency",
        "Basic Remote Bridging"
      ],
      color: "zinc"
    },
    {
      name: "Pro",
      price: "$49",
      description: "Enhanced compute power for power users and small projects.",
      vms: 5,
      sessions: 500,
      features: [
        "5 Cloud VM Instances",
        "500 Task Sessions / Mo",
        "Priority Support",
        "High-Speed Agent Loops",
        "Advanced Physical Bridging",
        "Custom Agent Tooling"
      ],
      popular: true,
      color: "blue"
    },
    {
      name: "Master",
      price: "$199",
      description: "Full-scale agent orchestration for enterprise-grade automation.",
      vms: 10,
      sessions: 2000,
      features: [
        "10 Cloud VM Instances",
        "2000 Task Sessions / Mo",
        "Dedicated Tech Manager",
        "Real-time Telemetry Export",
        "Unlimited Physical Bridges",
        "Early Access to Beta Models"
      ],
      color: "purple"
    }
  ];

  const handleSubscribe = (planName: string) => {
    // Flutterwave Integration Placeholder
    // In a real app, this would redirect to a checkout session or open the Flutterwave modal
    const publicKey = "FLWPUBK_TEST-DUMMY-KEY-123456789"; // Dummy Key
    const txRef = `ctrl_${Math.random().toString(36).substring(7)}`;
    
    console.log(`Initializing Flutterwave for plan: ${planName}`);
    console.log(`Public Key: ${publicKey}`);
    console.log(`Reference: ${txRef}`);

    // Simulate redirect to success or payment verification
    alert(`Flutterwave checkout initialized for ${planName}. Please refer to flutterwave_integration.md for next steps.`);
  };

  return (
    <div className="flex-1 overflow-y-auto w-full relative bg-background p-6 sm:p-10 lg:p-20">
      <div className="absolute inset-0 bg-[linear-gradient(var(--border-primary)_1px,transparent_1px),linear-gradient(90deg,var(--border-primary)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">
            <Crown size={12} className="text-yellow-500" /> Subscription Tiers
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tighter mb-6 underline decoration-foreground/5 underline-offset-8">
            Scale Your Compute.
          </h1>
          <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
            Choose a plan that fits your execution needs. Upgrade anytime to unlock more cloud nodes and higher session throughput.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-500 group",
                plan.popular ? "bg-accent-primary text-accent-foreground border-accent-primary shadow-[0_0_50px_rgba(0,0,0,0.1)] scale-105 z-10" : "bg-card text-foreground border-border hover:border-zinc-400"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-xl">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 opacity-50">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                  <span className="text-xs opacity-50 font-bold uppercase tracking-widest">/ month</span>
                </div>
                <p className={cn("text-xs font-medium leading-relaxed", plan.popular ? "text-zinc-600" : "text-zinc-500")}>
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.popular ? "bg-black/5" : "bg-white/5")}>
                    <Check size={12} className={plan.popular ? "text-black" : "text-white"} />
                  </div>
                  <span className="text-xs font-bold tracking-tight">{plan.vms} Cloud VM Instances</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.popular ? "bg-black/5" : "bg-white/5")}>
                    <Check size={12} className={plan.popular ? "text-black" : "text-white"} />
                  </div>
                  <span className="text-xs font-bold tracking-tight">{plan.sessions} Sessions / Month</span>
                </div>
                {plan.features.slice(2).map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.popular ? "bg-accent-foreground/20" : "bg-zinc-100 dark:bg-zinc-900")}>
                      <Check size={12} className={plan.popular ? "text-accent-foreground" : "text-foreground"} />
                    </div>
                    <span className="text-xs font-bold tracking-tight opacity-80">{feat}</span>
                  </div>
                ))}
              </div>

              <UpgradeButton 
                planName={plan.name}
                amount={parseInt(plan.price.replace('$', ''))}
                isPopular={plan.popular}
                disabled={currentPlan === plan.name.toLowerCase()}
              />
            </div>
          ))}
        </div>

        <div className="mt-32 p-10 bg-secondary/40 border border-border rounded-[40px] flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-md">
            <div className="flex items-center gap-3 text-emerald-500 mb-4">
              <Shield size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Enterprise Security</span>
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight mb-4">Custom infrastructure?</h3>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              If you need more than 10 cloud instances or custom hardware integrations, our teams can build a dedicated environment for your agency.
            </p>
          </div>
          <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
            Contact Enterprise Sales
          </button>
        </div>
      </div>
    </div>
  );
}
