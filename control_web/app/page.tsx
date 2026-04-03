"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Shield, Globe, Cpu, Zap, ArrowRight, 
  Command, Sparkles, ChevronRight, Lock, 
  Layers, Database, Terminal, Smartphone,
  Eye, MousePointer2, Mic, Activity, Check, X,
  ExternalLink, Download, Layout, PlayCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground selection:bg-accent-primary selection:text-white overflow-x-hidden font-sans">

      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-white/5 blur-[120px] rounded-full opacity-20" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-150 contrast-150 mix-blend-overlay pointer-events-none" />
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center pt-20 px-6 text-center relative overflow-hidden">
          <motion.div 
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="max-w-4xl mx-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-border bg-card/40 backdrop-blur-md"
            >
               <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">Master Your Computer • AI-Powered Action</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6 uppercase">
               TALK TO ANY APP. <br /> <span className="text-text-muted">GET IT DONE.</span>
            </h1>

            <p className="text-base md:text-lg text-text-secondary max-w-xl mx-auto mb-10 font-medium leading-relaxed">
              Control is the first AI that uses your computer exactly like you do. No more complex menus or shortcuts. Just tell your computer what you want, and watch it work.
            </p>


            <div className="flex flex-col sm:flex-row gap-5 justify-center mt-4">
              <Link
                href="/workspace"
                className="group relative px-8 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-zinc-200 active:scale-95 flex items-center justify-center gap-3 shadow-2xl"
              >
                Launch Workspace
                <PlayCircle size={16} />
              </Link>
              <Link
                href="/download"
                className="px-8 py-4 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Download Desktop
                <Download size={16} />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mt-24 w-full max-w-5xl aspect-video rounded-[32px] bg-zinc-950 border border-white/5 overflow-hidden shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <img 
              src="https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
              alt="Immersive Control Interface"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer shadow-2xl">
                  <PlayCircle size={32} />
               </div>
            </div>
          </motion.div>
        </section>

        {/* THE EXPERIENCE */}
        <section id="vision" className="max-w-6xl mx-auto px-6 py-16">
           <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6">
              <div className="max-w-xl">
                 <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 uppercase">One Voice. Every App.</h2>
                 <p className="text-text-secondary text-base font-medium leading-relaxed">Stop wasting time learning complex software. Control uses computer vision to understand buttons and menus so you don't have to study manual guides.</p>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-text-muted bg-secondary border border-border px-4 py-2 rounded-full">Vision Ready</div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <FeatureCard 
                className="md:col-span-7 md:h-[320px]"
                icon={<Eye size={18} />}
                title="It Sees Your Screen"
                desc="Just like you, the AI looks at your desktop. It understands what's happening and acts on any app—from Photoshop to Excel—as if it were human."
                img="https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800"
              />
              <FeatureCard 
                className="md:col-span-5 md:h-[320px]"
                icon={<Mic size={18} />}
                title="Say 'Hey Control'"
                desc="Activate your computer with your voice. Turn simple requests like 'Organize my folders' or 'Edit this clip' into completed tasks instantly."
              />
              <FeatureCard 
                className="md:col-span-5 md:h-[300px]"
                icon={<Shield size={18} />}
                title="Your Data, Local"
                desc="We care about your privacy. The magic stays on your machine, and critical actions always ask for your permission first."
              />
              <FeatureCard 
                className="md:col-span-7 md:h-[300px]"
                icon={<Sparkles size={18} />}
                title="Mastery in Seconds"
                desc="You don't need to be an expert. The AI handles the technical menus while you handle the creative vision."
                img="https://images.pexels.com/photos/17483868/pexels-photo-17483868/free-photo-of-digital-technology-art.jpeg?auto=compress&cs=tinysrgb&w=800"
              />
           </div>
        </section>

        {/* COMPARISON */}
        <section id="protocol" className="py-16 bg-secondary/30 border-y border-border">
           <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 uppercase">Why Control?</h2>
                 <p className="text-text-secondary text-base font-medium max-w-lg mx-auto leading-relaxed">Unlike basic chatbots, Control actually has hands. It operates the apps you already use every day.</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">

                 <ComparisonCard 
                    title="Control AI" 
                    subtitle="Human-Like Action"
                    features={["Vision-based: Works on ANY app", "Voice Activated Workflows", "Runs locally on your computer", "No setup or codes needed", "Acts exactly like a human"]}
                    highlight
                 />
                 <ComparisonCard 
                    title="Basic Chatbots" 
                    subtitle="Text Only"
                    features={["Limited to talking", "Cannot push buttons in apps", "Relies on cloud connections", "Confusing setup for desktop", "No vision of your screen"]}
                 />
                 <ComparisonCard 
                    title="Old Automations" 
                    subtitle="Complex Steps"
                    features={["Requires technical links", "Only works on specific web sites", "No desktop app support", "Breaks easily with updates", "Difficult to configure"]}
                 />
              </div>
           </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
           <div className="p-12 md:p-24 rounded-[48px] bg-white text-black text-center relative overflow-hidden shadow-2xl">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 uppercase leading-none">Ready to Take <br /> Control?</h2>
              <p className="text-zinc-600 text-lg font-medium max-w-lg mx-auto mb-10">Start using your computer at the speed of thought.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                 <Link href="/workspace" className="px-10 py-5 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl">Enter Workspace</Link>
                 <Link href="/download" className="text-xs font-black uppercase tracking-widest text-zinc-900 border-b-2 border-black/10 hover:border-black transition-all pb-1 font-bold">Get the Desktop App</Link>
              </div>
           </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-[100] border-b border-white/5 backdrop-blur-2xl bg-black/40"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center">
            <Command className="text-white w-4 h-4" strokeWidth={3} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">CONTROL</span>
        </Link>
        
        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          <Link href="#vision" className="hover:text-white transition-colors">Experience</Link>
          <Link href="#protocol" className="hover:text-white transition-colors">Action</Link>
          <Link href="/download" className="hover:text-white transition-colors">Download</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>

        <Link
          href="/workspace"
          className="px-5 py-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-lg"
        >
          Launch
        </Link>
      </div>
    </motion.nav>
  );
}

