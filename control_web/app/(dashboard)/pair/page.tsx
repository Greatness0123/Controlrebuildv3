"use client";

import { useEffect, useState } from 'react';
import { pairApi } from '@/lib/api';
import { Monitor, Link as LinkIcon, Shield, RefreshCw, Trash2, Smartphone, Terminal, Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
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
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {modal}
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
            <LinkIcon size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Pair Desktop</h1>
            <p className="text-[11px] text-zinc-500 font-medium">Link your local system for secure remote control</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />}
          Pair New Device
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-8">
          
          {/* Input/Generate Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Code Form */}
            <div className="glass-card p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                  <Terminal size={16} className="text-blue-400" />
                </div>
                <h3 className="text-sm font-bold text-white">Enter Desktop Code</h3>
              </div>
              <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                Generate a code on your <strong>Control Desktop</strong> app and enter it here to authorize access.
              </p>
              
              <form onSubmit={handleValidate} className="flex gap-2">
                <input 
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="EX: A1B2C3"
                  maxLength={10}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                />
                <button 
                  type="submit"
                  disabled={validating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {validating ? <Loader2 size={14} className="animate-spin" /> : 'Pair'}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-[10px] font-bold text-red-400">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
              
              {successMsg && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-[10px] font-bold text-green-400">
                  <CheckCircle2 size={14} />
                  {successMsg}
                </div>
              )}
            </div>

            {/* Generate Section */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                    <RefreshCw size={16} className="text-purple-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Generate Web Code</h3>
                </div>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                  Use this if your desktop app asks for a code generated from the web dashboard.
                </p>
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2.5 bg-zinc-900 text-white border border-white/10 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Generate Code
              </button>
            </div>
          </div>

          {/* Device Pairing Display (if generated from web) */}
          {pairingCode && (
            <div className="glass-card p-8 text-center animate-in fade-in slide-in-from-top-4 duration-500 border-green-500/20 bg-green-500/[0.02]">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-2xl mb-4">
                <Smartphone className="text-green-400 w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-2">Web-to-Desktop Code</h2>
              <p className="text-zinc-500 text-sm mb-6">Enter this code in your Control Desktop app settings.</p>
              
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  {pairingCode.split('').map((char, i) => (
                    <div key={i} className="w-12 h-16 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center text-3xl font-mono font-bold text-white shadow-xl">
                      {char}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => copyToClipboard(pairingCode)}
                  className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                  <Copy size={12} />
                  Copy to clipboard
                </button>
              </div>
            </div>
          )}

          {/* Device List */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Paired Devices</h2>
              <button 
                onClick={loadDevices}
                className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-zinc-800" />
              </div>
            ) : devices.length === 0 ? (
              <div className="glass-card p-12 text-center border-dashed border-white/5">
                <Monitor size={32} className="text-zinc-800 mx-auto mb-4" />
                <p className="text-sm text-zinc-600">No devices paired yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {devices.map((device) => (
                  <div key={device.id} className="glass-card p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        device.status === 'paired' ? "bg-green-500/10 border-green-500/20" : 
                        device.status === 'revoked' ? "bg-red-500/5 border-red-500/10" :
                        "bg-zinc-500/10 border-zinc-500/20"
                      )}>
                        <Monitor size={18} className={cn(
                          device.status === 'paired' ? "text-green-400" : 
                          device.status === 'revoked' ? "text-red-900" :
                          "text-zinc-500"
                        )} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{device.name}</h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={cn(
                            "text-[10px] uppercase font-bold tracking-widest",
                            device.status === 'paired' ? "text-green-500" : 
                            device.status === 'revoked' ? "text-red-500" :
                            "text-zinc-600"
                          )}>
                            {device.status}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-800" />
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                            Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.status === 'revoked' && (
                        <button
                          onClick={() => handleRestore(device.id, device.name)}
                          className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-bold hover:bg-green-500/20 transition-all uppercase tracking-wider"
                        >
                          Restore
                        </button>
                      )}
                      {device.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(device.id)}
                          className="p-2.5 text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          title="Revoke Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guide */}
          {!pairingCode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Terminal size={14} className="text-white" />
                  How it works
                </h3>
                <ol className="text-[11px] text-zinc-500 space-y-4 list-decimal pl-4 leading-relaxed">
                  <li>Download and run the <strong>Control Desktop</strong> application on your computer.</li>
                  <li>Click <strong className="text-zinc-300">Pair New Device</strong> above to generate a unique security code.</li>
                  <li>In the desktop app, go to <strong className="text-zinc-300">Settings → Remote Access</strong> and enter the code.</li>
                  <li>Once paired, you can start a chat session and select your desktop as the target.</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <Shield size={14} className="text-white" />
                  Security & Privacy
                </h3>
                <div className="text-[11px] text-zinc-500 space-y-3 leading-relaxed">
                  <p>All connections between the web app and your desktop are <strong>end-to-end encrypted</strong> using WebRTC tunnels.</p>
                  <p>Control agents can only perform actions you authorize. You can disconnect or revoke access at any time from this page.</p>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-600 italic">
                    "Your desktop remains yours. We only provide the bridge."
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
