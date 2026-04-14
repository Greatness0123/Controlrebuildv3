"use client";

import type { Metadata } from 'next';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'Windows Setup Guide - Control Desktop App',
  description: 'Step-by-step guide to install and set up Control on Windows 10 or 11. Voice setup, permissions, and troubleshooting.',
  keywords: [
    'Control Windows installation',
    'Windows AI agent setup',
    'Control desktop app Windows',
    'AI software Windows 10',
    'Windows automation setup',
  ],
};
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Download, Terminal, Cpu, Mic, Monitor, Settings, Wifi, Zap } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  {
    title: 'Download Control',
    description: 'Download the Control desktop application for Windows.',
    icon: Download,
  },
  {
    title: 'Run the Installer',
    description: 'Double-click the downloaded .exe file and follow the installation wizard.',
    icon: Zap,
  },
  {
    title: 'Launch Control',
    description: 'Open Control from your Start Menu or desktop shortcut.',
    icon: Cpu,
  },
  {
    title: 'Sign In',
    description: 'Sign in with your Control account to connect to cloud machines or pair with your device.',
    icon: Settings,
  },
  {
    title: 'Voice Setup (Optional)',
    description: 'Enable "Hey Control" wake word or use push-to-talk in settings.',
    icon: Mic,
  },
];

export default function WindowsSetupPage() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyCommand = (cmd: string, step: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedStep(step);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/download"
          className="p-2 hover:bg-card-hover rounded-lg text-text-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Windows Setup Guide</h1>
          <p className="text-xs text-text-muted">Install Control on Windows 10 or 11</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">System Requirements</h2>
          <ul className="text-xs text-text-muted space-y-1">
            <li>• Windows 10 (version 1903+) or Windows 11</li>
            <li>• 4GB RAM minimum (8GB recommended)</li>
            <li>• 500MB disk space</li>
            <li>• Microphone for voice control (optional)</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
              <step.icon size={18} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest">Step {i + 1}</span>
                <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
              </div>
              <p className="text-xs text-text-muted">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button onClick={() => copyCommand('Ctrl+Shift+C', 1)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">New Session</span>
            <span className="text-foreground font-mono">{copiedStep === 1 ? <Check size={12} /> : 'Ctrl+Shift+C'}</span>
          </button>
          <button onClick={() => copyCommand('Ctrl+Shift+V', 2)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">Voice Mode</span>
            <span className="text-foreground font-mono">{copiedStep === 2 ? <Check size={12} /> : 'Ctrl+Shift+V'}</span>
          </button>
          <button onClick={() => copyCommand('Ctrl+Shift+D', 3)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">Desktop View</span>
            <span className="text-foreground font-mono">{copiedStep === 3 ? <Check size={12} /> : 'Ctrl+Shift+D'}</span>
          </button>
          <button onClick={() => copyCommand('Ctrl+Shift+Q', 4)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">Quit</span>
            <span className="text-foreground font-mono">{copiedStep === 4 ? <Check size={12} /> : 'Ctrl+Shift+Q'}</span>
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Troubleshooting</h2>
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-medium text-foreground mb-1">Microphone not detected</p>
            <p className="text-text-muted">Go to Windows Settings → Privacy → Microphone and ensure Control has access. Also check the app is not blocked by antivirus.</p>
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-medium text-foreground mb-1">Wake word not responding</p>
            <p className="text-text-muted">Ensure your microphone is set as the default recording device in Windows sound settings.</p>
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-medium text-foreground mb-1">High CPU usage</p>
            <p className="text-text-muted">Close other resource-intensive apps or lower the quality in Settings → Voice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}