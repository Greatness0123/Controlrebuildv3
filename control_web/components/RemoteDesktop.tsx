"use client";

import { useEffect, useState } from 'react';
import { Monitor, Cpu, Terminal } from 'lucide-react';

interface RemoteDesktopProps {
    vmId: string;
    noVncPort?: number;
    instanceUrl?: string;
    type?: 'vm' | 'local';
}

export default function RemoteDesktop({ vmId, noVncPort, instanceUrl, type = 'vm' }: RemoteDesktopProps) {
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {

        const steps = [
            { delay: 500, msg: 'Authenticating...' },
            { delay: 1500, msg: 'Establishing secure tunnel...' },
            { delay: 2500, msg: 'Waiting for stream...' },
        ];

        const timeouts = steps.map(({ delay, msg }) =>
            setTimeout(() => setStatus(msg), delay)
        );

        return () => timeouts.forEach(clearTimeout);
    }, [vmId]);

    if (instanceUrl) {

        let vncUrl = instanceUrl;
        if (!vncUrl.includes('/vnc.html')) {
            vncUrl = `${vncUrl.endsWith('/') ? vncUrl : vncUrl + '/'}vnc.html?resize=scale&autoconnect=true`;
        } else if (!vncUrl.includes('autoconnect=true')) {
            vncUrl += (vncUrl.includes('?') ? '&' : '?') + 'resize=scale&autoconnect=true';
        }

        return (
            <div className="w-full h-full bg-black relative overflow-hidden">
                <iframe 
                    src={vncUrl} 
                    className="w-full h-full border-none absolute inset-0 overflow-hidden"
                    title={`VNC Stream for ${vmId}`}
                    allow="fullscreen"
                />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">

            <div className="absolute inset-0 dot-grid opacity-30" />

            <div className="relative z-10 flex flex-col items-center justify-center gap-4 p-8">

                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse-glow">
                    {type === 'vm' ? (
                        <Cpu size={28} className="text-zinc-500" />
                    ) : (
                        <Monitor size={28} className="text-zinc-500" />
                    )}
                </div>

                <div className="text-center space-y-2">
                    <p className="text-sm text-zinc-400 font-medium">{status}</p>
                    <div className="flex items-center gap-2 justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                            {type === 'vm' ? 'Virtual Machine' : 'Remote Desktop'}
                        </span>
                    </div>
                </div>

                <div className="mt-4 w-full max-w-sm space-y-1.5">
                    <TerminalLine text="$ ssh control@157.230.22.10" delay={800} />
                    <TerminalLine text="Connecting to remote host..." delay={1600} />
                    <TerminalLine text="Authentication successful." delay={2400} />
                    <TerminalLine text="Loading desktop environment..." delay={3200} blinking />
                </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-zinc-500 border border-white/5">
                    <Terminal size={10} />
                    {vmId}
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-yellow-500/80">Connecting</span>
                </div>
            </div>
        </div>
    );
}

function TerminalLine({ text, delay, blinking }: { text: string; delay: number; blinking?: boolean }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    if (!visible) return null;

    return (
        <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-[11px] font-mono text-zinc-600">{text}</span>
            {blinking && <span className="w-1.5 h-4 bg-zinc-500" style={{ animation: 'blink 1s step-end infinite' }} />}
        </div>
    );
}
