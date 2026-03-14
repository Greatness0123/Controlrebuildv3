"use client";

import { useEffect, useRef, useState } from 'react';
import { Maximize2, RefreshCcw, Power, Shield, Loader2, MonitorOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VNCViewerProps {
  url?: string;
  status?: 'running' | 'stopped' | 'starting';
  className?: string;
}

export default function VNCViewer({ url, status = 'stopped', className }: VNCViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
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
      <div className={cn("bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 gap-4", className)}>
        <MonitorOff size={48} className="text-zinc-800" />
        <div className="text-center">
          <h3 className="font-bold text-sm text-zinc-400">Machine is offline</h3>
          <p className="text-[11px] mt-1">Start the machine to view the desktop</p>
        </div>
      </div>
    );
  }

  if (status === 'starting') {
    return (
      <div className={cn("bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 gap-4", className)}>
        <Loader2 size={48} className="animate-spin text-blue-500/50" />
        <div className="text-center">
          <h3 className="font-bold text-sm text-zinc-400">Booting instance...</h3>
          <p className="text-[11px] mt-1">Starting display services</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group bg-black flex flex-col", className)}>
      {/* Toolbar */}
      <div className="h-10 bg-zinc-950 border-b border-white/5 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Desktop</span>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
            <Shield size={10} />
            <span>Secure Stream (noVNC)</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleRefresh}
            className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            title="Refresh View"
          >
            <RefreshCcw size={14} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Connecting...</span>
          </div>
        )}
        
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-none"
            onLoad={() => setLoading(false)}
            onError={() => setError(true)}
            allow="fullscreen"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-800 text-xs italic">
            No connection URL provided
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <Power size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Connection Failed</h3>
              <p className="text-xs text-zinc-500">Could not connect to the remote display service.</p>
            </div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur border border-white/10 rounded-full text-[9px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Use mouse and keyboard to interact directly
      </div>
    </div>
  );
}
