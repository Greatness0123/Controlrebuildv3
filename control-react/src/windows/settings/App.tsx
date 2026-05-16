import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { Icon } from '../../components/shared/Icon';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Badge } from '../../components/shared/Badge';
import { ScrollArea } from '../../components/shared/ScrollArea';

type Tab = 'general' | 'models' | 'voice' | 'appearance' | 'workflows' | 'security' | 'advanced';

export default function SettingsApp() {
  const { settings, saveSettings } = useSettings();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    window.settingsAPI.getAppVersion().then(v => setAppVersion(v.version));
  }, []);

  const tabs = [
    { id: 'general', icon: 'Settings2', label: 'General' },
    { id: 'models', icon: 'Brain', label: 'Models' },
    { id: 'voice', icon: 'Mic', label: 'Voice' },
    { id: 'appearance', icon: 'Palette', label: 'Appearance' },
    { id: 'workflows', icon: 'GitBranch', label: 'Workflows' },
    { id: 'security', icon: 'Shield', label: 'Security' },
    { id: 'advanced', icon: 'Code2', label: 'Advanced' },
  ] as const;

  const providers = [
    { id: 'gemini', name: 'Gemini' },
    { id: 'anthropic', name: 'Claude' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'ollama', name: 'Ollama' },
    { id: 'xai', name: 'xAI' },
    { id: 'openrouter', name: 'OpenRouter' },
  ];

  return (
    <div className="flex h-screen bg-bg-base text-text-primary overflow-hidden border-l border-border-strong select-none">
      {/* Sidebar Navigation */}
      <div className="w-[180px] bg-bg-surface border-r border-border-subtle flex flex-col pt-6 shrink-0">
        <div className="px-6 mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Settings</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
            >
              <Icon name={tab.icon as any} size="sm" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle space-y-4">
           {user && (
             <div className="flex items-center gap-3 px-2">
               <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs uppercase">
                 {user.name[0]}
               </div>
               <div className="flex flex-col min-w-0">
                 <span className="text-[11px] font-bold truncate">{user.name}</span>
                 <Badge variant="success" className="w-fit scale-75 origin-left">{user.plan}</Badge>
               </div>
             </div>
           )}
           <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
           >
             <Icon name="LogOut" size="sm" />
             Sign Out
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-border-subtle bg-bg-elevated/50 shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-widest">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <div className="text-[10px] font-mono text-text-disabled uppercase">
            Control Build {appVersion}
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-10 max-w-3xl space-y-12">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <section className="space-y-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Startup Behavior</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Launch at Startup</div>
                          <div className="text-xs text-text-muted">Automatically open Control when you log in</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.openAtLogin}
                          onChange={(e) => saveSettings({ openAtLogin: e.target.checked })}
                          className="w-4 h-4 accent-white"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Privacy & Visibility</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-bg-surface border border-border-subtle rounded-xl">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Hide from Screen Recording</div>
                          <div className="text-xs text-text-muted">Prevents the window from appearing in screenshots/videos</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.windowVisibility}
                          onChange={(e) => saveSettings({ windowVisibility: e.target.checked })}
                          className="w-4 h-4 accent-white"
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'models' && (
                <motion.div
                  key="models"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                   <section className="space-y-6">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">AI Provider</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {providers.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => saveSettings({ modelProvider: p.id })}
                          className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${settings.modelProvider === p.id ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-bg-surface border-border-subtle text-text-secondary hover:border-border-strong hover:text-white'}`}
                        >
                          <Icon name={p.id === 'gemini' ? 'Sparkles' : p.id === 'anthropic' ? 'Shield' : 'Brain'} size="lg" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Model Configuration</h4>
                    <div className="space-y-4">
                       <div className="space-y-2">
                         <label className="text-xs font-medium text-text-secondary ml-1">Selected Model</label>
                         <Input
                          value={settings.selectedModel}
                          onChange={(e) => saveSettings({ selectedModel: e.target.value })}
                          placeholder="e.g. gemini-2.0-flash"
                         />
                       </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <section className="space-y-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">PIN Protection</h4>
                    <div className="p-6 bg-bg-surface border border-border-subtle rounded-xl space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">Enable Security PIN</div>
                          <div className="text-xs text-text-muted">Require a PIN to unlock the chat and settings</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.pinEnabled}
                          onChange={(e) => saveSettings({ pinEnabled: e.target.checked })}
                          className="w-4 h-4 accent-white"
                        />
                      </div>

                      {settings.pinEnabled && (
                        <div className="pt-6 border-t border-border-subtle">
                           <Button variant="ghost" size="sm" iconLeft="Key">Change Security PIN</Button>
                        </div>
                      )}
                    </div>
                  </section>
                </motion.div>
              )}

              {/* Other tabs follow similar pattern */}
              <motion.div className="py-20 text-center opacity-20">
                 <Icon name="Construction" size={48} className="mx-auto mb-4" />
                 <p className="text-xs uppercase font-bold tracking-widest">Additional settings tabs coming soon</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
