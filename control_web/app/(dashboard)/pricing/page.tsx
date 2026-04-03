"use client";

import { useAuthStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Check, Zap, Shield, Crown, ArrowRight, X, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import UpgradeButton from '@/components/UpgradeButton';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { motion } from 'framer-motion';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPlan = user?.user_metadata?.plan?.toLowerCase() || 'free';
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowSuccessModal(true);
    }
  }, [searchParams]);

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Ideal for individual exploration and basic app automation.",
      features: [
        "1 Cloud VM Instance",
        "100 Task Sessions / Mo",
        "Community Support",
        "Standard Agent Speed",
        "Basic Remote Access"
      ],
      color: "zinc"
    },
    {
      name: "Pro",
      price: "$29",
      description: "Enhanced power for regular users and bigger projects.",
      features: [
        "5 Cloud VM Instances",
        "500 Task Sessions / Mo",
        "Priority Support",
        "High-Speed Agent Loops",
        "Advanced System Access",
        "Custom Agent Tooling"
      ],
      popular: true,
      color: "blue"
    },
    {
      name: "Master",
      price: "$59",
      description: "Full-scale orchestration for power users who want it all.",
      features: [
        "10 Cloud VM Instances",
        "2000 Task Sessions / Mo",
        "Dedicated Tech Support",
        "Real-time Data Export",
        "Unlimited Remote Links",
        "Early Beta Access"
      ],
      color: "purple"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Dedicated infrastructure and personalized setups.",
      features: [
        "Custom VM Instance Pools",
        "Dedicated Hardware Setup",
        "99.9% Uptime SLA",
        "Enterprise SSO Support",
        "Personal Onboarding",
        "24/7 Priority Concierge"
      ],
      color: "emerald"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto w-full relative bg-background text-foreground p-6 sm:p-10 lg:px-20 lg:py-16 selection:bg-accent-primary selection:text-white font-sans">

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      {showSuccessModal && (
        <Modal
          open={showSuccessModal}
          onClose={() => { setShowSuccessModal(false); router.replace('/workspace'); }}
          variant="success"
          title="Payment Successful"
          message="Your account has been upgraded. Start taking control now."
          confirmLabel="Back to Workspace"
        />
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12 animate-in fade-in duration-1000">
          <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Back to Home</span>
          </Link>
          <div className="text-xl font-black tracking-tighter uppercase text-foreground">CONTROL</div>
        </div>


        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6"
          >
            <Crown size={12} className="text-accent-primary" /> Scaling Options
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 leading-tight uppercase">Simple Plans. <br /> <span className="text-text-muted">Zero Confusion.</span></h1>
          <p className="text-text-secondary text-base font-medium max-w-xl mx-auto leading-relaxed">
            Choose the right level of power for your digital environment. Scale from basic automation to full cloud clusters.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-500 group overflow-hidden shadow-xl",
                plan.popular ? "bg-accent-primary text-accent-foreground border-accent-primary z-10" : "bg-card text-foreground border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-black text-white text-[8px] font-black uppercase px-6 py-3 rounded-bl-2xl tracking-widest">
                  Best Value
                </div>
              )}

              <div className="mb-10 relative z-10">
                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50")}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black tracking-tighter">
                    {plan.price}
                  </span>
                  {plan.price !== 'Custom' && <span className={cn("text-[10px] font-black uppercase tracking-widest ml-1 opacity-40")}>/ Mo</span>}
                </div>
                <p className={cn("text-xs font-medium leading-relaxed mb-8", plan.popular ? "text-zinc-800" : "text-zinc-500")}>
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-12 flex-1 relative z-10">
                 {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                       <Check size={14} className={cn("shrink-0 pt-0.5", plan.popular ? "text-black" : "text-zinc-600")} />
                       <span className={cn("text-xs font-bold leading-tight", plan.popular ? "text-zinc-900" : "text-zinc-500")}>{feat}</span>
                    </div>
                 ))}
              </div>

              <div className="relative z-10 mt-auto">
                 {plan.name === 'Enterprise' ? (
                   <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all active:scale-95">Contact Sales</button>
                 ) : (
                   <UpgradeButton 
                     planName={plan.name}
                     amount={parseInt(plan.price.replace('$', ''))}
                     isPopular={plan.popular}
                     disabled={currentPlan === plan.name.toLowerCase()}
                   />
                 )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-32 p-12 bg-zinc-900/40 border border-white/5 rounded-[40px] flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-[120px] rounded-full translate-x-1/2" />
          <div className="max-w-xl relative z-10">
            <div className="flex items-center gap-4 text-white mb-6">
              <Shield size={24} />
               <h3 className="text-2xl font-black tracking-tight uppercase">Custom Enterprise</h3>
            </div>
            <p className="text-base text-zinc-500 font-medium leading-relaxed">
              Need custom hardware or on-premise security? We build tailored architectures for your specific scale and security compliance.
            </p>
          </div>
          <button className="px-10 py-5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-4 relative z-10 active:scale-95">
            Talk to Us <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>

      <footer className="py-20 border-t border-white/5 text-center mt-20 opacity-40">
         <p className="text-[10px] font-black uppercase tracking-[0.4em]">© 2026 CONTROL AI — Scaled Command.</p>
      </footer>
    </div>
  );
}
