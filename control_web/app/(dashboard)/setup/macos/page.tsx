"use client";

import { useState } from 'react';

import Link from 'next/link';
import { ArrowLeft, Check, Copy, Download, Terminal, Cpu, Mic, Monitor, Settings, Wifi, Zap, Apple } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  {
    title: 'Download Control',
    description: 'Download the Control desktop application for macOS.',
    icon: Download,
  },
  {
    title: 'Install the App',
    description: 'Open the .dmg file and drag Control to your Applications folder.',
    icon: Zap,
  },
  {
    title: 'Grant Permissions',
    description: 'On first launch, macOS will prompt for accessibility permissions. Enable Control in System Settings → Privacy & Security.',
    icon: Settings,
  },
  {
    title: 'Microphone Access',
    description: 'Allow microphone access for voice features in System Settings → Privacy & Security → Microphone.',
    icon: Mic,
  },
  {
    title: 'Sign In',
    description: 'Open Control and sign in with your account.',
    icon: Cpu,
  },
];

export default function MacOSSetupPage() {
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
          <h1 className="text-xl font-black text-foreground uppercase tracking-tight">macOS Setup Guide</h1>
          <p className="text-xs text-text-muted">Install Control on macOS 12+ (Monterey or later)</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">System Requirements</h2>
          <ul className="text-xs text-text-muted space-y-1">
            <li>• macOS 12 (Monterey) or later</li>
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
          <button onClick={() => copyCommand('⌘+Shift+C', 1)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">New Session</span>
            <span className="text-foreground font-mono">{copiedStep === 1 ? <Check size={12} /> : '⌘+Shift+C'}</span>
          </button>
          <button onClick={() => copyCommand('⌘+Shift+V', 2)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">Voice Mode</span>
            <span className="text-foreground font-mono">{copiedStep === 2 ? <Check size={12} /> : '⌘+Shift+V'}</span>
          </button>
          <button onClick={() => copyCommand('⌘+Shift+D', 3)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">Desktop View</span>
            <span className="text-foreground font-mono">{copiedStep === 3 ? <Check size={12} /> : '⌘+Shift+D'}</span>
          </button>
          <button onClick={() => copyCommand('⌘+Q', 4)} className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg hover:bg-card-hover transition-colors">
            <span className="text-text-muted">Quit</span>
            <span className="text-foreground font-mono">{copiedStep === 4 ? <Check size={12} /> : '⌘+Q'}</span>
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">Troubleshooting</h2>
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-medium text-foreground mb-1">Permission denied</p>
            <p className="text-text-muted">Go to System Settings → Privacy & Security → Accessibility and add Control. You may need to unlock the settings first.</p>
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-medium text-foreground mb-1">Microphone not working</p>
            <p className="text-text-muted">Check System Settings → Privacy & Security → Microphone. Ensure Control is allowed.</p>
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <p className="font-medium text-foreground mb-1">App damaged error</p>
            <p className="text-text-muted">Run: sudo xattr -cr /Applications/Control.app in Terminal to remove extended attributes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}