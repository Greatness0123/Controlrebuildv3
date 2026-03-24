"use client";

import { useEffect, useState } from 'react';
import { chatApi } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function TerminalSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [terminalPermission, setTerminalPermission] = useState('ask');

  useEffect(() => {
    const load = async () => {
      try {
        const termRes = await chatApi.getTerminalPermission().catch(() => ({ permission: 'ask' }));
        setTerminalPermission(termRes.permission || 'ask');
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await chatApi.setTerminalPermission(terminalPermission);
      toast.success('Terminal permissions saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground">Terminal</h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-black text-foreground">Terminal Permissions</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            When the AI needs to run terminal commands on your paired remote desktop, choose how to handle permission.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'always', label: 'Always Run', desc: 'Auto-execute all commands' },
              { id: 'ask', label: 'Ask Each Time', desc: 'Show approval prompt' },
              { id: 'never', label: 'Never Run', desc: 'Block all terminal access' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setTerminalPermission(opt.id)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                  terminalPermission === opt.id
                    ? opt.id === 'never'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : opt.id === 'always'
                        ? 'bg-accent-primary text-accent-foreground border-accent-primary'
                        : 'bg-card-hover border-border text-foreground'
                    : 'bg-background border-border text-text-muted hover:text-text-secondary hover:border-border'
                )}
              >
                <span className="text-xs font-black">{opt.label}</span>
                <span className="text-[9px] mt-1 opacity-60">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
