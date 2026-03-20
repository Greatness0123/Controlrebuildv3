"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import {
  User, Shield, Zap, Key, Database, Globe,
  Save, Loader2, Sparkles, Command, Terminal
} from 'lucide-react';

interface ToastItem { id: string; message: string; }

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((msg: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message: msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const [settings, setSettings] = useState({
    // Provider
    provider: 'gemini',
    geminiModel: 'gemini-2.5-flash',
    geminiApiKey: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4o',
    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-20241022',
    openrouterApiKey: '',
    openrouterModel: 'anthropic/claude-3.5-sonnet',
    xaiApiKey: '',
    xaiModel: 'grok-2-vision-1212',
    ollamaModel: 'llava',
    // Terminal permission
    terminalPermission: 'ask',
    // Hotkeys
    hotkeyStop: 'ESCAPE',
    hotkeyScreenshot: 'CTRL + S',
    hotkeyTerminal: 'ALT + T',
  });

  // Load config
  useEffect(() => {
    const load = async () => {
      try {
        const [provRes, termRes] = await Promise.all([
          chatApi.getProviderConfig().catch(() => ({ config: {} })),
          chatApi.getTerminalPermission().catch(() => ({ permission: 'ask' })),
        ]);
        if (provRes.config) {
          setSettings(prev => ({
            ...prev,
            provider: provRes.config.provider || 'gemini',
            geminiModel: (provRes.config.gemini_model === 'gemini-1.5-flash' || provRes.config.gemini_model === 'gemini-1.5-pro' ? provRes.config.gemini_model.replace('1.5', '2.5') : provRes.config.gemini_model) || 'gemini-2.5-flash',
            geminiApiKey: provRes.config.gemini_api_key || '',
            openaiApiKey: provRes.config.openai_api_key || '',
            openaiModel: provRes.config.openai_model || 'gpt-4o',
            anthropicApiKey: provRes.config.anthropic_api_key || '',
            anthropicModel: provRes.config.anthropic_model || 'claude-3-5-sonnet-20241022',
            openrouterApiKey: provRes.config.openrouter_api_key || '',
            openrouterModel: provRes.config.openrouter_model || 'anthropic/claude-3.5-sonnet',
            xaiApiKey: provRes.config.xai_api_key || '',
            xaiModel: provRes.config.xai_model || 'grok-2-vision-1212',
            ollamaModel: provRes.config.ollama_model || 'llava',
            terminalPermission: termRes.permission || 'ask',
          }));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await chatApi.saveProviderConfig({
        provider: settings.provider,
        gemini_model: settings.geminiModel,
        gemini_api_key: settings.geminiApiKey || undefined,
        openai_api_key: settings.openaiApiKey || undefined,
        openai_model: settings.openaiModel,
        anthropic_api_key: settings.anthropicApiKey || undefined,
        anthropic_model: settings.anthropicModel,
        openrouter_api_key: settings.openrouterApiKey || undefined,
        openrouter_model: settings.openrouterModel,
        xai_api_key: settings.xaiApiKey || undefined,
        xai_model: settings.xaiModel,
        ollama_model: settings.ollamaModel,
      });
      await chatApi.setTerminalPermission(settings.terminalPermission);
      setSuccess(true);
      showToast('Settings saved successfully');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: any) => setSettings(prev => ({ ...prev, [key]: val }));

  const PROVIDERS = [
    { id: 'gemini', name: 'Gemini', sub: 'Google' },
    { id: 'openai', name: 'OpenAI', sub: 'GPT-4o' },
    { id: 'anthropic', name: 'Claude', sub: 'Anthropic' },
    { id: 'openrouter', name: 'Router', sub: 'OpenRouter' },
    { id: 'xai', name: 'Grok', sub: 'xAI' },
    { id: 'ollama', name: 'Local', sub: 'Ollama' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center">
            <Zap size={18} className="text-zinc-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight">Settings</h1>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Configure your environment</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-10">

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-[10px] font-black text-center uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              ✓ Settings saved successfully
            </div>
          )}

          {/* ── Profile ── */}
          <Section icon={<User size={13} />} title="Account Profile">
            <div className="glass-card p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl border-2 border-white/10 flex items-center justify-center text-xl font-black text-white bg-zinc-900 shrink-0">
                {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {user?.user_metadata?.first_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                    : (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')}
                </h3>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                <span className="inline-flex items-center px-2 py-0.5 mt-2 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  {user?.user_metadata?.plan || 'Free'} Plan
                </span>
              </div>
            </div>
          </Section>

          {/* ── AI Provider ── */}
          <Section icon={<Sparkles size={13} />} title="AI Agent Provider">
            <div className="glass-card p-6 space-y-6">
              {/* Provider Grid */}
              <div>
                <label className="label-xs">Active Provider</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => set('provider', p.id)}
                      className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all text-center ${settings.provider === p.id
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.02] border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                        }`}
                    >
                      <span className="text-[11px] font-black uppercase">{p.name}</span>
                      <span className={`text-[9px] mt-0.5 ${settings.provider === p.id ? 'text-zinc-600' : 'text-zinc-700'}`}>{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider-specific fields */}
              <div className="border-t border-white/5 pt-6 space-y-4">
                {settings.provider === 'gemini' && (
                  <>
                    <FieldGroup label="Gemini Model">
                      <select value={settings.geminiModel} onChange={e => set('geminiModel', e.target.value)} className="select-field">
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Stable)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Max Context)</option>
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Gemini API Key" note="Optional — uses server key if empty">
                      <input type="password" value={settings.geminiApiKey} onChange={e => set('geminiApiKey', e.target.value)} placeholder="AIza..." className="input-field" />
                    </FieldGroup>
                  </>
                )}

                {settings.provider === 'openai' && (
                  <>
                    <FieldGroup label="OpenAI Model">
                      <select value={settings.openaiModel} onChange={e => set('openaiModel', e.target.value)} className="select-field">
                        <option value="gpt-4o">GPT-4o (Vision)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </select>
                    </FieldGroup>
                    <FieldGroup label="OpenAI API Key">
                      <input type="password" value={settings.openaiApiKey} onChange={e => set('openaiApiKey', e.target.value)} placeholder="sk-..." className="input-field" />
                    </FieldGroup>
                  </>
                )}

                {settings.provider === 'anthropic' && (
                  <>
                    <FieldGroup label="Claude Model">
                      <select value={settings.anthropicModel} onChange={e => set('anthropicModel', e.target.value)} className="select-field">
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Vision)</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Anthropic API Key">
                      <input type="password" value={settings.anthropicApiKey} onChange={e => set('anthropicApiKey', e.target.value)} placeholder="sk-ant-..." className="input-field" />
                    </FieldGroup>
                  </>
                )}

                {settings.provider === 'openrouter' && (
                  <>
                    <FieldGroup label="OpenRouter Model">
                      <input type="text" value={settings.openrouterModel} onChange={e => set('openrouterModel', e.target.value)} placeholder="anthropic/claude-3.5-sonnet" className="input-field font-mono" />
                    </FieldGroup>
                    <FieldGroup label="OpenRouter API Key">
                      <input type="password" value={settings.openrouterApiKey} onChange={e => set('openrouterApiKey', e.target.value)} placeholder="sk-or-..." className="input-field" />
                    </FieldGroup>
                  </>
                )}

                {settings.provider === 'xai' && (
                  <>
                    <FieldGroup label="Grok Model">
                      <select value={settings.xaiModel} onChange={e => set('xaiModel', e.target.value)} className="select-field">
                        <option value="grok-2-vision-1212">Grok 2 Vision</option>
                        <option value="grok-2-1212">Grok 2</option>
                      </select>
                    </FieldGroup>
                    <FieldGroup label="xAI API Key">
                      <input type="password" value={settings.xaiApiKey} onChange={e => set('xaiApiKey', e.target.value)} placeholder="xai-..." className="input-field" />
                    </FieldGroup>
                  </>
                )}

                {settings.provider === 'ollama' && (
                  <FieldGroup label="Ollama Model (local)" note="Requires Ollama running on port 11434. Use a vision-capable model.">
                    <input type="text" value={settings.ollamaModel} onChange={e => set('ollamaModel', e.target.value)} placeholder="llava" className="input-field font-mono" />
                  </FieldGroup>
                )}
              </div>
            </div>
          </Section>

          {/* ── Terminal Permissions ── */}
          <Section icon={<Terminal size={13} />} title="Terminal Permissions">
            <div className="glass-card p-6 space-y-4">
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                When the AI needs to run terminal commands on your paired remote desktop, choose how to handle permission.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'always', label: 'Always Run', desc: 'Auto-execute all commands' },
                  { id: 'ask', label: 'Ask Each Time', desc: 'Show approval prompt' },
                  { id: 'never', label: 'Never Run', desc: 'Block all terminal access' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => set('terminalPermission', opt.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${settings.terminalPermission === opt.id
                        ? opt.id === 'never'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : opt.id === 'always'
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/20 text-white'
                        : 'bg-white/[0.02] border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10'
                      }`}
                  >
                    <span className="text-xs font-black">{opt.label}</span>
                    <span className="text-[9px] mt-1 opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Infrastructure ── */}
          <Section icon={<Database size={13} />} title="Infrastructure">
            <div className="glass-card p-6 space-y-4">
              <InfoRow label="Database Engine" value={`Supabase / ${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1] || 'local'}`} />
              <InfoRow label="Compute Provider" value="Local Docker SDK" />
              <InfoRow label="Signaling Protocol" value="Supabase Realtime" />
            </div>
          </Section>

          {/* ── Shortcuts ── */}
          <Section icon={<Key size={13} />} title="Keyboard Shortcuts">
            <div className="glass-card p-6 space-y-4">
              <HotkeyRow label="Stop AI Agent" shortcut="ESCAPE" />
              <HotkeyRow label="New Session" shortcut="CTRL + K" />
              <HotkeyRow label="Toggle Monitor" shortcut="CTRL + M" />
            </div>
          </Section>

          <footer className="text-center pb-8">
            <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Control Web v0.1.0-alpha</p>
          </footer>
        </div>
      </div>

      {/* Toast */}
      <div className="fixed top-20 right-6 z-[200] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className="toast-enter flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm shadow-2xl">
            <Zap size={14} className="text-white shrink-0" />
            {t.message}
          </div>
        ))}
      </div>

      {/* Scoped styles */}
      <style jsx>{`
        .label-xs { font-size: 10px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; }
        .input-field {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px 16px; font-size: 13px; color: #fff;
          outline: none; transition: border 0.2s;
        }
        .input-field:focus { border-color: rgba(255,255,255,0.25); }
        .select-field {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px 16px; font-size: 13px; color: #fff;
          outline: none; appearance: none; cursor: pointer;
        }
        .select-field option { background: #09090b; }
      `}</style>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-zinc-600">{icon}</span>
        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FieldGroup({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
        {label}{note && <span className="text-zinc-700 normal-case ml-1">— {note}</span>}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className="font-mono text-xs text-zinc-300">{value}</span>
    </div>
  );
}

function HotkeyRow({ label, shortcut }: { label: string; shortcut: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold font-mono text-zinc-300 uppercase tracking-widest">
        {shortcut}
      </span>
    </div>
  );
}
