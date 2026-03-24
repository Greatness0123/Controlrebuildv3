"use client";

import { useEffect, useState, useCallback } from 'react';
import { pairApi } from '@/lib/api';
import { useDeviceStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  Loader2, Laptop, Shield, Trash2,
  X, Monitor, RotateCcw
} from 'lucide-react';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PairPage() {
  const { devices, setDevices } = useDeviceStore();
  const [codeInput, setCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const res = await pairApi.devices();
      setDevices(res.devices || []);
    } catch {}
  }, [setDevices]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

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
            Enter a pairing code from your desktop application to link it to your web dashboard.
          </p>
        </div>

        {/* Validate Code Section */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border text-text-muted flex items-center justify-center">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Enter Pairing Code</h2>
              <p className="text-xs text-text-muted">Enter the code displayed in your desktop app</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 min-w-0 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-text-muted outline-none focus:border-border transition-all font-mono"
              onKeyDown={e => e.key === 'Enter' && validateCode()}
            />
            <button
              onClick={validateCode}
              disabled={isValidating || !codeInput.trim()}
              className="px-6 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {isValidating ? <Loader2 size={14} className="animate-spin" /> : 'Validate Device'}
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
                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
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
                    className="flex items-center gap-2 px-3 py-2 text-text-muted hover:text-foreground hover:bg-card-hover rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100 text-xs font-bold"
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
            <Monitor size={32} className="text-text-muted mb-4 opacity-30" />
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">No devices paired yet</p>
            <p className="text-[11px] text-text-muted mt-2">Enter a code from your desktop app above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
