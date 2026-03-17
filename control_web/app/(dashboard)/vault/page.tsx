"use client";

import { useState, useEffect } from 'react';
import { 
  Key, Shield, Plus, Trash2, Eye, EyeOff, Search, 
  Lock, ExternalLink, MoreVertical, ShieldCheck,
  Globe, User as UserIcon, AlertCircle, Loader2
} from 'lucide-react';
import { vaultApi } from '@/lib/api';
import { useModal } from '@/lib/useModal';
import { SecretDialog } from './SecretDialog';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function VaultPage() {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<any>(null);
  const { modal, confirm } = useModal();

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      const data = await vaultApi.list();
      setSecrets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm(`Are you sure you want to delete the credentials for ${name}?`, {
      title: 'Delete Secret',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });
    if (!ok) return;

    try {
      await vaultApi.delete(id);
      setSecrets(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSecrets = secrets.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.service.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black overflow-y-auto p-4 md:p-10">
      {modal}
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Secure Vault</h1>
          </div>
          <p className="text-zinc-500 text-sm max-w-xl font-medium leading-relaxed">
            Store access credentials for your virtualized workflows. These secrets are injected directly into targets and are never exposed to the AI model's training or history.
          </p>
        </header>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Filter vault nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-white/20 transition-all font-medium"
            />
          </div>
          <button 
            onClick={() => { setEditingSecret(null); setDialogOpen(true); }}
            className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
          >
            <Plus size={14} strokeWidth={3} />
            Add Secret
          </button>
        </div>

        {/* Security Banner */}
        <div className="mb-10 p-6 bg-zinc-950/50 border border-white/5 rounded-3xl flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-emerald-500" size={16} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">End-to-End Isolation</h3>
            <p className="text-zinc-500 text-[11px] leading-relaxed font-medium">
              Your credentials are never stored in plain text on the edge. They are only decrypted at the moment of injection into a secured VM or remote bridge.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-zinc-700" size={32} />
          </div>
        ) : filteredSecrets.length === 0 ? (
          <div className="text-center py-24 bg-zinc-950/40 border border-dashed border-white/5 rounded-[40px]">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock className="text-zinc-700" size={24} />
            </div>
            <h3 className="text-white font-bold mb-2">The vault is empty</h3>
            <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-black mb-8">Deploy credentials to begin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSecrets.map(secret => (
              <div 
                key={secret.id}
                onClick={() => { setEditingSecret(secret); setDialogOpen(true); }}
                className="group p-6 bg-zinc-950 border border-white/5 rounded-[32px] hover:border-white/20 transition-all relative overflow-hidden active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                      <Globe size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white truncate max-w-[140px]">{secret.name}</h4>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest truncate">{secret.service}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(secret.id, secret.name); }}
                    className="p-2 text-zinc-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <UserIcon size={10} /> Username
                    </div>
                    <div className="text-xs text-white font-medium truncate">
                      {secret.username || <span className="text-zinc-800 italic">None</span>}
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl group/pass relative">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Key size={10} /> Password
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white font-mono tracking-widest">
                        {revealed[secret.id] ? secret.password : '••••••••••••'}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRevealed(prev => ({ ...prev, [secret.id]: !prev[secret.id] })); }}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        {revealed[secret.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {secret.notes && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-zinc-500 font-medium italic line-clamp-2">
                       &quot;{secret.notes}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SecretDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        secret={editingSecret}
        onSaved={loadSecrets}
      />
    </div>
  );
}
