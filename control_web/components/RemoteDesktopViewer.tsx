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
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [showWorkflows, setShowWorkflows] = useState(false);
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
  const THROTTLE_MS = 25;

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
           if (statusRef.current === 'connecting' || statusRef.current === 'online') {
             setTimeout(() => {
               channel.send({
                 type: 'broadcast',
                 event: 'request_stream',
                 payload: { request_id: Date.now() }
               });
             }, 100);
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
      .on('broadcast', { event: 'workflows_list' }, (payload) => {
        if (payload.payload?.workflows) {
           setWorkflows(payload.payload.workflows);
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

          // Request stream immediately upon subscription
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'request_stream',
              payload: { request_id: Date.now() }
            });
            channel.send({
              type: 'broadcast',
              event: 'request_workflows',
              payload: {}
            });
          }, 200);
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


  if (status === 'connecting' && !screen) {
    return (
      <div className={cn("bg-background flex flex-col items-center justify-center gap-4", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary/50" />
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Bridging Connection...</p>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-background flex flex-col overflow-hidden group", className)}>
      {/* Header */}
      <div className="h-10 bg-secondary border-b border-border flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-accent-primary">
            <Zap size={14} className={status === 'streaming' ? 'animate-pulse' : 'opacity-50'} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Live Desktop
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-[10px] text-text-muted bg-secondary px-2 py-1 rounded border border-border">
            <Monitor size={10} className="text-text-muted" />
            <span className="font-bold text-text-muted uppercase tracking-tighter">Signaling ID:</span>
            <span className="font-mono text-text-secondary select-all">{deviceId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-secondary border border-border">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    status === 'streaming' ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : 
                    status === 'online' ? "bg-accent-primary" : "bg-text-muted"
                )} />
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-tight">{status}</span>
            </div>
            {status === 'online' && !screen && (
                <button 
                    onClick={startStream}
                    className="px-2 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded text-[9px] font-bold text-accent-primary hover:bg-accent-primary/20 transition-all uppercase"
                >
                    Wake
                </button>
            )}
            
            <div className="relative group/wf z-50">
                <button 
                  onClick={() => setShowWorkflows(!showWorkflows)}
                  className="px-2 py-1 bg-secondary border border-border rounded text-[9px] font-bold text-text-muted hover:text-foreground transition-all uppercase flex items-center gap-1"
                >
                  Workflows
                </button>
                {showWorkflows && workflows.length > 0 && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-border rounded-xl shadow-2xl p-1 overflow-hidden z-[100]">
                    {workflows.map(wf => (
                      <button
                        key={wf.id}
                        onClick={() => {
                          channelRef.current?.send({
                            type: 'broadcast',
                            event: 'execute_workflow',
                            payload: { id: wf.id }
                          });
                          setShowWorkflows(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors truncate"
                      >
                        {wf.name}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <button 
              onClick={() => window.open(`/remote/${deviceId}`, '_blank')}
              className="p-1.5 hover:bg-card-hover rounded text-text-muted hover:text-foreground transition-colors"
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
