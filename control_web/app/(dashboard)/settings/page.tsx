"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  User, Shield, Zap, Key, Database, Globe, Bell, Palette, FileDown,
  Save, Loader2, Sparkles, Command, Terminal, ChevronRight, 
  MessageCircle, Info, Sun, Moon, Lock, CreditCard, LogOut
} from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type SettingsTab = 'account' | 'billing' | 'privacy' | 'notifications' | 'appearance' | 'apikeys' | 'data' | 'provider' | 'terminal' | 'feedback' | 'about';

export default function SettingsPage() {
  const { user, theme, setTheme } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const [settings, setSettings] = useState({
    provider: 'gemini',
    geminiModel: 'gemini-2.0-flash',
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
    terminalPermission: 'ask',
  });

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
            geminiModel: (provRes.config.gemini_model?.includes('gemini-1.5') ? provRes.config.gemini_model.replace('1.5', '2.0') : provRes.config.gemini_model) || 'gemini-2.0-flash',
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
      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: any) => setSettings(prev => ({ ...prev, [key]: val }));

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const PROVIDERS = [
    { id: 'gemini', name: 'Gemini', sub: 'Google' },
    { id: 'openai', name: 'OpenAI', sub: 'GPT-4o' },
    { id: 'anthropic', name: 'Claude', sub: 'Anthropic' },
    { id: 'openrouter', name: 'Router', sub: 'OpenRouter' },
    { id: 'xai', name: 'Grok', sub: 'xAI' },
    { id: 'ollama', name: 'Local', sub: 'Ollama' },
  ];

  const MENU_SECTIONS = [
    {
      title: null, // first group has no title
      items: [
        { id: 'account' as SettingsTab, icon: <User size={16} />, label: 'Account', desc: 'Manage your profile and account settings' },
        { id: 'billing' as SettingsTab, icon: <CreditCard size={16} />, label: 'Billing & Credits', desc: 'Manage billing and credits' },
        { id: 'privacy' as SettingsTab, icon: <Lock size={16} />, label: 'Privacy & Security', desc: 'Privacy and security settings' },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { id: 'appearance' as SettingsTab, icon: <Palette size={16} />, label: 'Appearance', desc: 'Customize the app appearance' },
        { id: 'apikeys' as SettingsTab, icon: <Key size={16} />, label: 'API Keys', desc: 'Manage your API keys' },
        { id: 'provider' as SettingsTab, icon: <Sparkles size={16} />, label: 'AI Provider', desc: 'Configure AI model provider' },
        { id: 'terminal' as SettingsTab, icon: <Terminal size={16} />, label: 'Terminal', desc: 'Terminal permission settings' },
        { id: 'data' as SettingsTab, icon: <FileDown size={16} />, label: 'Data & Export', desc: 'Export and manage your data' },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'feedback' as SettingsTab, icon: <MessageCircle size={16} />, label: 'Feedback', desc: 'Send us your feedback' },
        { id: 'about' as SettingsTab, icon: <Info size={16} />, label: 'About', desc: 'About Coasty' },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">

      {/* Mobile header */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0 md:hidden">
        <h1 className="text-sm font-black tracking-tight">Settings</h1>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Settings Navigation - Scrollable list */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border overflow-y-auto shrink-0 bg-background">
          <div className="p-4 md:p-6 space-y-6">

            {/* Theme toggle at top */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Settings</span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-border hover:bg-card-hover transition-all text-text-secondary"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {MENU_SECTIONS.map((section, si) => (
              <div key={si} className="space-y-1">
                {section.title && (
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-3 py-2">{section.title}</p>
                )}
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all group",
                      activeTab === item.id
                        ? "bg-card border border-border shadow-sm"
                        : "hover:bg-card-hover"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      activeTab === item.id ? "bg-accent-primary text-accent-foreground" : "bg-card border border-border text-text-muted"
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-foreground block">{item.label}</span>
                      <span className="text-[11px] text-text-muted block truncate">{item.desc}</span>
                    </div>
                    <ChevronRight size={14} className={cn(
                      "text-text-muted shrink-0 transition-transform",
                      activeTab === item.id && "translate-x-0.5"
                    )} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Content - Right panel */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto space-y-8">

            {/* Hidden save button for desktop */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-foreground">
                {MENU_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)?.label}
              </h2>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>

            {/* ─── ACCOUNT TAB ─── */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-accent-primary text-accent-foreground flex items-center justify-center text-2xl font-black shrink-0">
                      {user?.user_metadata?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {user?.user_metadata?.first_name
                          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                          : (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')}
                      </h3>
                      <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      <span className="inline-flex items-center px-3 py-1 mt-2 bg-card-hover border border-border rounded-full text-[10px] font-black text-text-muted uppercase tracking-widest">
                        {user?.user_metadata?.plan || 'Free'} Plan
                      </span>
                    </div>
                  </div>
                </div>
                
                <SettingsRow label="Display Name" value={user?.user_metadata?.name || user?.email?.split('@')[0] || '-'} />
                <SettingsRow label="Email Address" value={user?.email || '-'} />
                <SettingsRow label="User ID" value={user?.id?.substring(0, 12) + '...' || '-'} mono />

                <div className="pt-4 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* ─── BILLING TAB ─── */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-foreground">Current Plan</h3>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Plan</span>
                    <span className="text-xs font-black text-foreground uppercase">{user?.user_metadata?.plan || 'Free'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-widest">ACT Usage</span>
                    <span className="text-xs font-black text-foreground">
                      {user?.user_metadata?.actUsed || 0} / {(user?.user_metadata?.plan?.toLowerCase() || 'free') === 'master' ? '∞' : (user?.user_metadata?.plan?.toLowerCase() || 'free') === 'pro' ? '200' : '10'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-widest">ASK Usage</span>
                    <span className="text-xs font-black text-foreground">
                      {user?.user_metadata?.askUsed || 0} / {(user?.user_metadata?.plan?.toLowerCase() || 'free') === 'master' ? '∞' : (user?.user_metadata?.plan?.toLowerCase() || 'free') === 'pro' ? '500' : '200'}
                    </span>
                  </div>
                </div>
                <a
                  href="/pricing"
                  className="block w-full text-center py-4 bg-accent-primary text-accent-foreground rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Upgrade Plan
                </a>
              </div>
            )}

            {/* ─── PRIVACY TAB ─── */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-foreground">Security</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    All connections are encrypted with TLS 1.3 and AES-256-GCM. Session data is stored securely in your Supabase instance. No data is shared with third parties.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Shield size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">End-to-end encrypted</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── APPEARANCE TAB ─── */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
                  <h3 className="text-sm font-black text-foreground">Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setTheme('light'); localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); }}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                        theme === 'light' ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-background border-border text-text-muted hover:border-border"
                      )}
                    >
                      <Sun size={20} />
                      <span className="text-xs font-black uppercase">Light</span>
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); }}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                        theme === 'dark' ? "bg-accent-primary text-accent-foreground border-accent-primary" : "bg-background border-border text-text-muted hover:border-border"
                      )}
                    >
                      <Moon size={20} />
                      <span className="text-xs font-black uppercase">Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── API KEYS TAB ─── */}
            {activeTab === 'apikeys' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
                  <h3 className="text-sm font-black text-foreground">API Key Configuration</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Configure API keys for your preferred AI providers. Keys are stored encrypted in your account.
                  </p>
                  <FieldGroup label="Gemini API Key" note="Optional — uses server key if empty">
                    <input type="password" value={settings.geminiApiKey} onChange={e => set('geminiApiKey', e.target.value)} placeholder="AIza..." className="settings-input" />
                  </FieldGroup>
                  <FieldGroup label="OpenAI API Key">
                    <input type="password" value={settings.openaiApiKey} onChange={e => set('openaiApiKey', e.target.value)} placeholder="sk-..." className="settings-input" />
                  </FieldGroup>
                  <FieldGroup label="Anthropic API Key">
                    <input type="password" value={settings.anthropicApiKey} onChange={e => set('anthropicApiKey', e.target.value)} placeholder="sk-ant-..." className="settings-input" />
                  </FieldGroup>
                  <FieldGroup label="OpenRouter API Key">
                    <input type="password" value={settings.openrouterApiKey} onChange={e => set('openrouterApiKey', e.target.value)} placeholder="sk-or-..." className="settings-input" />
                  </FieldGroup>
                  <FieldGroup label="xAI API Key">
                    <input type="password" value={settings.xaiApiKey} onChange={e => set('xaiApiKey', e.target.value)} placeholder="xai-..." className="settings-input" />
                  </FieldGroup>
                </div>
              </div>
            )}

            {/* ─── AI PROVIDER TAB ─── */}
            {activeTab === 'provider' && (
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
                        <input type="text" value={settings.geminiModel} onChange={e => set('geminiModel', e.target.value)} placeholder="gemini-2.0-flash" className="settings-input font-mono" />
                      </FieldGroup>
                    )}
                    {settings.provider === 'openai' && (
                      <FieldGroup label="OpenAI Model">
                        <select value={settings.openaiModel} onChange={e => set('openaiModel', e.target.value)} className="settings-select">
                          <option value="gpt-4o">GPT-4o (Vision)</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        </select>
                      </FieldGroup>
                    )}
                    {settings.provider === 'anthropic' && (
                      <FieldGroup label="Claude Model">
                        <select value={settings.anthropicModel} onChange={e => set('anthropicModel', e.target.value)} className="settings-select">
                          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Vision)</option>
                          <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                          <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                        </select>
                      </FieldGroup>
                    )}
                    {settings.provider === 'openrouter' && (
                      <FieldGroup label="OpenRouter Model">
                        <input type="text" value={settings.openrouterModel} onChange={e => set('openrouterModel', e.target.value)} placeholder="anthropic/claude-3.5-sonnet" className="settings-input font-mono" />
                      </FieldGroup>
                    )}
                    {settings.provider === 'xai' && (
                      <FieldGroup label="Grok Model">
                        <select value={settings.xaiModel} onChange={e => set('xaiModel', e.target.value)} className="settings-select">
                          <option value="grok-2-vision-1212">Grok 2 Vision</option>
                          <option value="grok-2-1212">Grok 2</option>
                        </select>
                      </FieldGroup>
                    )}
                    {settings.provider === 'ollama' && (
                      <FieldGroup label="Ollama Model (local)" note="Requires Ollama running on port 11434">
                        <input type="text" value={settings.ollamaModel} onChange={e => set('ollamaModel', e.target.value)} placeholder="llava" className="settings-input font-mono" />
                      </FieldGroup>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TERMINAL TAB ─── */}
            {activeTab === 'terminal' && (
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
                        onClick={() => set('terminalPermission', opt.id)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                          settings.terminalPermission === opt.id
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
            )}

            {/* ─── DATA TAB ─── */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-foreground">Export Your Data</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Download a copy of your chat sessions, settings, and usage data.
                  </p>
                  <button className="px-5 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
                    Export Data
                  </button>
                </div>
              </div>
            )}

            {/* ─── NOTIFICATIONS TAB ─── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl flex items-center justify-center py-12">
                  <div className="text-center">
                    <Bell size={32} className="text-text-muted mx-auto mb-4 opacity-30" />
                    <p className="text-xs font-black text-text-muted uppercase tracking-widest">Coming Soon</p>
                    <p className="text-[11px] text-text-muted mt-2">Notification preferences will be available in a future update.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── FEEDBACK TAB ─── */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-foreground">Send Feedback</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Help us improve Control by sharing your thoughts, bug reports, or feature requests.
                  </p>
                  <textarea
                    placeholder="Tell us what you think..."
                    rows={5}
                    className="settings-input resize-none"
                  />
                  <button className="px-5 py-3 bg-accent-primary text-accent-foreground rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
                    Send Feedback
                  </button>
                </div>
              </div>
            )}

            {/* ─── ABOUT TAB ─── */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl border-2 border-border flex items-center justify-center">
                      <Command size={24} className="text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">Control Web</h3>
                      <p className="text-xs text-text-muted">v0.1.0-alpha</p>
                    </div>
                  </div>
                  <SettingsRow label="Platform" value="Web Application" />
                  <SettingsRow label="Database" value="Supabase" />
                  <SettingsRow label="Compute" value="Docker SDK" />
                  <SettingsRow label="Signaling" value="Supabase Realtime" />
                </div>
                <p className="text-[10px] font-black text-text-muted text-center uppercase tracking-widest">
                  © 2026 Advanced Agentic Coding Inc.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-input {
          width: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          transition: border 0.2s;
        }
        .settings-input:focus {
          border-color: var(--border-hover);
        }
        .settings-input::placeholder {
          color: var(--text-muted);
        }
        .settings-select {
          width: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
          appearance: none;
          cursor: pointer;
        }
        .settings-select option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
      `}</style>
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

function SettingsRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0 last:pb-0">
      <span className="text-xs text-text-muted font-bold uppercase tracking-widest">{label}</span>
      <span className={cn("text-xs text-foreground", mono && "font-mono")}>{value}</span>
    </div>
  );
}
