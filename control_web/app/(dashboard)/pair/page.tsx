"use client";

import { useEffect, useState } from 'react';
import { pairApi } from '@/lib/api';
import { Monitor, Link as LinkIcon, Shield, RefreshCw, Trash2, Smartphone, Terminal, Loader2, AlertCircle, CheckCircle2, Copy, Activity, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useModal } from '@/lib/useModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PairPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { modal, show, confirm, prompt } = useModal();

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await pairApi.devices();
      setDevices(res.devices);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');
    try {
      const name = await prompt('Enter a name for this device connection:', 'My Desktop', { title: 'Pair New Device' });
      if (!name) return;
      const res = await pairApi.generate(name);
      setPairingCode(res.code);
      loadDevices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    
    setValidating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await pairApi.validate(inputCode);
      setSuccessMsg(`Successfully paired with ${res.name}!`);
      setInputCode('');
      loadDevices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleRestore = async (id: string, name: string) => {
    const ok = await confirm(`This will reactivate access for "${name}".`, {
      title: 'Restore Device Access?',
      confirmLabel: 'Restore',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await pairApi.updateStatus(id, 'paired');
      loadDevices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevoke = async (id: string) => {
    const ok = await confirm('This will disconnect the device and revoke all access immediately.', {
      title: 'Revoke Device Access?',
      confirmLabel: 'Revoke',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await pairApi.revoke(id);
      loadDevices();
    } catch {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    show({ variant: 'success', title: 'Copied!', message: 'Pairing code copied to clipboard.' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
      {modal}
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center border border-border">
            <LinkIcon size={16} className="text-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Device Bridge</h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Multi-node synchronization</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-2 bg-accent-primary text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Monitor size={12} />}
          Initialize Node
        </button>
      </header>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto p-8 lg:p-12 relative z-10 space-y-12">
          
          {/* Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Enter Code */}
            <div className="bg-card border border-border p-8 rounded-[32px] backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center border border-border">
                  <Terminal size={20} className="text-text-muted" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground uppercase tracking-tight">Access Token</h3>
                  <p className="text-[11px] text-text-muted font-medium">Link desktop node via handshake</p>
                </div>
              </div>
              
              <form onSubmit={handleValidate} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="ENTER 6-DIGIT CODE"
                    maxLength={10}
                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-mono tracking-[0.3em] font-black text-foreground focus:outline-none focus:border-accent-primary/30 transition-all uppercase placeholder:text-text-muted/20"
                  />
                  {validating && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 size={18} className="animate-spin text-text-muted" />
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={validating || !inputCode.trim()}
                  className="w-full py-4 bg-accent-primary text-accent-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all disabled:opacity-20 flex items-center justify-center gap-2 border border-accent-primary"
                >
                  Confirm Connection
                </button>
              </form>
              
              {error && (
                <div className="mt-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-500/80">
                  <Activity size={14} />
                  {error}
                </div>
              )}
            </div>

            {/* Quick Setup / Help */}
            <div className="bg-secondary/30 border border-border p-8 rounded-[32px] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center border border-border font-black text-foreground">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight">Node Discovery</h3>
                    <p className="text-[11px] text-text-muted font-medium">Auto-discovery of local instances</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                    Bridge your local system to the Control network. This allows agents to execute tasks directly on your hardware with zero latency.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-card rounded-full text-[9px] font-black text-text-muted uppercase tracking-widest border border-border">E2E Encrypted</span>
                    <span className="px-3 py-1 bg-card rounded-full text-[9px] font-black text-text-muted uppercase tracking-widest border border-border">Zero Config</span>
                    <span className="px-3 py-1 bg-card rounded-full text-[9px] font-black text-text-muted uppercase tracking-widest border border-border">P2P Tunnel</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-8 w-full py-4 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-text-muted hover:text-foreground hover:border-accent-primary transition-all flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Generate Outbound Token
              </button>
            </div>
          </div>

          {/* Pairing Code Result */}
          {pairingCode && (
            <div className="bg-accent-primary text-accent-foreground p-10 rounded-[40px] text-center shadow-2xl animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] mb-8 opacity-40">Secure Synchronization Token</h2>
              <div className="flex justify-center gap-4 mb-10">
                {pairingCode.split('').map((char, i) => (
                  <div key={i} className="w-14 h-20 bg-background text-foreground rounded-2xl flex items-center justify-center text-4xl font-black font-mono shadow-xl border border-border/20">
                    {char}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => copyToClipboard(pairingCode)}
                className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-opacity border-b-2 border-accent-foreground/10 pb-1"
              >
                <Copy size={14} />
                Copy Signature
              </button>
            </div>
          )}

          {/* Device Registry */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <Activity size={14} className="text-text-muted" />
                    <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Hardware Log</h2>
                </div>
                <button onClick={loadDevices} className="text-[9px] font-black text-text-muted hover:text-foreground uppercase tracking-widest transition-all">Rescan Network</button>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center border border-border rounded-[32px] bg-secondary/20">
                <Loader2 size={24} className="animate-spin text-text-muted" />
              </div>
            ) : devices.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-[32px] bg-secondary/10">
                <Monitor size={32} className="text-text-muted opacity-20 mb-6" />
                <p className="text-[10px] uppercase font-black tracking-widest text-text-muted">No nodes registered</p>
                <button onClick={handleGenerate} className="mt-4 text-[9px] font-black text-text-muted flex items-center gap-2 hover:text-foreground transition-all uppercase tracking-widest">
                    Link First Device <Zap size={10}/>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {devices.map((device) => (
                  <div key={device.id} className="bg-card border border-border p-6 rounded-3xl flex items-center justify-between hover:border-accent-primary/20 transition-all group shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                        device.status === 'paired' ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-secondary text-text-muted border-border"
                      )}>
                        <Monitor size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{device.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", device.status === 'paired' ? "bg-emerald-500" : "bg-border")} />
                          <span className={cn(
                            "text-[9px] uppercase font-black tracking-widest",
                            device.status === 'paired' ? "text-emerald-500" : "text-text-muted"
                          )}>
                            {device.status === 'paired' ? 'Connected' : device.status}
                          </span>
                          <div className="w-px h-2 bg-border" />
                          <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                            Sync: {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {device.status === 'paired' && (
                        <button
                          onClick={() => window.open(`/remote/${device.id}`, '_blank')}
                          className="px-6 py-2 bg-accent-primary text-accent-foreground rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl"
                        >
                          Launch
                        </button>
                      )}
                      {device.status === 'revoked' && (
                        <button
                          onClick={() => handleRestore(device.id, device.name)}
                          className="px-6 py-2 bg-zinc-900 text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => handleRevoke(device.id)}
                        className="p-3 text-zinc-800 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Protocols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-border">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <Shield size={16} className="text-text-muted" />
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Security Protocol</h3>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                Bridge connections utilize TLS 1.3 and Aes-256-GCM encryption. Each node is isolated within its own sandbox. Credentials are never stored on the signaling plane.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <Activity size={16} className="text-text-muted" />
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">Tunnel Latency</h3>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                Real-time streaming is powered by WebRTC (H.264). Expected latency is &lt;50ms on standard broadband. P2P direct signaling is enforced where possible.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
