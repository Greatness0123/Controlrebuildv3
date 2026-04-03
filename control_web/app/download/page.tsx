"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Download, Monitor, Smartphone, Layout, ArrowLeft, ArrowRight, Shield, Zap, Command } from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DownloadPage() {

  const versions = [
    {
      os: "macOS",
      version: "v2.4.0",
      arch: "Universal (Apple Silicon & Intel)",
      icon: <Monitor size={24} />,
      btn: "Download for Mac",
    },
    {
      os: "Windows",
      version: "v2.4.0",
      arch: "x64 / ARM64",
      icon: <Layout size={24} />,
      btn: "Download for Windows",
      primary: true
    },
    {
      os: "Linux",
      version: "v2.3.8 (Beta)",
      arch: "AppImage / .deb",
      icon: <Command size={24} />,
      btn: "Download for Linux",
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent-primary selection:text-white font-sans relative overflow-x-hidden">

      
      {/* Background Graphic */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full opacity-10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
      </div>


      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Back to Home</span>
        </Link>
        <div className="text-sm font-black tracking-tighter text-foreground/50 uppercase">CONTROL STATION</div>
      </nav>


      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        <div className="max-w-3xl mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6"
          >
            <Download size={12} className="text-accent-primary" /> Distribution Channel v2.4.0
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 items-center uppercase leading-tight">Run Control <br /> <span className="text-text-muted">on Your Desktop.</span></h1>
          <p className="text-text-secondary text-base font-medium max-w-lg leading-relaxed">
            Get the full Control experience directly on your hardware. Fast, secure, and ready to master your local apps.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {versions.map((v, i) => (
            <motion.div 
              key={v.os}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={cn(
                "p-8 rounded-3xl border transition-all duration-500 group overflow-hidden shadow-xl flex flex-col justify-between min-h-[340px] relative",
                v.primary ? 'bg-accent-primary text-accent-foreground border-accent-primary' : 'bg-card text-foreground border-border'
              )}
            >
              <div>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-lg",
                  v.primary ? 'bg-black text-white' : 'bg-secondary text-text-muted'
                )}>
                  {v.icon}
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2 uppercase leading-none">{v.os}</h3>
                <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-4", v.primary ? 'text-accent-foreground/60' : 'text-text-muted')}>{v.version} — {v.arch}</p>
                <p className={cn("text-xs font-medium leading-relaxed", v.primary ? 'text-accent-foreground/80' : 'text-text-secondary')}>
                  Full support for voice and visual actions on your local system.
                </p>
              </div>

              <button className={cn(
                "w-full py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 mt-6",
                v.primary ? 'bg-white text-black hover:bg-zinc-100' : 'bg-accent-primary text-accent-foreground hover:opacity-90'
              )}>
                {v.btn} <Download size={14} />
              </button>
            </motion.div>
          ))}

        </div>

        <div className="mt-32 grid lg:grid-cols-2 gap-12 items-center border-t border-white/5 pt-32">
           <div className="space-y-6">
              <h2 className="text-3xl font-black tracking-tighter uppercase">Why Choose Desktop?</h2>
              <div className="space-y-8">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 shadow-lg"><Shield className="text-zinc-400" size={18} /></div>
                    <div>
                       <h4 className="text-lg font-bold mb-1 uppercase tracking-tight">Total Privacy</h4>
                       <p className="text-zinc-500 text-sm font-medium leading-relaxed text-balance">The AI works locally on your hardware. Your screen data and actions never have to leave your machine.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 shadow-lg"><Zap className="text-zinc-400" size={18} /></div>
                    <div>
                       <h4 className="text-lg font-bold mb-1 uppercase tracking-tight">Instant Action</h4>
                       <p className="text-zinc-500 text-sm font-medium leading-relaxed text-balance">Direct hardware access means zero lag between your request and the AI's response.</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="p-10 rounded-[40px] bg-zinc-900/40 border border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 blur-[80px] rounded-full translate-x-1/2" />
              <h3 className="text-xl font-black mb-4 relative z-10 uppercase tracking-tight">Synced with Web</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8 relative z-10 text-balance">Your history and settings are automatically synced between the desktop app and the web dashboard.</p>
              <Link href="/workspace" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white border-b-2 border-white/10 hover:border-white relative z-10 transition-all pb-1">
                Enter Dashboard <ArrowRight size={14} />
              </Link>
           </div>
        </div>
      </main>

      <footer className="py-16 border-t border-white/5 text-center opacity-40">
        <p className="text-zinc-800 text-[10px] font-black uppercase tracking-widest">© 2026 CONTROL AI — Secure Desktop Channel.</p>
      </footer>
    </div>
  );
}
