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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden relative active:scale-[0.99] transition-transform">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-50" />
        
        <header className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">
                {secret ? 'Modify Node' : 'Deploy Node'}
              </h2>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Vault Authentication Protocol</p>
            </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Friendly Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Work Email"
                className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Service / Domain</label>
              <input 
                required
                value={formData.service}
                onChange={e => setFormData(prev => ({ ...prev, service: e.target.value }))}
                placeholder="google.com"
                className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Username / ID</label>
            <input 
              value={formData.username}
              onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="user@example.com"
              className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-white transition-colors" size={16} />
              <input 
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-black border border-white/5 rounded-2xl pl-12 pr-5 py-4 text-sm text-white focus:border-white/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Contextual Notes</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional: specific instructions for AI behavior..."
              rows={3}
              className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-800 focus:border-white/20 transition-all font-medium resize-none"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-5 bg-white text-black rounded-[24px] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} strokeWidth={3} />}
            {secret ? 'Authorize Changes' : 'Seal Vault Node'}
          </button>
        </form>
      </div>
    </div>
  );
}
