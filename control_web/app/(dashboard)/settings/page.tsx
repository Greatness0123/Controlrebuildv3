"use client";

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { 
  User, Shield, Zap, Key, Database, Globe, 
  ChevronRight, Save, Loader2, Sparkles, AlertTriangle, X, Command
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message: msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);
  
  // Fake settings state for UI (in real app, fetched from DB config)
  const [settings, setSettings] = useState({
    geminiModel: 'gemini-2.0-flash',
    theme: 'dark',
    agentConfirmActions: true,
    remotePairingCode: '',
    hotkeyStop: 'ESCAPE',
    hotkeyScreenshot: 'CTRL + S',
    hotkeyTerminal: 'ALT + T',
  });

  const [recordingKey, setRecordingKey] = useState<{ id: keyof typeof settings, label: string } | null>(null);
  const [currentKeys, setCurrentKeys] = useState('');

  const openHotkeyModal = (id: keyof typeof settings) => {
    const labelMapping: any = {
      hotkeyStop: 'Stop AI Agent',
      hotkeyScreenshot: 'Capture Screenshot',
      hotkeyTerminal: 'Toggle Terminal'
    };
    setRecordingKey({ id, label: labelMapping[id] });
    setCurrentKeys('');
  };

  useEffect(() => {
    if (!recordingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const keys = [];
      if (e.ctrlKey) keys.push('CTRL');
      if (e.shiftKey) keys.push('SHIFT');
      if (e.altKey) keys.push('ALT');
      if (e.metaKey) keys.push('CMD');
      
      const keyName = e.key.toUpperCase();
      if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(keyName)) {
        keys.push(keyName);
      }
      
      setCurrentKeys(keys.join(' + '));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingKey]);

  const saveHotkey = () => {
    if (recordingKey && currentKeys) {
      setSettings({ ...settings, [recordingKey.id]: currentKeys });
      showToast(`Hotkey for ${recordingKey.label} updated`);
      setRecordingKey(null);
    }
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
            <Zap size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Settings</h1>
            <p className="text-[11px] text-zinc-500 font-medium">Configure your AI providers and account</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-10">
          
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-[11px] font-bold text-center uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              Settings saved successfully
            </div>
          )}

          {/* Profile Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <User size={14} className="text-zinc-500" />
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Account Profile</h2>
            </div>
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-black text-2xl font-bold">
                  {user?.user_metadata?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{user?.user_metadata?.name || 'User'}</h3>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                    Free Plan
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI Configuration */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={14} className="text-zinc-500" />
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">AI Agent Configuration</h2>
            </div>
            <div className="glass-card p-6 space-y-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Default Model</label>
                <select 
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({...settings, geminiModel: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Efficient)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Reasoning & Complex Tasks)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="text-sm font-bold text-white">Require confirmation</h4>
                  <p className="text-[11px] text-zinc-600">AI will ask before clicking or typing on your machine</p>
                </div>
                <button 
                  onClick={() => setSettings({...settings, agentConfirmActions: !settings.agentConfirmActions})}
                  className={`w-10 h-6 rounded-full transition-all relative ${settings.agentConfirmActions ? 'bg-white' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${settings.agentConfirmActions ? 'right-1 bg-black' : 'left-1 bg-zinc-600'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Security & API Keys */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Key size={14} className="text-zinc-500" />
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">API & Security</h2>
            </div>
            <div className="glass-card p-6 space-y-6">
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200/60 leading-relaxed">
                  You are currently using shared global API keys. To ensure reliability and higher limits, 
                  you can provide your own Gemini API key below.
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 px-1">Custom Gemini API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-mono"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors">Apply</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Database size={14} className="text-zinc-500" />
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Infrastructure</h2>
            </div>
            <div className="glass-card p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Database Engine</span>
                <span className="font-mono text-zinc-300">Supabase PG / {process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('/').pop()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Compute Provider</span>
                <span className="font-mono text-white flex items-center gap-2">
                  <Globe size={12} className="text-blue-500" /> Local Docker SDK
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Signaling Protocol</span>
                <span className="font-mono text-zinc-300">WebRTC / Supabase Realtime</span>
              </div>
            </div>
          </section>

          {/* Hotkeys Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Key size={14} className="text-zinc-500" />
              <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Keyboard Shortcuts</h2>
            </div>
            <div className="glass-card p-6 space-y-4">
              <HotkeyRow 
                label="Stop AI Agent" 
                shortcut={settings.hotkeyStop} 
                onEdit={() => openHotkeyModal('hotkeyStop')} 
              />
              <HotkeyRow 
                label="Capture Screenshot" 
                shortcut={settings.hotkeyScreenshot} 
                onEdit={() => openHotkeyModal('hotkeyScreenshot')} 
              />
              <HotkeyRow 
                label="Toggle Terminal" 
                shortcut={settings.hotkeyTerminal} 
                onEdit={() => openHotkeyModal('hotkeyTerminal')} 
              />
            </div>
          </section>

          <footer className="text-center pt-8">
            <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest mb-2">Control Web v0.1.0-alpha</p>
            <p className="text-[10px] text-zinc-500">© 2026 Antigravity Labs. All rights reserved.</p>
          </footer>

        </div>
      </div>

      {/* Hotkey Recording Modal */}
      {recordingKey && (
        <div 
          onClick={() => setRecordingKey(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up p-8 text-center"
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Command size={32} className="text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-2">Recording Hotkey</h3>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              Press any key combination to set as shortcut for <span className="text-white font-bold">{recordingKey.label}</span>
            </p>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 min-h-[80px] flex items-center justify-center">
              <span className="text-3xl font-mono font-bold tracking-widest text-white uppercase">
                {currentKeys || 'Waiting...'}
              </span>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setRecordingKey(null)}
                className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={saveHotkey}
                disabled={!currentKeys}
                className="flex-1 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all disabled:opacity-20"
              >
                Save Hotkey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-20 right-6 z-[200] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-enter flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm shadow-2xl backdrop-blur-xl"
          >
            <Zap size={16} className="text-orange-400 shrink-0" />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function HotkeyRow({ label, shortcut, onEdit }: { label: string; shortcut: string; onEdit: () => void }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
      <button 
        onClick={onEdit}
        className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs font-bold font-mono text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/10 transition-all uppercase tracking-widest"
      >
        {shortcut}
      </button>
    </div>
  );
}