function FeatureCard({ title, desc, icon, className, img }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "p-8 rounded-3xl border border-border bg-secondary/50 backdrop-blur-3xl overflow-hidden relative group transition-all duration-500",
        className
      )}
    >
      {img && <img src={img} className="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none grayscale" />}
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-10 h-10 rounded-lg bg-accent-primary text-accent-foreground flex items-center justify-center mb-6 shadow-xl transition-transform group-hover:rotate-3">
          {icon}
        </div>
        <h3 className="text-xl font-black tracking-tight text-foreground mb-3 uppercase leading-none">{title}</h3>
        <p className="text-text-secondary text-sm font-medium leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}


function ComparisonCard({ title, subtitle, features, highlight }: any) {
  return (
    <div className={cn(
      "p-10 rounded-[40px] border transition-all duration-500",
      highlight ? "bg-white text-black border-white shadow-2xl" : "bg-black/40 text-white border-white/5 hover:border-white/20 shadow-xl"
    )}>
       <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4 text-zinc-500">{subtitle}</h4>
       <h3 className="text-3xl font-black tracking-tighter mb-8 uppercase leading-none">{title}</h3>
       <ul className="space-y-4">
          {features.map((f: string, i: number) => (
             <li key={i} className="flex items-start gap-3">
                {highlight ? <Check size={16} className="shrink-0 pt-0.5" /> : <X size={16} className="shrink-0 pt-0.5 text-zinc-700" />}
                <span className={cn("text-sm font-bold", highlight ? "text-zinc-800" : "text-zinc-500")}>{f}</span>
             </li>
          ))}
       </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-32 bg-zinc-950/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-black">
                  <Command size={12} strokeWidth={3} />
               </div>
               <span className="text-xl font-black tracking-tighter uppercase">CONTROL</span>
             </div>
             <p className="text-zinc-600 text-sm font-medium leading-relaxed max-w-xs">
               Master your computer with the power of AI. Your intent, instantly executed.
             </p>
          </div>
          
          <div className="space-y-6">
             <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Protocol</h4>
             <ul className="space-y-3 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                <li><Link href="#vision">Screen Vision</Link></li>
                <li><Link href="/download">Desktop App</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
             </ul>
          </div>
          <div className="space-y-6">
             <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Legal</h4>
             <ul className="space-y-3 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                <li><Link href="#">Terms</Link></li>
                <li><Link href="#">Privacy</Link></li>
                <li><Link href="#">Security</Link></li>
             </ul>
          </div>
          <div className="space-y-6">
             <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Social</h4>
             <ul className="space-y-3 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                <li><Link href="#">Twitter</Link></li>
                <li><Link href="#">GitHub</Link></li>
                <li><Link href="#">Discord</Link></li>
             </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">© 2026 CONTROL AI — Universal Interface.</p>
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
