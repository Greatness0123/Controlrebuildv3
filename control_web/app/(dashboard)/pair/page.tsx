"use client";

import { useEffect, useState, useCallback } from 'react';
import { pairApi } from '@/lib/api';
import { useDeviceStore, useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  LinkIcon, Copy, RefreshCw, Loader2, Smartphone, Laptop, Shield, Trash2,
  Check, X, Monitor, Clock, RotateCcw
} from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PairPage() {
  const { devices, setDevices } = useDeviceStore();
  const { user } = useAuthStore();
  const [pairingCode, setPairingCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const res = await pairApi.devices();
      setDevices(res.devices || []);
    } catch {}
  }, [setDevices]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const name = `${user?.user_metadata?.name || 'User'}'s Device`;
      const res = await pairApi.generate(name);
      setPairingCode(res.code);
      toast.success('Pairing code generated');
      loadDevices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const validateCode = async () => {
    if (!codeInput.trim()) return;
    setIsValidating(true);
    try {
      await pairApi.validate(codeInput);
      toast.success('Device paired successfully');
      setCodeInput('');
      loadDevices();
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsValidating(false);
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      await pairApi.revoke(deviceId);
      toast.success('Device revoked');
      loadDevices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke');
    }
  };

  const restoreDevice = async (deviceId: string) => {
    try {
      await pairApi.updateStatus(deviceId, 'paired');
      toast.success('Device restored');
      loadDevices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore');
    }
  };

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pairedDevices = devices.filter(d => d.status === 'paired');
  const revokedDevices = devices.filter(d => d.status === 'revoked');

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6 sm:p-10 lg:p-12 space-y-12">
        
        {/* Header */}
        <div className="border-l-2 border-accent-primary pl-6 py-2">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Device Pairing
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-md">
            Connect your desktop application to the web dashboard for remote AI control.
          </p>
        </div>

        {/* Generate Code Section */}
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary text-accent-foreground flex items-center justify-center">
              <LinkIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Generate Pairing Code</h2>
              <p className="text-xs text-text-muted">Create a code to link your desktop app</p>
            </div>
          </div>

          {pairingCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-secondary border border-border rounded-xl px-6 py-4 font-mono text-xl font-black text-foreground tracking-[0.5em] text-center">
                  {pairingCode}
                </div>
                <button
                  onClick={copyCode}
                  className="p-4 bg-secondary border border-border rounded-xl text-text-muted hover:text-foreground hover:bg-card-hover transition-all"
                  title="Copy code"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
              <button
                onClick={generateCode}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-card-hover border border-border rounded-xl text-xs font-bold text-text-muted hover:text-foreground transition-all"
              >
                <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
                Regenerate
              </button>
            </div>
          ) : (
            <button
              onClick={generateCode}
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
              {isGenerating ? 'Generating...' : 'Generate Pairing Code'}
            </button>
          )}
        </div>

        {/* Validate Code Section */}
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border text-text-muted flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Enter Pairing Code</h2>
              <p className="text-xs text-text-muted">Enter a code from another device to pair</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-text-muted outline-none focus:border-border transition-all font-mono"
              onKeyDown={e => e.key === 'Enter' && validateCode()}
            />
            <button
              onClick={validateCode}
              disabled={isValidating || !codeInput.trim()}
              className="px-6 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isValidating ? <Loader2 size={14} className="animate-spin" /> : 'Validate'}
            </button>
          </div>
        </div>

        {/* Paired Devices */}
        {pairedDevices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <Monitor size={13} className="text-text-muted" />
              <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Paired Devices ({pairedDevices.length})</h3>
            </div>
            <div className="space-y-3">
              {pairedDevices.map(device => (
                <div key={device.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Laptop size={16} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{device.name || 'Unnamed Device'}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeDevice(device.id)}
                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Revoke access"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revoked Devices */}
        {revokedDevices.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <X size={13} className="text-text-muted" />
              <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Revoked Devices ({revokedDevices.length})</h3>
            </div>
            <div className="space-y-3">
              {revokedDevices.map(device => (
                <div key={device.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group opacity-60 hover:opacity-100 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                      <Laptop size={16} className="text-text-muted" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-text-secondary truncate">{device.name || 'Unnamed Device'}</h4>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Revoked</span>
                    </div>
                  </div>
                  <button
                    onClick={() => restoreDevice(device.id)}
                    className="flex items-center gap-2 px-3 py-2 text-text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-all opacity-0 group-hover:opacity-100 text-xs font-bold"
                    title="Restore access"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {devices.length === 0 && (
          <div className="bg-secondary border border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <Smartphone size={32} className="text-text-muted mb-4 opacity-30" />
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">No devices paired yet</p>
            <p className="text-[11px] text-text-muted mt-2">Generate a pairing code above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
