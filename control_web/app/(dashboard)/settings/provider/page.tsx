"use client";

import { useEffect, useState } from 'react';
import { chatApi } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

const PROVIDERS = [
  { id: 'gemini', name: 'Gemini', sub: 'Google' },
  { id: 'openai', name: 'OpenAI', sub: 'GPT-4o' },
  { id: 'anthropic', name: 'Claude', sub: 'Anthropic' },
  { id: 'openrouter', name: 'Router', sub: 'OpenRouter' },
  { id: 'xai', name: 'Grok', sub: 'xAI' },
  { id: 'ollama', name: 'Local', sub: 'Ollama' },
];

export default function ProviderPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    provider: 'gemini',
    geminiModel: 'gemini-2.0-flash',
    openaiModel: 'gpt-4o',
    anthropicModel: 'claude-3-5-sonnet-20241022',
    openrouterModel: 'anthropic/claude-3.5-sonnet',
    xaiModel: 'grok-2-vision-1212',
    ollamaModel: 'llava',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const provRes = await chatApi.getProviderConfig().catch(() => ({ config: {} }));
        if (provRes.config) {
          setSettings(prev => ({
            ...prev,
            provider: provRes.config.provider || 'gemini',
            geminiModel: (provRes.config.gemini_model?.includes('gemini-1.5') ? provRes.config.gemini_model.replace('1.5', '2.0') : provRes.config.gemini_model) || 'gemini-2.0-flash',
            openaiModel: provRes.config.openai_model || 'gpt-4o',
            anthropicModel: provRes.config.anthropic_model || 'claude-3-5-sonnet-20241022',
            openrouterModel: provRes.config.openrouter_model || 'anthropic/claude-3.5-sonnet',
            xaiModel: provRes.config.xai_model || 'grok-2-vision-1212',
            ollamaModel: provRes.config.ollama_model || 'llava',
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
        provider: settings.provider,
        gemini_model: settings.geminiModel,
        openai_model: settings.openaiModel,
        anthropic_model: settings.anthropicModel,
        openrouter_model: settings.openrouterModel,
        xai_model: settings.xaiModel,
        ollama_model: settings.ollamaModel,
      });
      toast.success('AI Provider settings saved');
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
        <h2 className="text-lg font-black text-foreground">AI Provider</h2>
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
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-black text-foreground">Active Provider</h3>
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => set('provider', p.id)}
                className={cn(
                  "flex flex-col items-center py-3 px-2 rounded-xl border transition-all text-center",
                  settings.provider === p.id
                    ? 'bg-accent-primary text-accent-foreground border-accent-primary'
                    : 'bg-background border-border text-text-muted hover:text-foreground hover:border-border'
                )}
              >
                <span className="text-[11px] font-black uppercase">{p.name}</span>
                <span className={cn("text-[9px] mt-0.5", settings.provider === p.id ? 'opacity-60' : 'text-text-muted')}>{p.sub}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            {settings.provider === 'gemini' && (
              <FieldGroup label="Gemini Model">
                <input type="text" value={settings.geminiModel} onChange={e => set('geminiModel', e.target.value)} placeholder="gemini-2.0-flash" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all font-mono" />
              </FieldGroup>
            )}
            {settings.provider === 'openai' && (
              <FieldGroup label="OpenAI Model">
                <select value={settings.openaiModel} onChange={e => set('openaiModel', e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all appearance-none cursor-pointer">
                  <option value="gpt-4o">GPT-4o (Vision)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </FieldGroup>
            )}
            {settings.provider === 'anthropic' && (
              <FieldGroup label="Claude Model">
                <select value={settings.anthropicModel} onChange={e => set('anthropicModel', e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all appearance-none cursor-pointer">
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Vision)</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                </select>
              </FieldGroup>
            )}
            {settings.provider === 'openrouter' && (
              <FieldGroup label="OpenRouter Model">
                <input type="text" value={settings.openrouterModel} onChange={e => set('openrouterModel', e.target.value)} placeholder="anthropic/claude-3.5-sonnet" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all font-mono" />
              </FieldGroup>
            )}
            {settings.provider === 'xai' && (
              <FieldGroup label="Grok Model">
                <select value={settings.xaiModel} onChange={e => set('xaiModel', e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all appearance-none cursor-pointer">
                  <option value="grok-2-vision-1212">Grok 2 Vision</option>
                  <option value="grok-2-1212">Grok 2</option>
                </select>
              </FieldGroup>
            )}
            {settings.provider === 'ollama' && (
              <FieldGroup label="Ollama Model (local)" note="Requires Ollama running on port 11434">
                <input type="text" value={settings.ollamaModel} onChange={e => set('ollamaModel', e.target.value)} placeholder="llava" className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-border transition-all font-mono" />
              </FieldGroup>
            )}
          </div>
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
