"use client";

import { useEffect, useState } from 'react';
import { chatApi } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    openrouterApiKey: '',
    xaiApiKey: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const provRes = await chatApi.getProviderConfig().catch(() => ({ config: {} }));
        if (provRes.config) {
          setSettings(prev => ({
            ...prev,
            geminiApiKey: provRes.config.gemini_api_key || '',
            openaiApiKey: provRes.config.openai_api_key || '',
            anthropicApiKey: provRes.config.anthropic_api_key || '',
            openrouterApiKey: provRes.config.openrouter_api_key || '',
            xaiApiKey: provRes.config.xai_api_key || '',
          }));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const current = await chatApi.getProviderConfig().catch(() => ({ config: {} }));
      await chatApi.saveProviderConfig({
        ...current.config,
        gemini_api_key: settings.geminiApiKey || undefined,
        openai_api_key: settings.openaiApiKey || undefined,
        anthropic_api_key: settings.anthropicApiKey || undefined,
        openrouter_api_key: settings.openrouterApiKey || undefined,
        xai_api_key: settings.xaiApiKey || undefined,
      });
      toast.success('API keys saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: any) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-foreground">API Keys</h2>
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
        <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-black text-foreground">API Key Configuration</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Configure API keys for your preferred AI providers. Keys are stored encrypted in your account.
          </p>
          <FieldGroup label="Gemini API Key" note="Optional — uses server key if empty">
            <input type="password" value={settings.geminiApiKey} onChange={e => set('geminiApiKey', e.target.value)} placeholder="AIza..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all placeholder:text-text-muted" />
          </FieldGroup>
          <FieldGroup label="OpenAI API Key">
            <input type="password" value={settings.openaiApiKey} onChange={e => set('openaiApiKey', e.target.value)} placeholder="sk-..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all placeholder:text-text-muted" />
          </FieldGroup>
          <FieldGroup label="Anthropic API Key">
            <input type="password" value={settings.anthropicApiKey} onChange={e => set('anthropicApiKey', e.target.value)} placeholder="sk-ant-..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all placeholder:text-text-muted" />
          </FieldGroup>
          <FieldGroup label="OpenRouter API Key">
            <input type="password" value={settings.openrouterApiKey} onChange={e => set('openrouterApiKey', e.target.value)} placeholder="sk-or-..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all placeholder:text-text-muted" />
          </FieldGroup>
          <FieldGroup label="xAI API Key">
            <input type="password" value={settings.xaiApiKey} onChange={e => set('xaiApiKey', e.target.value)} placeholder="xai-..." className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all placeholder:text-text-muted" />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
        {label}{note && <span className="text-text-muted normal-case ml-1 opacity-60">— {note}</span>}
      </label>
      {children}
    </div>
  );
}
