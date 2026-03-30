"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, RefreshCcw, Power, Shield, Loader2, MonitorOff, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
    if (!url || typeof window === 'undefined') return;

    // Dynamically import noVNC for SSR compatibility
    const { default: RFB } = await import('@novnc/novnc/lib/rfb');

    if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
    }

    try {
        setLoading(true);
        setError(false);
        setErrorMessage('');

        // Parse URL components for RFB connection
        // Format: http://host:port/vnc.html -> host:port
        const urlObj = new URL(url);
        const host = urlObj.hostname;
        const port = parseInt(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);

        // Browsers block raw TCP. We need to connect via WebSocket.
        // If the URL is http, we use ws. If https, we use wss.
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${host}:${port}/websockify`;

        console.log(`[VNC] Connecting to ${wsUrl}`);

        const rfb = new RFB(containerRef.current, wsUrl, {
            credentials: { password: '' }
        });

        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.showDotCursor = true;
        rfb.background = '#09090b';

        rfb.addEventListener('connect', () => {
            console.log('[VNC] Connected');
            setLoading(false);
            setError(false);
        });

        rfb.addEventListener('disconnect', (e: any) => {
            console.log('[VNC] Disconnected', e.detail);
            if (e.detail.clean === false) {
                setError(true);
                setErrorMessage('Connection lost unexpectedly');
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
  }, [url]);

  useEffect(() => {
    if (status === 'running') {
        // Short delay to ensure DOM is ready
        const timer = setTimeout(connect, 500);
        return () => {
            clearTimeout(timer);
            if (rfbRef.current) rfbRef.current.disconnect();
        };
    }
  }, [status, connect]);

  const handleRefresh = () => {
    connect();
  };

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
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-6 z-50">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
              <Power size={24} className="text-red-500" />
            </div>
            <div className="max-w-[300px]">
              <h3 className="text-sm font-bold text-white mb-1">Bridge Connection Failed</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed mb-1">{errorMessage}</p>
              <p className="text-[9px] text-zinc-600 italic">Verify the machine is reachable and websockify is running on the proxy port.</p>
            </div>
            <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  className="px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
                >
                  Retry Connection
                </button>
                <button
                   onClick={() => window.open(url, '_blank')}
                   className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    External Viewer
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
