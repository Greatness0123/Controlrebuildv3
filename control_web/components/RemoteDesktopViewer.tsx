"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Monitor, MousePointer, Keyboard, Loader2, AlertCircle, Maximize2, Zap } from 'lucide-react';

interface RemoteDesktopViewerProps {
  deviceId: string;
  className?: string;
}

export default function RemoteDesktopViewer({ deviceId, className }: RemoteDesktopViewerProps) {
  const [screen, setScreen] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'online' | 'streaming' | 'offline'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const channelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startStream = useCallback(() => {
    if (channelRef.current) {
      console.log('[Remote] Requesting stream start...');
      channelRef.current.send({
        type: 'broadcast',
        event: 'request_stream',
        payload: {}
      });
    }
  }, []);

  const stopStream = useCallback(() => {
    if (channelRef.current) {
        console.log('[Remote] Requesting stream stop...');
        channelRef.current.send({
          type: 'broadcast',
          event: 'stop_stream',
          payload: {}
        });
    }
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    const supabase = getSupabaseClient();
    const channelName = `remote_control:${deviceId}`;

    console.log(`[Remote] Connecting to device channel: ${channelName}`);
    setStatus('connecting');

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'screen_update' }, (payload) => {
        setScreen(payload.payload.image);
        setLastUpdate(Date.now());
        setStatus('streaming');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Remote] Subscribed to device channel');
          // Request initial stream
          setTimeout(startStream, 1000);
        }
      });

    channelRef.current = channel;

    // Monitor connectivity
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastUpdate;

      if (diff > 10000) {
        // If we were streaming but haven't seen an update, maybe offline or just stopped
        if (status === 'streaming') {
            setStatus('online'); // Revert to online but not streaming
        }
      }
    }, 5000);

    return () => {
      stopStream();
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [deviceId, startStream, stopStream]);

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
    if (!containerRef.current || (status !== 'streaming' && status !== 'online')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);

    handleAction(type, { x, y, button: e.button === 2 ? 'right' : 'left' });
  };

  if (status === 'connecting' && !screen) {
    return (
      <div className={`bg-zinc-950 flex flex-col items-center justify-center gap-4 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bridging Connection...</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-black flex flex-col overflow-hidden group ${className}`}>
      {/* Header */}
      <div className="h-10 bg-zinc-950 border-b border-white/5 flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-blue-400">
            <Zap size={14} className={status === 'streaming' ? 'animate-pulse' : 'opacity-50'} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Live Desktop
            </span>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <MousePointer size={10} />
            <Keyboard size={10} />
            <span className="font-mono">{deviceId.split('-')[0]}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {status === 'online' && !screen && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 italic">Device is idle</span>
                    <button 
                        onClick={startStream}
                        className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all uppercase"
                    >
                        Wake Stream
                    </button>
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
        className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center bg-zinc-900/50"
        onClick={(e) => handleMouseEvent(e, 'click')}
        onMouseMove={(e) => {
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
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center animate-spin-slow">
                    <Monitor size={20} className="text-zinc-800" />
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Waiting for frames...</p>
                    <p className="text-[9px] text-zinc-700 mt-1">Make sure the Control Desktop app is open and "Remote Access" is ON</p>
                </div>
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
