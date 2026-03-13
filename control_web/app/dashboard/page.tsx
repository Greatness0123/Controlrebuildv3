"use client";

import { useState } from 'react';
import RemoteDesktop from '@/components/RemoteDesktop';
import { Monitor, Cpu, Plus, Settings, History, Send } from 'lucide-react';

export default function Dashboard() {
    const [activeView, setActiveView] = useState<'vm' | 'local'>('vm');
    const [message, setMessage] = useState('');

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-bold tracking-tighter">CONTROL <span className="text-zinc-500">WEB</span></h1>
                    <nav className="flex gap-6 text-sm font-medium text-zinc-400">
                        <button className="text-white">Computers</button>
                        <button className="hover:text-white transition-colors">History</button>
                        <button className="hover:text-white transition-colors">Settings</button>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400">
                        <Plus size={20} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold">
                        U
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 border-r border-zinc-800 p-4 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">My Systems</div>
                    <button
                        onClick={() => setActiveView('vm')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'vm' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'}`}
                    >
                        <Cpu size={16} />
                        Virtual Machine #1
                    </button>
                    <button
                        onClick={() => setActiveView('local')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'local' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'}`}
                    >
                        <Monitor size={16} />
                        My Desktop (Local)
                    </button>
                </aside>

                {/* Viewport & Chat */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                {activeView === 'vm' ? <Cpu size={20} /> : <Monitor size={20} />}
                                {activeView === 'vm' ? 'Ubuntu Desktop Instance' : 'Remote Desktop Access'}
                            </h2>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors">
                                    Reboot
                                </button>
                                <button className="px-3 py-1.5 bg-white text-black rounded-md text-xs font-bold hover:bg-zinc-200 transition-colors">
                                    Control Session
                                </button>
                            </div>
                        </div>

                        <RemoteDesktop computerId={activeView === 'vm' ? 'vm-123' : 'local-456'} type={activeView} />

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">CPU Usage</div>
                                <div className="text-xl font-bold">12%</div>
                            </div>
                            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Memory</div>
                                <div className="text-xl font-bold">2.4 / 8 GB</div>
                            </div>
                            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Connection</div>
                                <div className="text-xl font-bold text-green-500">Stable</div>
                            </div>
                        </div>
                    </div>

                    {/* Web Chat Input */}
                    <div className="p-6 border-t border-zinc-800 bg-black">
                        <div className="max-w-4xl mx-auto relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2">
                                <button className="p-1 text-zinc-500 hover:text-white transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ask AI to perform a task on this machine..."
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-full py-3 pl-12 pr-12 focus:outline-none focus:border-zinc-700 transition-colors"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-black p-1.5 rounded-full hover:bg-zinc-200 transition-colors">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
