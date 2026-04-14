"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { Command, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  useEffect(() => {
    console.log('[404] Page not found');
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
        <Command size={32} className="text-text-muted" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Page Not Found</h1>
        <p className="text-xs text-text-muted max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-accent-foreground rounded-lg text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <Home size={14} />
          Go to Workspace
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-text-secondary rounded-lg text-xs font-bold hover:bg-card-hover transition-all"
        >
          <ArrowLeft size={14} />
          Home
        </Link>
      </div>
    </div>
  );
}