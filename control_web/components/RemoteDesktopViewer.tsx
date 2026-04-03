"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabaseClient, getAccessToken } from '@/lib/supabase';
import { Monitor, Loader2, Maximize2, Zap, Wifi, WifiOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RemoteDesktopViewerProps {
  deviceId: string;
  className?: string;
}

type TransportType = 'ws-relay' | 'supabase';

export default function RemoteDesktopViewer({ deviceId, className }: RemoteDesktopViewerProps) {
  const [status, setStatus] = useState<'connecting' | 'online' | 'streaming' | 'offline'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [fps, setFps] = useState(0);
  const [transport, setTransport] = useState<TransportType>('ws-relay');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasFrameRef = useRef(false);

  // WebSocket relay refs
  const wsRef = useRef<WebSocket | null>(null);
  // Supabase fallback refs
  const channelRef = useRef<any>(null);
  const isJoinedRef = useRef(false);

  // Performance tracking
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<any>(null);
  const statusRef = useRef(status);
  const lastUpdateRef = useRef(lastUpdate);
  statusRef.current = status;
  lastUpdateRef.current = lastUpdate;

  const lastMoveTimeRef = useRef<number>(0);
  const THROTTLE_MS = 16; // ~60fps mouse tracking

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FPS counter
  useEffect(() => {
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    return () => clearInterval(fpsIntervalRef.current);
  }, []);

  // ── Render frame to canvas ─────────────────────────────────────────
  const renderFrameFromBlob = useCallback((blob: Blob) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) { URL.revokeObjectURL(url); return; }

      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const aspectRatio = img.width / img.height;
        let drawWidth = containerRect.width;
        let drawHeight = containerRect.width / aspectRatio;
        if (drawHeight > containerRect.height) {
          drawHeight = containerRect.height;
          drawWidth = containerRect.height * aspectRatio;
        }
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        canvas.style.width = `${drawWidth}px`;
        canvas.style.height = `${drawHeight}px`;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      hasFrameRef.current = true;
      frameCountRef.current++;
    };
    img.src = url;
  }, []);

  const renderFrameFromDataUrl = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const aspectRatio = img.width / img.height;
        let drawWidth = containerRect.width;
        let drawHeight = containerRect.width / aspectRatio;
        if (drawHeight > containerRect.height) {
          drawHeight = containerRect.height;
          drawWidth = containerRect.height * aspectRatio;
        }
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        canvas.style.width = `${drawWidth}px`;
        canvas.style.height = `${drawHeight}px`;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      hasFrameRef.current = true;
      frameCountRef.current++;
    };
    img.src = dataUrl;
  }, []);

  // ── Send action to desktop ─────────────────────────────────────────
  const sendAction = useCallback((type: string, data: any) => {
    const payload = JSON.stringify({ type, ...data });

    // Try WebSocket relay first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
      return;
    }

    // Fallback to Supabase channel
    if (channelRef.current && isJoinedRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'action',
        payload: { type, ...data }
      });
    }
  }, []);

  // ── WebSocket Relay Connection ─────────────────────────────────────
  const connectWebSocketRelay = useCallback(async () => {
    if (!deviceId) return false;

    try {
      const token = await getAccessToken();
      if (!token) return false;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      let wsBase: string;
      if (backendUrl) {
        wsBase = backendUrl.replace(/^http/, 'ws');
      } else {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBase = `${wsProtocol}//${window.location.host}`;
      }

      const wsUrl = `${wsBase}/api/remote/${deviceId}/viewer?token=${encodeURIComponent(token)}`;
      console.log(`[Remote] Connecting via WebSocket relay...`);

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log(`[Remote] WebSocket relay connected`);
          wsRef.current = ws;
          setStatus('online');
          setTransport('ws-relay');

          // Request stream start
          ws.send(JSON.stringify({ type: 'request_stream' }));
          resolve(true);
        };

        ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Binary = frame data (JPEG bytes)
            const blob = new Blob([event.data], { type: 'image/jpeg' });
            renderFrameFromBlob(blob);
            setLastUpdate(Date.now());
            setStatus('streaming');
          } else if (typeof event.data === 'string') {
            // Text = control message
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'workflows_list' && msg.workflows) {
                setWorkflows(msg.workflows);
              }
            } catch { }
          }
        };

        ws.onerror = (err) => {
          console.warn('[Remote] WebSocket relay error:', err);
        };

        ws.onclose = (e) => {
          console.log(`[Remote] WebSocket relay closed: ${e.code} ${e.reason}`);
          wsRef.current = null;

          // Auto-reconnect if not intentional
          if (e.code !== 1000 && e.code !== 4001) {
            setTimeout(() => {
              if (deviceId) {
                console.log('[Remote] Attempting WebSocket relay reconnect...');
                connectWebSocketRelay();
              }
            }, 3000);
          }
        };
      });
    } catch (err) {
      console.warn('[Remote] WebSocket relay setup failed:', err);
      return false;
    }
  }, [deviceId, renderFrameFromBlob]);

  // ── Supabase Fallback Connection ───────────────────────────────────
  const connectSupabaseFallback = useCallback(() => {
    if (!deviceId) return;

    const supabase = getSupabaseClient();
    const channelName = `remote_control:${deviceId}`;

    console.log(`[Remote] Connecting via Supabase fallback: ${channelName}`);
    setTransport('supabase');

    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const participants = Object.values(state).flatMap((p: any) => p);
        const isDesktopPresent = participants.some(
          (p: any) => p.type === 'desktop' || p.device_id === deviceId
        );

        if (isDesktopPresent) {
          setStatus(prev => prev === 'connecting' ? 'online' : prev);
          if (statusRef.current === 'connecting' || statusRef.current === 'online') {
            setTimeout(() => {
              channel.send({
                type: 'broadcast', event: 'request_stream',
                payload: { format: 'jpeg', quality: 65, max_width: 1280, fps_target: 15 }
              });
            }, 50);
          }
        }
      })
      .on('broadcast', { event: 'screen_update' }, (payload) => {
        if (payload.payload?.image) {
          renderFrameFromDataUrl(payload.payload.image);
          setLastUpdate(Date.now());
          setStatus('streaming');
        }
      })
      .on('broadcast', { event: 'workflows_list' }, (payload) => {
        if (payload.payload?.workflows) setWorkflows(payload.payload.workflows);
      })
      .subscribe(async (subStatus, err) => {
        if (subStatus === 'SUBSCRIBED') {
          isJoinedRef.current = true;
          await channel.track({ online_at: new Date().toISOString(), type: 'viewer', user_id: 'web' });
          setTimeout(() => {
            if (isJoinedRef.current) {
              channel.send({
                type: 'broadcast', event: 'request_stream',
                payload: { format: 'jpeg', quality: 65, max_width: 1280, fps_target: 15, request_id: Date.now() }
              });
              channel.send({ type: 'broadcast', event: 'request_workflows', payload: {} });
            }
          }, 100);
        }
      });
  }, [deviceId, renderFrameFromDataUrl]);

  // ── Main connection effect ─────────────────────────────────────────
  useEffect(() => {
    if (!deviceId) return;

    let cleanup = false;

    async function connect() {
      // Try WebSocket relay first (lower latency)
      const wsConnected = await connectWebSocketRelay();
      if (cleanup) return;

      if (!wsConnected) {
        // Fall back to Supabase Realtime
        console.log('[Remote] WebSocket relay unavailable, using Supabase fallback');
        connectSupabaseFallback();
      }
    }

    connect();

    // Health check interval
    const interval = setInterval(() => {
      const now = Date.now();
      if (statusRef.current === 'streaming' && (now - lastUpdateRef.current) > 5000) {
        console.log('[Remote] Stream stalled, requesting wake...');
        setStatus('online');

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'request_stream' }));
        } else if (channelRef.current && isJoinedRef.current) {
          channelRef.current.send({
            type: 'broadcast', event: 'request_stream',
            payload: { format: 'jpeg', quality: 65, max_width: 1280, fps_target: 15 }
          });
        }
      }
    }, 3000);

    return () => {
      cleanup = true;
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
        wsRef.current = null;
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      isJoinedRef.current = false;
    };
  }, [deviceId, connectWebSocketRelay, connectSupabaseFallback]);

  // ── Mouse/keyboard event handlers ──────────────────────────────────
  const handleMouseEvent = (e: React.MouseEvent, type: 'mouse_move' | 'click') => {
    if (!canvasRef.current || (status !== 'streaming' && status !== 'online')) return;

    if (type === 'mouse_move') {
      const now = Date.now();
      if (now - lastMoveTimeRef.current < THROTTLE_MS) return;
      lastMoveTimeRef.current = now;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);

    sendAction(type, { x, y, button: e.button === 2 ? 'right' : 'left' });
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (status === 'connecting' && !hasFrameRef.current) {
    return (
      <div className={cn("bg-background flex flex-col items-center justify-center gap-4", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary/50" />
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Bridging Connection...</p>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-background flex flex-col overflow-hidden group", className)}>

      {/* Status bar */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-40 opacity-40 hover:opacity-100 transition-opacity">
          {status === 'online' && !hasFrameRef.current && (
              <button 
                  onClick={() => sendAction('request_stream', {})}
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
              {status === 'streaming' && fps > 0 && (
                <span className="text-[7px] text-emerald-400 ml-0.5">{fps}fps</span>
              )}
          </div>

          {/* Transport indicator */}
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg px-1.5 py-1 border border-white/10 overlay-element">
            {transport === 'ws-relay' ? (
              <Wifi size={9} className="text-emerald-400" />
            ) : (
              <WifiOff size={9} className="text-amber-400" />
            )}
            <span className="text-[7px] font-bold text-white/40 uppercase">
              {transport === 'ws-relay' ? 'Direct' : 'Relay'}
            </span>
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
                        sendAction('execute_workflow', { id: wf.id });
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

      {/* Canvas display */}
      <div 
        ref={containerRef}
        tabIndex={0}
        className="flex-1 relative cursor-crosshair overflow-hidden flex items-center justify-center bg-zinc-900/50 outline-none"
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey || e.key === 'Tab') {
            // Allow browser shortcuts
          }
          sendAction('key_press', { key: e.key });
        }}
        onClick={(e) => {
          if (containerRef.current) containerRef.current.focus();
          handleMouseEvent(e, 'click');
        }}
        onMouseMove={(e) => handleMouseEvent(e, 'mouse_move')}
        onContextMenu={(e) => {
            e.preventDefault();
            handleMouseEvent(e, 'click');
        }}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full pointer-events-none select-none shadow-2xl"
          style={{ imageRendering: 'auto' }}
        />

        {!hasFrameRef.current && status !== 'streaming' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center animate-spin-slow">
                    <Monitor size={20} className="text-zinc-800" />
                </div>
                <div className="text-center">
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Waiting for frames...</p>
                    <p className="text-[9px] text-zinc-700 mt-1">Make sure the Control Desktop app is open and &quot;Remote Access&quot; is ON</p>
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
