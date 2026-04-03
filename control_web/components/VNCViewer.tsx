"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, RefreshCcw, Power, Shield, Loader2, MonitorOff, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAccessToken } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VNCViewerProps {
  url?: string;
  status?: string;
  className?: string;
  vmId?: string;
}

export default function VNCViewer({ url, status = 'stopped', className, vmId }: VNCViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    // We need either a vmId (to use the proxy) or a url (direct connection)
    if (!vmId && !url) return;

    // Dynamically import noVNC for SSR compatibility
    // @ts-ignore
    const { default: RFB } = await import('@novnc/novnc/lib/rfb');

    if (rfbRef.current) {
        try {
            rfbRef.current.disconnect();
        } catch (e) {}
        rfbRef.current = null;
    }

    try {
        setLoading(true);
        setError(false);
        setErrorMessage('');

        let wsUrl: string;
        const isDashboardSecure = window.location.protocol === 'https:';
        const wsProtocol = isDashboardSecure ? 'wss:' : 'ws:';

        if (vmId) {
            // ── PROXY PATH (production + localhost) ─────────────────────
            const token = await getAccessToken();
            if (!token) {
                setError(true);
                setErrorMessage('Not authenticated — please log in again');
                setLoading(false);
                return;
            }

            // Derive WebSocket URL from the backend HTTP URL
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
            let wsBase: string;
            if (backendUrl) {
                wsBase = backendUrl.replace(/^http/, 'ws');
            } else {
                wsBase = `${wsProtocol}//${window.location.host}`;
            }
            wsUrl = `${wsBase}/api/vm/${vmId}/ws?token=${encodeURIComponent(token)}`;
            console.log(`[VNC] Connecting via proxy: ${wsUrl.replace(/token=[^&]+/, 'token=***')}`);
        } else if (url) {
            // ── DIRECT PATH (legacy fallback) ───────────────────────────
            const urlObj = new URL(url);
            const host = urlObj.hostname;
            const port = parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
            wsUrl = `${wsProtocol}//${host}:${port}/websockify`;
            console.log(`[VNC] Connecting directly to ${wsUrl}`);
        } else {
            setError(true);
            setErrorMessage('No connection target available');
            setLoading(false);
            return;
        }

        const rfb = new RFB(containerRef.current, wsUrl, {
            credentials: { password: '' },
            wsProtocols: ['binary']
        });

        // ── Performance-critical settings ──────────────────────
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.showDotCursor = true;
        rfb.background = '#09090b';
        rfb.qualityLevel = 6;       // 0-9, lower = faster (JPEG quality)
        rfb.compressionLevel = 2;   // 0-9, lower = less CPU, faster
        rfb.clipViewport = false;

        // Prefer Tight encoding with JPEG for speed
        // noVNC negotiates automatically but these hints help
        try {
            if (rfb._rfbConnectionState !== undefined) {
                rfb._fbDepth = 24;
            }
        } catch (e) {}

        rfb.addEventListener('connect', () => {
            console.log('[VNC] Connected');
            setLoading(false);
            setError(false);
            // Focus immediately for faster interaction
            setTimeout(() => {
                if (rfbRef.current) {
                    rfbRef.current.focus();
                }
            }, 100);
        });

        rfb.addEventListener('disconnect', (e: any) => {
            console.log('[VNC] Disconnected', e.detail);
            if (e.detail.clean === false) {
                setError(true);
                setErrorMessage('Connection lost unexpectedly');
                // Auto-reconnect after brief delay
                setTimeout(() => {
                    if (status === 'running') {
                        console.log('[VNC] Auto-reconnecting...');
                        connect();
                    }
                }, 2000);
            }
            setLoading(false);
        });

        rfb.addEventListener('credentialsrequired', () => {
            console.log('[VNC] Credentials required');
            rfb.sendCredentials({ password: '' });
        });

        rfb.addEventListener('securityfailure', (e: any) => {
            console.error('[VNC] Security failure', e.detail);
            setError(true);
            setErrorMessage(`Security Failure: ${e.detail.reason}`);
            setLoading(false);
        });

        rfbRef.current = rfb;
    } catch (err: any) {
        console.error('[VNC] Setup error', err);
        setError(true);
        setErrorMessage(err.message || 'Failed to initialize VNC client');
        setLoading(false);
    }
  }, [url, vmId, status]);

  useEffect(() => {
    if (status === 'running') {
        // Shorter delay for faster connection
        const timer = setTimeout(connect, 200);
        return () => {
            clearTimeout(timer);
            if (rfbRef.current) rfbRef.current.disconnect();
        };
    }
  }, [status, connect]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(false);
    setErrorMessage('');
    if (rfbRef.current) {
        try { rfbRef.current.disconnect(); } catch (e) {}
        rfbRef.current = null;
    }
    setTimeout(connect, 100);
  }, [connect]);

  const toggleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
    }
  };

  if (status === 'stopped') {
    return (
      <div className={cn("bg-card flex flex-col items-center justify-center text-text-muted gap-4", className)}>
        <MonitorOff size={48} className="text-secondary" />
        <div className="text-center">
          <h3 className="font-bold text-sm text-text-muted">Machine is offline</h3>
          <p className="text-[11px] mt-1">Start the machine to view the desktop</p>
        </div>
      </div>
    );
  }

  if (status === 'starting') {
    return (
      <div className={cn("bg-card flex flex-col items-center justify-center text-text-muted gap-4", className)}>
        <Loader2 size={48} className="animate-spin text-accent-primary/50" />
        <div className="text-center">
          <h3 className="font-bold text-sm text-text-muted">Booting instance...</h3>
          <p className="text-[11px] mt-1">Starting display services</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group bg-zinc-950 flex flex-col overflow-hidden", className)}>

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-40 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg px-2 py-1 border border-white/10">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", error ? "bg-red-500" : "bg-emerald-500")} />
              <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter">Native RFB</span>
          </div>

          <button 
            onClick={handleRefresh}
            className="w-7 h-7 bg-black/80 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors"
            title="Reconnect"
          >
            <RefreshCcw size={12} />
          </button>

          <button 
            onClick={toggleFullscreen}
            className="w-7 h-7 bg-black/80 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors"
            title="Fullscreen"
          >
              <Maximize2 size={12} />
          </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center min-h-0">
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center"
          style={{ cursor: loading ? 'wait' : 'default' }}
        />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm gap-3 z-30">
            <Loader2 size={32} className="animate-spin text-accent-primary" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest animate-pulse">Establishing Bridge...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6 z-50 animate-in fade-in duration-300">
            <div className="w-10 h-10 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 mb-2">
              <Shield size={20} className="text-red-500" />
            </div>
            <div className="max-w-[280px]">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Connection Bridge Failed</h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-4">{errorMessage}</p>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-left mb-4">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight mb-1">Troubleshooting:</p>
                <ul className="text-[9px] text-zinc-400 space-y-1 list-disc list-inside">
                  <li>Ensure the VM is fully booted</li>
                  <li>Check if the VNC port is open</li>
                  <li>Try the external viewer below</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col w-full max-w-[200px] gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                  className="w-full py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
                >
                  Retry Bridge
                </button>
                <button
                   onClick={() => window.open(url, '_blank')}
                   className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/70"
                >
                    Open Native Viewer
                </button>
                <button
                   onClick={() => setError(false)}
                   className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors mt-2"
                >
                    Dismiss
                </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-full text-[9px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
        Direct RFB Bridge via WebSocket
      </div>
    </div>
  );
}
