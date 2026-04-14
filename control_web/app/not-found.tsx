"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { Command, Home, ArrowLeft, Download, ArrowRight } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    console.log('[404] Page not found');
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,255,255,0.1), transparent)`,
          }}
        />
      </div>

      <div className="relative z-10 space-y-8 max-w-md">
        <div className="w-20 h-20 rounded-2xl border border-white/[0.15] flex items-center justify-center mx-auto">
          <Command size={32} className="text-neutral-600" strokeWidth={2} />
        </div>
        
        <div className="space-y-3">
          <h1 className="font-landing text-3xl font-bold text-white tracking-tight">Page Not Found</h1>
          <p className="text-sm text-neutral-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login?next=/workspace"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-neutral-200 transition-colors"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
            Get Started
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/[0.15] text-neutral-400 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4" strokeWidth={2} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}