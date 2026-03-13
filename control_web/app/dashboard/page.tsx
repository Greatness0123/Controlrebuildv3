"use client";

import { useState, useEffect } from 'react';
import RemoteDesktop from '@/components/RemoteDesktop';
import { Monitor, Cpu, Plus, Settings, History, Send, Link as LinkIcon, Shield, X, AlertCircle } from 'lucide-react';

export default function Dashboard() {
    const [activeView, setActiveView] = useState<'vm' | 'local'>('vm');
    const [message, setMessage] = useState('');
    const [showPairingModal, setShowPairingModal] = useState(false);
    const [pairingCode, setPairingCode] = useState('');
    const [isPairing, setIsPairing] = useState(false);
    const [pairedSystems, setPairedSystems] = useState([
        { id: 'local-1', name: 'MacBook Pro (Office)', status: 'online' }
    ]);

    const handlePairing = async () => {
        setIsPairing(true);
        // Simulate pairing logic
        setTimeout(() => {
            setIsPairing(false);
            setShowPairingModal(false);
            setPairingCode('');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                            <Monitor className="text-black w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tighter">CONTROL <span className="text-zinc-500">WEB</span></h1>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
                        <button className="text-white">Dashboard</button>
                        <button className="hover:text-white transition-colors">Resources</button>
                        <button className="hover:text-white transition-colors">Automation</button>
                        <button className="hover:text-white transition-colors">Settings</button>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowPairingModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors"
                    >
                        <LinkIcon size={14} />
                        Pair Desktop
                    </button>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold hover:border-white transition-colors cursor-pointer">
                        U
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-72 border-r border-zinc-800 p-6 flex flex-col gap-6 bg-zinc-950/50">
                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-4">Virtual Machines</div>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveView('vm')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${activeView === 'vm' ? 'bg-white text-black font-bold shadow-lg shadow-white/10' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Cpu size={16} />
                                    <span>Ubuntu Cloud #1</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-600 cursor-not-allowed group">
                                <Plus size={16} />
                                <span>Create New VM</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-4">Paired Devices</div>
                        <div className="space-y-1">
                            {pairedSystems.map(system => (
                                <button
                                    key={system.id}
                                    onClick={() => setActiveView('local')}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${activeView === 'local' ? 'bg-white text-black font-bold shadow-lg shadow-white/10' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Monitor size={16} />
                                        <span>{system.name}</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                            <Shield size={12} />
                            <span>Pro Plan Active</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mb-2">VM USAGE: 1/3</div>
                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                            <div className="bg-white w-1/3 h-full"></div>
                        </div>
                    </div>
                </aside>

                {/* Viewport & Chat */}
                <div className="flex-1 flex flex-col min-w-0 bg-black">
                    <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
                                    {activeView === 'vm' ? <Cpu size={24} className="text-zinc-400" /> : <Monitor size={24} className="text-zinc-400" />}
                                    {activeView === 'vm' ? 'Ubuntu Cloud Instance' : 'MacBook Pro (Office)'}
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">
                                    {activeView === 'vm' ? 'US-East-1 • IP: 157.230.22.10 • XFCE4 Desktop' : 'Paired via Secure WebRTC Tunnel'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button className="p-2 hover:bg-zinc-900 border border-zinc-800 rounded-md transition-colors text-zinc-400">
                                    <Settings size={18} />
                                </button>
                                <button className="px-4 py-2 bg-white text-black rounded-md text-sm font-bold hover:bg-zinc-200 transition-all flex items-center gap-2">
                                    Control Session
                                </button>
                            </div>
                        </div>

                        {/* VM / Remote Display */}
                        <div className="relative aspect-video bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl group">
                            <RemoteDesktop computerId={activeView === 'vm' ? 'vm-1' : 'local-1'} type={activeView} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <button className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl transform transition-transform hover:scale-105">
                                    Resume Full Control
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="CPU Utilization" value="12%" sub="Intel Xeon (4 Cores)" />
                            <StatCard label="Memory (RAM)" value="2.4 / 8 GB" sub="LPDDR4x" />
                            <StatCard label="Latency" value="24ms" sub="Excellent Connection" />
                        </div>
                    </div>

                    {/* Chat Command Center */}
                    <div className="p-8 border-t border-zinc-900 bg-black/50 backdrop-blur-xl">
                        <div className="max-w-4xl mx-auto">
                            <div className="relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <div className="w-[1px] h-4 bg-zinc-800"></div>
                                </div>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Instruct AI to handle tasks on this machine..."
                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-5 pl-14 pr-16 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all text-sm placeholder:text-zinc-600 shadow-inner"
                                />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-black p-2.5 rounded-xl hover:bg-zinc-200 transition-all shadow-lg">
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-4 flex gap-4 justify-center">
                                <QuickAction label="Fix UI Issues" />
                                <QuickAction label="Check Logs" />
                                <QuickAction label="Update Dependencies" />
                                <QuickAction label="Clean Temporary Files" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Pairing Modal */}
            {showPairingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <LinkIcon className="text-white" size={24} />
                                </div>
                                <button onClick={() => setShowPairingModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Pair Local Desktop</h3>
                            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                                Enter the 8-digit secure pairing code displayed in your Control Desktop application settings.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2 px-1">Pairing Code</label>
                                    <input
                                        type="text"
                                        maxLength={8}
                                        value={pairingCode}
                                        onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                        placeholder="0000 0000"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:border-white transition-all"
                                    />
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                    <AlertCircle size={18} className="text-zinc-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-zinc-500 leading-normal">
                                        This connection is end-to-end encrypted. Pairing allows full remote view and AI control capabilities. You can revoke access anytime from the desktop app.
                                    </p>
                                </div>

                                <button
                                    onClick={handlePairing}
                                    disabled={pairingCode.length < 8 || isPairing}
                                    className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isPairing ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    ) : 'Complete Pairing'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-colors group">
        <div className="text-[10px] text-zinc-600 uppercase font-bold mb-2 tracking-widest">{label}</div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <button className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all">
        {label}
    </button>
  );
}
