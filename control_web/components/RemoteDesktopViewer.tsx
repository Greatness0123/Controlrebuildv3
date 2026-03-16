"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Monitor, MousePointer, Keyboard, Loader2, AlertCircle, Maximize2, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RemoteDesktopViewerProps {
  deviceId: string;
  className?: string;
}

export default function RemoteDesktopViewer({ deviceId, className }: RemoteDesktopViewerProps) {
  const [screen, setScreen] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'online' | 'streaming' | 'offline'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const channelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const statusRef = useRef(status);
  const lastUpdateRef = useRef(lastUpdate);
  statusRef.current = status;
  lastUpdateRef.current = lastUpdate;

  // Throttle helper
  const lastMoveTimeRef = useRef<number>(0);
  const THROTTLE_MS = 50;

  useEffect(() => {
    if (!deviceId) return;

    const supabase = getSupabaseClient();
    const channelName = `remote_control:${deviceId}`;

    // Prevent re-connecting if already connected to this device
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    console.log(`[Remote] Connecting to device channel: ${channelName}`);
    setStatus('connecting');

    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let isDesktopPresent = false;
        const participants = Object.values(state).flatMap((p: any) => p);
        console.log(`[Remote] Presence sync. Participants found: ${participants.length}`, participants);

        participants.forEach((p: any) => {
          if (p.type === 'desktop' || p.device_id === deviceId) {
            isDesktopPresent = true;
          }
        });

        console.log(`[Remote] Desktop present: ${isDesktopPresent}`);
        if (isDesktopPresent) {
           setStatus(prev => prev === 'connecting' ? 'online' : prev);
           // Auto-request stream when desktop comes online
           if (statusRef.current === 'connecting') {
             setTimeout(() => {
               channel.send({
                 type: 'broadcast',
                 event: 'request_stream',
                 payload: { request_id: Date.now() }
               });
             }, 500);
           }
        }
      })
      .on('broadcast', { event: 'screen_update' }, (payload) => {
        if (payload.payload?.image) {
          setScreen(payload.payload.image);
          setLastUpdate(Date.now());
          setStatus('streaming');
        }
      })
      .subscribe(async (subStatus, err) => {
        console.log(`[Remote] Subscription status: ${subStatus}`);
        if (err) console.error('[Remote] Subscription error:', err);

        if (subStatus === 'SUBSCRIBED') {
          console.log(`[Remote] Subscribed. Requesting initial stream: ${channelName}`);
          
          // Track web viewer presence
          await channel.track({
            online_at: new Date().toISOString(),
            type: 'viewer',
            user_id: 'web'
          });

          // Request stream after a short delay
          setTimeout(() => {
            channel.send({
                type: 'broadcast',
                event: 'request_stream',
                payload: { request_id: Date.now() }
            });
          }, 1500);
        }
      });

    // Monitor connectivity with a stable interval (no state deps)
    const interval = setInterval(() => {
      const curStatus = statusRef.current;
      const curLastUpdate = lastUpdateRef.current;
      const now = Date.now();

      if (curStatus === 'online' && curLastUpdate === 0) {
          console.log('[Remote] Proactive stream retry...');
          startStream();
      }

      if (curStatus === 'streaming' && (now - curLastUpdate) > 10000) {
        console.log('[Remote] Stream stalled, requesting wake...');
        setStatus('online');
        startStream();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [deviceId]); // Only reconnect when deviceId changes

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

    if (type === 'mouse_move') {
        const now = Date.now();
        if (now - lastMoveTimeRef.current < THROTTLE_MS) return;
        lastMoveTimeRef.current = now;
    }

    const container = containerRef.current;
    const img = container.querySelector('img');
    if (!img) return;

    const rect = img.getBoundingClientRect();
    
    // Check if click is within image boundaries
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
    }

    // Calculate relative position within the image
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);

    handleAction(type, { x, y, button: e.button === 2 ? 'right' : 'left' });
  };

  if (isMobile) {
    return (
      <div className={cn("bg-zinc-950 flex flex-col items-center justify-center p-8 text-center gap-6 border border-white/5 rounded-3xl", className)}>
        <div className="relative">
          <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full animate-pulse" />
          <Monitor className="w-12 h-12 text-blue-500/50 relative z-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Mobile Monitor</h3>
          <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed mx-auto">
            Interactive control is optimized for desktop. Open the dedicated monitor for the best mobile experience.
          </p>
        </div>
        <button 
          onClick={() => window.open(`/remote/${deviceId}`, '_blank')}
          className="w-full max-w-[200px] py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-white/5"
        >
          Open Monitor Instance
        </button>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 bg-white/5 px-2 py-1 rounded border border-white/5">
            <Monitor size={10} className="text-zinc-500" />
            <span className="font-bold text-zinc-500 uppercase tracking-tighter">Signaling ID:</span>
            <span className="font-mono text-zinc-400 select-all">{deviceId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    status === 'streaming' ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : 
                    status === 'online' ? "bg-blue-400" : "bg-zinc-600"
                )} />
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">{status}</span>
            </div>
            {status === 'online' && !screen && (
                <button 
                    onClick={startStream}
                    className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all uppercase"
                >
                    Wake
                </button>
            )}
            <button 
              onClick={() => window.open(`/remote/${deviceId}`, '_blank')}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
              title="Open in new window"
            >
                <Maximize2 size={14} />
            </button>
        </div>
      </div>

      {/* Stream Container */}
      <div 
        ref={containerRef}
        tabIndex={0}
        className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center bg-zinc-900/50 outline-none"
        onKeyDown={(e) => {
          // Prevent browser shortcuts
          if (e.ctrlKey || e.metaKey || e.key === 'Tab') {
              // Allow some through if needed, but mostly capture
          }
          handleAction('key_press', { key: e.key });
        }}
        onClick={(e) => {
          if (containerRef.current) containerRef.current.focus();
          handleMouseEvent(e, 'click');
        }}
        onMouseMove={(e) => {
            // Transmit move events even without buttons pressed for "realtime" feel
            // but we'll use handleMouseEvent which already handles throttling/logic
            handleMouseEvent(e, 'mouse_move');
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
