"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RemoteDesktop({ computerId, type }: { computerId: string, type: 'vm' | 'local' }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const setupConnection = async () => {
            try {
                // In a real implementation, we would initialize WebRTC here
                // For now, we simulate the connection status
                setStatus('Authenticated. Waiting for stream...');

                // Mock signaling: Listen for responses from the desktop
                const channel = supabase.channel(`remote_${computerId}`)
                    .on('broadcast', { event: 'stream_ready' }, () => {
                        setStatus('Streaming');
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            } catch (err: any) {
                setError(err.message);
                setStatus('Failed');
            }
        };

        setupConnection();
    }, [computerId]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (status !== 'Streaming' || !videoRef.current) return;

        const rect = videoRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 1000;
        const y = (e.clientY - rect.top) / rect.height * 1000;

        // Send to signaling table
        supabase.from('remote_signaling').insert({
            user_id: 'current-user-id', // Would get from session
            source: 'web',
            target: 'desktop',
            payload: { type: 'mouse_move', x, y }
        });
    };

    const handleClick = (e: React.MouseEvent) => {
        supabase.from('remote_signaling').insert({
            user_id: 'current-user-id',
            source: 'web',
            target: 'desktop',
            payload: { type: 'click' }
        });
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
            {status !== 'Streaming' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-900/80 z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                    <p>{status}</p>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-crosshair"
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                autoPlay
                playsInline
            />

            <div className="absolute bottom-4 left-4 flex gap-2">
                <div className="px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs text-white border border-white/10 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'Streaming' ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></div>
                    {type === 'vm' ? 'Virtual Machine' : 'Remote Desktop'}
                </div>
            </div>
        </div>
    );
}
