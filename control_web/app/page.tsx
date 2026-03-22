"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { 
  Monitor, Shield, Globe, Cpu, Zap, ArrowRight, 
  Command, Sparkles, ChevronRight, Lock, 
  Layers, Database, Terminal, Smartphone
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ROTATING_WORDS = ['Infrastructure', 'Virtual Instances', 'Remote Bridges', 'Hyper-loops'];

export default function LandingPage() {
  const { user } = useAuthStore();
  const [wordIndex, setWordIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020202] text-white selection:bg-white selection:text-black overflow-x-hidden font-sans">

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3 baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
      </div>

      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-[100] border-b border-white/5 backdrop-blur-2xl bg-black/40"
      >
        <div className="max-w-7xl mx-auto px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-8 h-8 md:w-9 md:h-9 border-2 border-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
              <Command className="text-white w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter">CONTROL <span className="text-zinc-500 font-medium">WEB</span></span>
          </div>
          
          <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <a href="#logic" className="hover:text-white transition-colors">Architecture</a>
            <a href="#protocol" className="hover:text-white transition-colors">Protocol</a>
            <a href="#vault" className="hover:text-white transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {user ? (
              <Link
                href="/workspace"
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 bg-white text-black rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/10 active:scale-95"
              >
                <span className="hidden xs:inline">Workspace</span>
                <span className="xs:hidden">Open</span>
                <ArrowRight size={12} className="md:w-[14px] md:h-[14px]" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="hidden sm:inline px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 md:px-5 py-2 bg-white text-black rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/10"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 pt-32 md:pt-48">

        <section className="max-w-7xl mx-auto px-6 pb-32">
          <motion.div 
            style={{ opacity, scale }}
            className="flex flex-col items-center text-center"
          >

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-4 py-2 mb-12 text-[9px] font-black tracking-[0.4em] uppercase bg-white/5 border border-white/10 rounded-full text-zinc-400 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Neural Signal: Connected
            </motion.div>

            <h1 className="text-[14vw] md:text-[10vw] font-black tracking-tighter leading-[0.8] mb-8 text-white">
              CONTROL
            </h1>

            <div className="h-20 md:h-28 flex items-center justify-center overflow-hidden mb-12">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl md:text-6xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            <p className="text-base md:text-xl text-zinc-500 max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
              Orchestrate autonomous agent logic across distributed virtual environments. 
              The most advanced command layer for LLM-driven remote system operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href={user ? "/workspace" : "/auth/signup"}
                className="group relative px-10 py-5 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95 flex items-center gap-4"
              >
                Launch Protocol
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="px-10 py-5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 transition-all active:scale-95 flex items-center gap-4"
              >
                View Plans
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mt-32 relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
            <div className="relative aspect-video rounded-[32px] bg-zinc-950 border border-white/5 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070" 
                className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
                alt="Command Interface"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 z-20">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <Zap className="text-white" size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight mb-2">Zero-latency Execution</h3>
                    <p className="text-zinc-500 text-sm font-medium">Native VNC bridge with integrated AI agent signaling.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="logic" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <BentoCard 
              className="md:col-span-8 md:h-[400px]"
              icon={<Layers className="text-blue-500" />}
              title="Hyper-layered Virtualization"
              desc="Instant-on Linux containers optimized for agentic workflows. Deploy, execute, and destroy in milliseconds."
              bg="bg-gradient-to-br from-blue-500/10 to-transparent"
            />
            <BentoCard 
              className="md:col-span-4 md:h-[400px]"
              icon={<Shield className="text-purple-500" />}
              title="Secure Vault"
              desc="Encrypted credential management. Feed logins to agents without exposing them."
              bg="bg-gradient-to-br from-purple-500/10 to-transparent"
            />
            <BentoCard 
              className="md:col-span-4 md:h-[350px]"
              icon={<Smartphone className="text-emerald-500" />}
              title="Remote Bridge"
              desc="Connect physical devices to your cloud agent logic."
              bg="bg-gradient-to-br from-emerald-500/10 to-transparent"
            />
            <BentoCard 
              className="md:col-span-8 md:h-[350px]"
              icon={<Terminal className="text-zinc-400" />}
              title="Unified Signal Protocol"
              desc="A single interface to rule every instance. Shared memory, global clipboard, and low-level system access across all deployments."
              bg="bg-gradient-to-br from-zinc-500/5 to-transparent"
            />
          </div>
        </section>

        <section id="protocol" className="max-w-7xl mx-auto px-6 py-32 bg-zinc-950/30 rounded-[64px] border border-white/5 mb-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 text-[9px] font-black tracking-[0.4em] uppercase bg-white/5 border border-white/10 rounded-full text-zinc-400">
                Advanced Protocol Specs
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-8 text-white">
                THE NEXT LAYER OF <br/> <span className="text-zinc-600">AGENTIC COMPUTE.</span>
              </h2>
              <div className="space-y-8">
                <SpecItem icon={<Zap size={18}/>} title="32ms Latency" desc="Proprietary signaling protocol designed for zero-lag agent interactions." />
                <SpecItem icon={<Lock size={18}/>} title="E2E Isolation" desc="Each session exists in a hardened sandbox with temporary storage." />
                <SpecItem icon={<Database size={18}/>} title="Native Integration" desc="Works seamlessly with Gemini, GPT-4, and Claude via our agent SDK." />
              </div>
            </div>
            <div className="bg-black/40 border border-white/5 p-1 rounded-[40px] shadow-2xl">
              <div className="bg-zinc-900/50 rounded-[36px] p-8 aspect-square flex flex-col justify-center gap-10">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex justify-around items-end gap-4 h-48">
                   {[40, 70, 45, 90, 60, 80, 55].map((h, i) => (
                     <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        key={i} 
                        className="w-8 md:w-12 bg-white/10 border border-white/20 rounded-t-xl hover:bg-white transition-all cursor-pointer" 
                     />
                   ))}
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Signal Throughput Optimization</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-32 bg-zinc-950/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-32">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-8">
                 <Command size={24} />
                 <span className="text-2xl font-black tracking-tighter">CONTROL</span>
              </div>
              <p className="text-zinc-600 text-sm font-medium leading-relaxed">
                Empowering the next generation of autonomous digital intelligence through robust, localized compute.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
              <FooterColumn title="Protocol" links={['Architecture', 'Signals', 'Security', 'Pricing']} />
              <FooterColumn title="Company" links={['About', 'Ventures', 'Careers', 'Contact']} />
              <FooterColumn title="Social" links={['X / Twitter', 'GitHub', 'Discord']} />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center py-10 border-t border-white/5 gap-6">
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">© 2026 Advanced Agentic Coding Inc. — All Signal Reserved.</p>
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Network Operational</span>
               </div>
               <span className="text-zinc-800 text-[10px] font-black">SATELLITE BRIDGE V4.2</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BentoCard({ title, desc, icon, className, bg }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "p-10 rounded-[40px] border border-white/5 bg-zinc-950/40 backdrop-blur-3xl overflow-hidden relative group transition-all duration-500",
        className
      )}
    >
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000", bg)} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-2xl">
          {icon}
        </div>
        <h3 className="text-2xl font-black tracking-tight text-white mb-4 leading-none">{title}</h3>
        <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xs">{desc}</p>
        <div className="mt-auto pt-10">
           <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:border-white/30 transition-all">
             <ChevronRight size={16} />
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function SpecItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="mt-1 w-12 h-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:text-white group-hover:bg-white/10 transition-all duration-500 text-zinc-500">
        {icon}
      </div>
      <div>
        <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
        <p className="text-zinc-500 text-sm font-medium">{desc}</p>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: any) {
  return (
    <div className="space-y-6">
      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{title}</h4>
      <ul className="space-y-4">
        {links.map((l: string) => (
          <li key={l}>
            <a href="#" className="text-zinc-600 text-xs font-bold hover:text-white transition-colors uppercase tracking-widest">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
