"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Monitor, Shield, Globe, Cpu, Zap, ArrowRight, Command, Sparkles, ChevronRight } from 'lucide-react';

const ROTATING_WORDS = ['Your Computer', 'Virtual Machines', 'Remote Teams', 'Everything'];

export default function LandingPage() {
  const { user } = useAuthStore();
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="min-h-screen bg-black text-white" onMouseMove={handleMouseMove}>
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent 70%)',
            left: mousePos.x - 400,
            top: mousePos.y - 400,
            transition: 'left 0.5s ease-out, top 0.5s ease-out',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Command className="text-black w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">CONTROL <span className="text-zinc-500">WEB</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Performance</a>
            <a href="#cta" className="hover:text-white transition-colors">Get Started</a>
          </div>
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
            >
              Dashboard
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-all"
            >
              Sign In
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-medium tracking-wide uppercase bg-white/5 border border-white/10 rounded-full text-zinc-400">
            <Sparkles size={12} className="text-blue-400" />
            AI-Powered Remote Control
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-4">
            <span className="gradient-text-white">Control</span>
          </h1>
          <div className="h-20 md:h-24 flex items-center justify-center overflow-hidden mb-8">
            <span
              key={wordIndex}
              className="text-4xl md:text-6xl font-black tracking-tighter gradient-text animate-fade-in-up"
            >
              {ROTATING_WORDS[wordIndex]}
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
            The ultimate command center for your computing resources.
            Access local systems and virtual machines with AI-powered assistance — from anywhere.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
            <Link
              href="/dashboard"
              className="btn-glow px-8 py-4 text-base flex items-center gap-3 rounded-xl"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 text-base border border-white/10 rounded-xl font-medium text-zinc-300 hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
            >
              Learn More
              <ChevronRight size={16} />
            </a>
          </div>
        </div>

        {/* Hero Visual — Dashboard Preview */}
        <div className="mt-20 animate-fade-in-up animation-delay-500">
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Mock Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-zinc-900 rounded-md px-4 py-1.5 text-xs text-zinc-500 text-center">
                    control-web.app/dashboard
                  </div>
                </div>
              </div>
              {/* Mock Dashboard Content */}
              <div className="p-6 grid grid-cols-4 gap-4 h-64">
                <div className="col-span-1 space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Ubuntu VM
                    </div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="w-2 h-2 rounded-full bg-zinc-600" />
                      MacBook Pro
                    </div>
                  </div>
                </div>
                <div className="col-span-2 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <Monitor size={32} className="mx-auto mb-2 text-zinc-600" />
                    <p className="text-xs text-zinc-600">Remote Display</p>
                  </div>
                </div>
                <div className="col-span-1 space-y-3">
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">CPU</div>
                    <div className="text-lg font-bold">12%</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Memory</div>
                    <div className="text-lg font-bold">2.4 GB</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                    <div className="text-[10px] text-zinc-600 uppercase font-bold mb-1">Latency</div>
                    <div className="text-lg font-bold text-green-400">24ms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 gradient-text-white">
              Everything you need
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Powerful tools for remote management, built for professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Monitor />}
              title="Remote Dashboard"
              description="View and control your connected systems in real-time through high-performance WebRTC streaming."
              gradient="from-blue-500/20 to-cyan-500/20"
            />
            <FeatureCard
              icon={<Shield />}
              title="Secure Pairing"
              description="End-to-end encrypted connections between your local desktop app and the cloud dashboard."
              gradient="from-purple-500/20 to-pink-500/20"
            />
            <FeatureCard
              icon={<Globe />}
              title="VM Management"
              description="Spin up cloud virtual machines on demand for isolated testing and automation tasks."
              gradient="from-green-500/20 to-emerald-500/20"
            />
            <FeatureCard
              icon={<Cpu />}
              title="AI Task Execution"
              description="Instruct AI to handle tasks on remote machines — from file management to running scripts."
              gradient="from-orange-500/20 to-amber-500/20"
            />
            <FeatureCard
              icon={<Zap />}
              title="Low Latency"
              description="Optimized for sub-30ms response times with adaptive bitrate streaming and edge servers."
              gradient="from-yellow-500/20 to-orange-500/20"
            />
            <FeatureCard
              icon={<Sparkles />}
              title="Smart Automation"
              description="Build custom workflows that chain multiple AI actions across your fleet of machines."
              gradient="from-indigo-500/20 to-violet-500/20"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="relative z-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBlock value="99.9%" label="Uptime SLA" />
            <StatBlock value="<30ms" label="Avg Latency" />
            <StatBlock value="256-bit" label="Encryption" />
            <StatBlock value="24/7" label="Monitoring" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative z-10 py-32 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 gradient-text-white">
            Ready to take control?
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            Set up your first remote session in under two minutes. No credit card required.
          </p>
          <Link
            href="/dashboard"
            className="btn-glow inline-flex items-center gap-3 px-10 py-5 text-lg rounded-2xl"
          >
            Open Dashboard
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Command size={14} />
            <span>&copy; {new Date().getFullYear()} Control AI. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-xs text-zinc-600">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: { icon: React.ReactNode; title: string; description: string; gradient: string }) {
  return (
    <div className="glass-card p-6 group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:border-white/20 transition-colors">
          {React.cloneElement(icon as React.ReactElement, { size: 22, className: 'text-zinc-400 group-hover:text-white transition-colors' })}
        </div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{description}</p>
      </div>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-6">
      <div className="text-3xl md:text-4xl font-black tracking-tight gradient-text mb-2">{value}</div>
      <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}
