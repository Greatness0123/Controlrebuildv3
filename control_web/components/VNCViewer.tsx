"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Maximize2, RefreshCcw, Power, Shield, Loader2, MonitorOff, Monitor } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
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
  const [screen, setScreen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'vnc' | 'stream'>('vnc');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);

    // Safety timeout for loading spinner
    // If the iframe doesn't trigger onLoad within 12 seconds,
    // we stop showing the loader so the user can see if there's a partial error or just slow loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 12000);

    return () => clearTimeout(timer);
  }, [url, status]);

  useEffect(() => {
    if (!vmId || status !== 'running') return;

    const supabase = getSupabaseClient();
    const channelName = `vm_control:${vmId}`;
    console.log(`[VNC] Connecting to signaling channel: ${channelName}`);

    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'screen_update' }, (payload) => {
        if (payload.payload?.image) {
          setScreen(payload.payload.image);
          if (loading) setLoading(false);
        }
      })
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
           channel.send({
             type: 'broadcast',
             event: 'request_stream',
             payload: {}
           });
        }
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'stop_stream', payload: {} });
        channelRef.current.unsubscribe();
      }
    };
  }, [vmId, status]);

  const handleStreamAction = useCallback((type: string, data: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'action',
        payload: { type, ...data }
      });
    }
  }, []);

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoading(true);
      setError(false);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const toggleFullscreen = () => {
    const el = document.getElementById('vnc-container');
    if (el?.requestFullscreen) {
      el.requestFullscreen();
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

  const [isHttpInHttps, setIsHttpInHttps] = useState(false);

  const finalUrl = useMemo(() => {
    if (!url) return null;
    let u = url.includes('/vnc.html') ? url : `${url.endsWith('/') ? url : url + '/'}vnc.html?resize=scale&autoconnect=true&reconnect=true`;

    // Check if we are in a production/HTTPS environment but trying to load an HTTP iframe
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && u.startsWith('http:')) {
      setIsHttpInHttps(true);
    } else {
      setIsHttpInHttps(false);
    }

    return u;
  }, [url]);

  return (
    <div id="vnc-container" className={cn("relative group bg-background flex flex-col overflow-hidden", className)}>

      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-40 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex bg-black/80 backdrop-blur rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setViewMode('vnc')}
                className={cn("px-2 py-1 text-[8px] font-black uppercase tracking-tighter rounded-md transition-all", viewMode === 'vnc' ? "bg-white text-black" : "text-white/50 hover:text-white")}
              >
                VNC
              </button>
              <button
                onClick={() => setViewMode('stream')}
                className={cn("px-2 py-1 text-[8px] font-black uppercase tracking-tighter rounded-md transition-all", viewMode === 'stream' ? "bg-white text-black" : "text-white/50 hover:text-white")}
              >
                Stream
              </button>
          </div>

          <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg px-2 py-1 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter">Live</span>
          </div>

          <button 
            onClick={handleRefresh}
            className="w-7 h-7 bg-black/80 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors"
            title="Refresh"
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

      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        {viewMode === 'vnc' ? (
           finalUrl ? (
            <div className="absolute inset-0 w-full h-full">
              <iframe
                ref={iframeRef}
                src={finalUrl}
                className={cn(
                  "w-full h-full border-none overflow-hidden transition-opacity duration-500",
                  loading ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError(true);
                  setLoading(false);
                }}
                allow="fullscreen"
              />
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 gap-3">
                  <Loader2 size={32} className="animate-spin text-accent-primary" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Connecting to display...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-800 text-xs italic">
              No connection URL provided
            </div>
          )
        ) : (
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
              handleStreamAction('click', { x, y, button: 'left' });
            }}
          >
            {screen ? (
              <img src={screen} alt="VM Stream" className="max-w-full max-h-full object-contain pointer-events-none" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-accent-primary/50" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Starting secure stream...</span>
              </div>
            )}
          </div>
        )}

        {(error || isHttpInHttps) && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-6 z-50">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <Shield size={24} className="text-amber-500" />
            </div>
            <div className="max-w-[280px]">
              <h3 className="text-sm font-bold text-white mb-1">
                {isHttpInHttps ? "Security Block" : "Connection Failed"}
              </h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {isHttpInHttps
                  ? "Browsers block insecure display streams on secure sites. Switch to 'Stream' mode or use the external viewer."
                  : "Could not connect to the remote display service."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('stream')}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-accent-foreground rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
              >
                <Monitor size={12} />
                Switch to Stream
              </button>
              <button
                onClick={() => window.open(finalUrl || '', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
              >
                <Maximize2 size={12} />
                External
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-full text-[9px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Use mouse and keyboard to interact directly
      </div>
    </div>
  );
}
