"use client";

import { useState, useEffect } from 'react';
import { X, Loader2, Shield, Lock } from 'lucide-react';
import { vaultApi } from '@/lib/api';

interface SecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: any;
  onSaved: () => void;
}

export function SecretDialog({ open, onOpenChange, secret, onSaved }: SecretDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    username: '',
    password: '',
    notes: ''
  });

  useEffect(() => {
    if (secret) {
      setFormData({
        name: secret.name || '',
        service: secret.service || '',
        username: secret.username || '',
        password: secret.password || '',
        notes: secret.notes || ''
      });
    } else {
      setFormData({
        name: '',
        service: '',
        username: '',
        password: '',
        notes: ''
      });
    }
  }, [secret, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (secret) {
        await vaultApi.update(secret.id, formData);
      } else {
        await vaultApi.create(formData);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-text-muted focus:border-border focus:outline-none transition-all font-medium';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md max-h-[min(92vh,640px)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="secret-dialog-title"
      >
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500/80 via-purple-500/80 to-cyan-500/80 opacity-60" />

        <header className="px-4 pt-4 pb-3 flex items-start justify-between gap-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-secondary border border-border rounded-xl flex items-center justify-center shrink-0">
              <Shield className="text-foreground" size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="secret-dialog-title" className="text-base font-black text-foreground tracking-tight truncate">
                {secret ? 'Edit secret' : 'Add secret'}
              </h2>
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                Stored credentials for automation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 rounded-lg hover:bg-card-hover flex items-center justify-center text-text-muted hover:text-foreground transition-all shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-0.5">Name</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Work email"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-0.5">Service</label>
              <input
                required
                value={formData.service}
                onChange={(e) => setFormData((prev) => ({ ...prev, service: e.target.value }))}
                placeholder="e.g. app.example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-0.5">Username</label>
            <input
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Optional"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-0.5">Password</label>
            <div className="relative group">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-foreground transition-colors pointer-events-none"
                size={14}
              />
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-0.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional context (not shown to models by default)"
              rows={2}
              className={`${inputClass} resize-none min-h-[4rem]`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent-primary text-accent-foreground rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Shield size={14} strokeWidth={2.5} />}
            {secret ? 'Save changes' : 'Save secret'}
          </button>
        </form>
      </div>
    </div>
  );
}
