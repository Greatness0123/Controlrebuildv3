"use client";

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Monitor, MousePointer, Keyboard, Loader2, AlertCircle, Maximize2 } from 'lucide-react';

interface RemoteDesktopViewerProps {
  userId: string;
  className?: string;
}

export default function RemoteDesktopViewer({ userId, className }: RemoteDesktopViewerProps) {
  const [screen, setScreen] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const channelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    const channelName = `remote_control:${userId}`;

    setStatus('connecting');

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'screen_update' }, (payload) => {
        setScreen(payload.payload.image);
        setLastUpdate(Date.now());
        setStatus('connected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Remote] Subscribed to screen updates');
        }
      });

    channelRef.current = channel;

    // Check for offline status if no updates received
    const interval = setInterval(() => {
      if (Date.now() - lastUpdate > 5000 && status === 'connected') {
        setStatus('offline');
      }
    }, 2000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [userId, lastUpdate, status]);

  const handleAction = (type: string, data: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'action',
        payload: { type, ...data }
      });
    }
  };

  const handleMouseEvent = (e: React.MouseEvent, type: 'mouse_move' | 'click') => {
    if (!containerRef.current || status !== 'connected') return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);

    handleAction(type, { x, y, button: e.button === 2 ? 'right' : 'left' });
  };

  if (status === 'connecting' && !screen) {
    return (
      <div className={`bg-zinc-950 flex flex-col items-center justify-center gap-4 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Waiting for desktop stream...</p>
      </div>
    );
  }

  if (status === 'offline' && !screen) {
    return (
      <div className={`bg-zinc-950 flex flex-col items-center justify-center gap-4 ${className}`}>
        <Monitor className="w-12 h-12 text-zinc-800" />
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-400">Desktop is offline</p>
          <p className="text-[10px] text-zinc-600 mt-1">Ensure Remote Access is enabled on your computer</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black flex flex-col overflow-hidden group ${className}`}>
      {/* Header */}
      <div className="h-10 bg-zinc-950 border-b border-white/5 flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Remote Desktop
            </span>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <MousePointer size={10} />
            <Keyboard size={10} />
            <span>Interactive</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {status === 'offline' && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-bold text-amber-500 uppercase">
                    <AlertCircle size={10} />
                    Connection Lost
                </div>
            )}
            <button className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors">
                <Maximize2 size={14} />
            </button>
        </div>
      </div>

      {/* Stream Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center"
        onClick={(e) => handleMouseEvent(e, 'click')}
        onMouseMove={(e) => {
            // Throttled mouse move would be better, but let's start simple
            if (e.buttons === 1) handleMouseEvent(e, 'mouse_move');
        }}
        onContextMenu={(e) => {
            e.preventDefault();
            handleMouseEvent(e, 'click');
        }}
      >
        {screen ? (
          <img 
            src={screen} 
            alt="Remote Desktop Stream" 
            className="max-w-full max-h-full object-contain pointer-events-none select-none shadow-2xl"
          />
        ) : (
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-800" />
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Synchronizing...</span>
            </div>
        )}

        {/* Action Overlay Tips */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-full text-[9px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Click to interact • Drag to move
        </div>
      </div>
    </div>
  );
}
