"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { Maximize2, RefreshCcw, Power, Shield, Loader2, MonitorOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VNCViewerProps {
  url?: string;
  status?: string;
  className?: string;
}

export default function VNCViewer({ url, status = 'stopped', className }: VNCViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handleRefresh = () => {
    if (iframeRef.current) {
      setLoading(true);
      setError(false);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const toggleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
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
    <div className={cn("relative group bg-background flex flex-col overflow-hidden", className)}>

      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-40 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur rounded-lg px-2 py-1 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter">Live VNC</span>
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
        {finalUrl ? (
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
                  ? "Browsers block insecure display streams on secure sites. Open the external viewer to access your machine."
                  : "Could not connect to the remote display service."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(finalUrl || '', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
              >
                <Maximize2 size={12} />
                Open External
              </button>
              {!isHttpInHttps && (
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Retry
                </button>
              )}
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
