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
  const isJoinedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startStream = useCallback(() => {
    if (channelRef.current && isJoinedRef.current) {
      console.log('[Remote] Requesting stream start...');
      channelRef.current.send({
        type: 'broadcast',
        event: 'request_stream',
        payload: {}
      });
    }
  }, []);

  const stopStream = useCallback(() => {
    if (channelRef.current && isJoinedRef.current) {
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

  const lastMoveTimeRef = useRef<number>(0);
  const THROTTLE_MS = 10;

  useEffect(() => {
    if (!deviceId) return;

    const supabase = getSupabaseClient();
    const channelName = `remote_control:${deviceId}`;

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
          isJoinedRef.current = true;
          console.log(`[Remote] Subscribed. Requesting initial stream: ${channelName}`);
          
          await channel.track({
            online_at: new Date().toISOString(),
            type: 'viewer',
            user_id: 'web'
          });

          setTimeout(() => {
            if (isJoinedRef.current) {
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
            }
          }, 300);
        }
      });

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
      isJoinedRef.current = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [deviceId]); // Only reconnect when deviceId changes

  const handleAction = (type: string, data: any) => {
    if (channelRef.current && isJoinedRef.current) {
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

    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
    }

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

      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-40 opacity-40 hover:opacity-100 transition-opacity">
          {status === 'online' && !screen && (
              <button 
                  onClick={startStream}
                  className="px-2 py-1 bg-accent-primary/80 backdrop-blur text-[8px] font-black text-white rounded-lg uppercase tracking-widest shadow-xl"
              >
                  Wake Stream
              </button>
          )}
          
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg px-2 py-1 border border-white/10 overlay-element">
              <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  status === 'streaming' ? "bg-emerald-500" : status === 'online' ? "bg-accent-primary" : "bg-zinc-600"
              )} />
              <span className="text-[8px] font-black text-white uppercase tracking-tighter">{status}</span>
          </div>

          <div className="relative group/wf">
              <button 
                onClick={() => setShowWorkflows(!showWorkflows)}
                className="w-7 h-7 bg-black/80 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors overlay-element"
                title="Workflows"
              >
                <Zap size={12} />
              </button>
              {showWorkflows && workflows.length > 0 && (
                <div className="absolute right-0 mt-1 w-40 bg-zinc-950 border border-border rounded-xl shadow-2xl p-1 overflow-hidden z-[100] overlay-element">
                  {workflows.map(wf => (
                    <button
                      key={wf.id}
                      onClick={() => {
                        handleAction('execute_workflow', { id: wf.id });
                        setShowWorkflows(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[9px] text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors truncate"
                    >
                      {wf.name}
                    </button>
                  ))}
                </div>
              )}
          </div>

          <button 
            onClick={() => window.open(`/remote/${deviceId}`, '_blank')}
            className="w-7 h-7 bg-black/80 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors shadow-2xl overlay-element"
            title="Pop-out Viewer"
          >
              <Maximize2 size={12} />
          </button>
      </div>

      <div 
        ref={containerRef}
        tabIndex={0}
        className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center bg-zinc-900/50 outline-none"
        onKeyDown={(e) => {

          if (e.ctrlKey || e.metaKey || e.key === 'Tab') {

          }
          handleAction('key_press', { key: e.key });
        }}
        onClick={(e) => {
          if (containerRef.current) containerRef.current.focus();
          handleMouseEvent(e, 'click');
        }}
        onMouseMove={(e) => {

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

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-full text-[9px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Click to interact • Drag to move
        </div>
      </div>
    </div>
  );
}
