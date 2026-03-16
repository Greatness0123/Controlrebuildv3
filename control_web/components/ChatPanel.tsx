"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useChatStore, useVMStore, useDeviceStore } from '@/lib/store';
import { chatApi, vmApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Send, User, Bot, Terminal, MousePointer2, Camera, Loader2, 
  Sparkles, AlertCircle, Cpu, Laptop, ChevronDown, Check, Target, Paperclip, 
  HandMetal, Square, PlayCircle, PauseCircle, MousePointer
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const { messages, setMessages, addMessage, isStreaming, setStreaming, sessions, setSessions } = useChatStore();
  const { vms } = useVMStore();
  const { devices } = useDeviceStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [targetSelectorOpen, setTargetSelectorOpen] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hitlRequired, setHitlRequired] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current session data from store
  const session = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);

  const handleSwitchTarget = async (type: 'vm' | 'device', id: string) => {
    // 1. Close immediately for responsiveness
    setTargetSelectorOpen(false);
    
    // 2. Optimistic update to store
    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          vm_id: type === 'vm' ? id : undefined,
          device_id: type === 'device' ? id : undefined
        };
      }
      return s;
    });
    setSessions(updatedSessions);

    try {
      await chatApi.update(sessionId, {
        vm_id: type === 'vm' ? id : null,
        device_id: type === 'device' ? id : null
      });
      toast.success(`Switched target to ${type === 'vm' ? 'VM' : 'Device'}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to switch target");
      // Optional: Logic to revert store if needed, but usually a simple re-fetch later handles it
    }
  };

  // Determine active target (VM or Device)
  const activeTarget = useMemo(() => {
    if (session?.vm_id) return { type: 'vm', id: session.vm_id, name: vms.find(v => v.id === session.vm_id)?.name || 'Unknown VM' };
    if (session?.device_id) return { type: 'device', id: session.device_id, name: devices.find(d => d.id === session.device_id)?.name || 'Unknown Device' };
    return null;
  }, [session, vms, devices]);

  // Auto-select running VM if none is active
  useEffect(() => {
    if (!activeTarget && vms.length > 0 && session) {
      const runningVM = vms.find(v => v.status === 'running');
      if (runningVM) {
        // Background update without UI popups
        chatApi.update(sessionId, { vm_id: runningVM.id, device_id: null });
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, vm_id: runningVM.id, device_id: undefined } : s));
      }
    }
  }, [vms, activeTarget, session, sessionId, setSessions, sessions]);

  useEffect(() => {
    // Clear messages immediately when switching sessions to avoid flicker
    // and ensure the welcome screen shows for empty sessions.
    setMessages([]);
    setError('');

    const loadMessages = async () => {
      try {
        const res = await chatApi.messages(sessionId);
        setMessages(res.messages);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };
    loadMessages();
  }, [sessionId, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input;
    setInput('');
    setError('');
    
    // Optimistic user message (the backend creates it, but we can show it immediately)
    // Actually, our API handler streams the events including the user message if needed, 
    // but better to wait for the backend call to be sure.
    
    setStreaming(true);
    setAiState('running');
    try {
      const stream = chatApi.sendMessage(sessionId, userMsg);
      
      // Update local messages after the first response
      for await (const event of stream) {
        if (event.type === 'message') {
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: event.content,
            created_at: new Date().toISOString()
          } as any);
        } else if (event.type === 'thought') {
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: event.content,
            created_at: new Date().toISOString()
          } as any);
        } else if (event.type === 'action') {
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'action',
            content: `Executing ${event.action}...`,
            action_type: event.action,
            action_data: event.params,
            created_at: new Date().toISOString()
          } as any);
        } else if (event.type === 'action' && event.action === 'hitl') {
          setHitlRequired(true);
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: "I need your help with sensitive information (login/signup). Please perform the action on the screen and click the button below when done.",
            created_at: new Date().toISOString()
          } as any);
        } else if (event.type === 'error') {
          setError(event.content);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setStreaming(false);
      setAiState('idle');
      // Refresh messages to get persistent IDs from DB
      const res = await chatApi.messages(sessionId);
      setMessages(res.messages);
    }
  };

  // Real-time mouse tracking (simplified for display)
  useEffect(() => {
    if (aiState === 'running') {
      const handleMouseMove = (e: MouseEvent) => {
        // Normalize to 0-1000 for representation
        const x = Math.round((e.clientX / window.innerWidth) * 1000);
        const y = Math.round((e.clientY / window.innerHeight) * 1000);
        setMousePos({ x, y });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [aiState]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border-r border-white/5 relative">
      {/* Target Selector Header */}
      <div className="bg-zinc-900/50 border-b border-white/5 px-4 py-3 z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setTargetSelectorOpen(!targetSelectorOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all",
              activeTarget 
                ? "bg-white/5 border-white/10 hover:bg-white/20" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                activeTarget ? (activeTarget.type === 'vm' ? "bg-green-500" : "bg-blue-400") : "bg-zinc-700"
              )} />
              <span className={cn(
                "text-[11px] font-bold truncate max-w-[150px]",
                activeTarget ? "text-white" : "text-zinc-500"
              )}>
                {activeTarget ? activeTarget.name : 'Select System'}
              </span>
            </div>
            <ChevronDown size={12} className={cn("text-zinc-600 transition-transform duration-200", targetSelectorOpen && "rotate-180")} />
          </button>
          
          <div className="flex items-center gap-3">
            {aiState !== 'idle' && (
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-full px-3 py-1 animate-in fade-in zoom-in">
                <button 
                  onClick={async () => {
                    const nextState = aiState === 'paused' ? 'running' : 'paused';
                    setAiState(nextState);
                    try {
                      await chatApi.update(sessionId, { ai_status: nextState } as any);
                    } catch (err) {
                      toast.error("Failed to update AI status");
                    }
                  }}
                  className="hover:text-white text-zinc-400 transition-colors"
                  title={aiState === 'paused' ? "Continue AI" : "Pause AI"}
                >
                  {aiState === 'paused' ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button 
                  onClick={async () => { 
                    setStreaming(false); 
                    setAiState('idle'); 
                    try {
                      await chatApi.update(sessionId, { ai_status: 'stopped' } as any);
                    } catch {}
                  }}
                  className="text-red-500/70 hover:text-red-400 transition-colors"
                  title="Stop AI"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              </div>
            )}
            {aiState === 'running' && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/5 animate-pulse">
                <MousePointer size={10} className="text-blue-400" />
                <span className="text-[9px] font-mono text-zinc-500">{mousePos.x}, {mousePos.y}</span>
              </div>
            )}
            {hitlRequired && (
              <button 
                onClick={() => { setHitlRequired(false); chatApi.sendMessage(sessionId, "User has completed the HITL request."); }}
                className="flex items-center gap-2 px-3 py-1 bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full animate-bounce shadow-[0_0_20px_rgba(249,115,22,0.4)]"
              >
                <HandMetal size={12} />
                HITL Done
              </button>
            )}
            <span className="text-[10px] uppercase font-bold text-zinc-700 tracking-widest">
              {activeTarget ? 'Linked' : 'Chat Only'}
            </span>
          </div>
        </div>

        {/* Target Selector Dropdown */}
        {targetSelectorOpen && (
          <div className="absolute left-2 right-2 md:left-4 md:right-auto md:w-[280px] top-[60px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
            <div className="max-h-[350px] overflow-y-auto">
              {/* Unmap option */}
              <div className="p-2">
                <button
                  onClick={() => handleSwitchTarget('vm', '')}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all",
                    !activeTarget ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    <span>None (Chat Only)</span>
                  </div>
                  {!activeTarget && <Check size={14} className="text-blue-400" />}
                </button>
              </div>

              <div className="h-px bg-white/5 mx-2" />
              
              {/* VMs */}
              <div className="p-2">
                <div className="px-3 py-1 text-[9px] font-black uppercase text-zinc-600 tracking-widest flex items-center gap-2">
                  <Cpu size={10} /> Virtual Machines
                </div>
                {[...vms].sort((a, b) => (b.status === 'running' ? 1 : 0) - (a.status === 'running' ? 1 : 0)).map(vm => (
                  <button
                    key={vm.id}
                    onClick={() => handleSwitchTarget('vm', vm.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all mb-1",
                      activeTarget?.id === vm.id ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full", 
                        vm.status === 'running' 
                          ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" 
                          : "bg-zinc-700"
                      )} />
                      <span className="truncate max-w-[150px] font-medium">{vm.name}</span>
                      {vm.status === 'running' && (
                        <span className="text-[8px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Live</span>
                      )}
                    </div>
                    {activeTarget?.id === vm.id && <Check size={14} className="text-blue-400" />}
                  </button>
                ))}
                {vms.length === 0 && (
                  <div className="px-3 py-2 text-[10px] text-zinc-700 italic">No VMs found</div>
                )}
              </div>

              <div className="h-px bg-white/5 mx-2" />

              {/* Devices */}
              <div className="p-2">
                <div className="px-3 py-1 text-[9px] font-black uppercase text-zinc-600 tracking-widest flex items-center gap-2">
                  <Laptop size={10} /> Paired Devices
                </div>
                {devices.filter(d => d.status === 'paired').map(device => (
                  <button
                    key={device.id}
                    onClick={() => handleSwitchTarget('device', device.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all",
                      activeTarget?.id === device.id ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="truncate max-w-[150px]">{device.name}</span>
                    </div>
                    {activeTarget?.id === device.id && <Check size={14} className="text-blue-400" />}
                  </button>
                ))}
                {devices.filter(d => d.status === 'paired').length === 0 && (
                  <div className="px-3 py-2 text-[10px] text-zinc-700 italic">No paired devices</div>
                )}
              </div>
            </div>
            <div className="p-2 bg-black/40 border-t border-white/5">
              <Link href="/machines" className="block w-full text-center py-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-all uppercase tracking-widest">
                Manage All Resources
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <img src="/logo.png" alt="Control Logo" className="w-10 h-10 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Control</h1>
              <p className="text-zinc-500 text-sm">How can I assist you today?</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        {isStreaming && (
          <div className="flex gap-4 items-start animate-in fade-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-lg shadow-white/10">
              <Sparkles size={14} className="text-black animate-pulse" />
            </div>
            <div className="flex-1 space-y-2 mt-1">
              <div className="h-2 w-24 bg-white/10 rounded-full animate-pulse" />
              <div className="h-2 w-48 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-950 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <form 
          onSubmit={handleSend}
          className="relative flex items-end gap-2 bg-zinc-900 border border-white/10 rounded-2xl p-1.5 focus-within:border-white/20 transition-all shadow-xl"
        >
          <button
            type="button"
            className="mb-1 p-2.5 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Paperclip size={18} />
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tell Control what to do..."
            rows={1}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm p-2.5 resize-none max-h-40 placeholder:text-zinc-700 min-h-[42px] leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="mb-1 p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm shrink-0"
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        <p className="text-[9px] text-zinc-700 mt-3 text-center uppercase tracking-widest font-bold">
          AI can make mistakes. Verify important actions.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: any }) {
  const isUser = msg.role === 'user';
  const isAction = msg.role === 'action';

  if (isAction) {
    return (
      <div className="flex justify-start px-2 opacity-80">
        <div className="flex-1 max-w-[85%] space-y-1">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2 px-1">
            <ActionIcon type={msg.action_type} />
            AI Action: {msg.action_type}
          </div>
          <div className="text-xs text-zinc-400 font-mono bg-white/[0.02] p-3 rounded-xl border border-white/5 break-words whitespace-pre-wrap">
            {msg.content}
            {msg.action_data && (
              <pre className="mt-2 text-[10px] text-zinc-600 bg-black/20 p-2 rounded">
                {JSON.stringify(msg.action_data, null, 2)}
              </pre>
            )}
            {msg.screenshot_url && (
              <div className="mt-3 rounded-lg overflow-hidden border border-white/5">
                <img src={msg.screenshot_url} alt="Action Screenshot" className="w-full h-auto" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] space-y-1", isUser && "text-right flex flex-col items-end")}>
        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">
          {isUser ? 'You' : 'Control AI'}
        </div>
        <div className={cn(
          "text-sm p-4 rounded-2xl transition-all duration-200 break-words whitespace-pre-wrap overflow-y-visible",
          isUser 
            ? "bg-zinc-900 text-white border border-white/5 rounded-tr-none shadow-sm" 
            : "bg-white/5 text-zinc-300 border border-white/[0.02] rounded-tl-none leading-relaxed"
        )}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ type }: { type: string }) {
  switch (type?.toLowerCase()) {
    case 'click': return <MousePointer2 size={14} className="text-blue-400" />;
    case 'terminal': return <Terminal size={14} className="text-green-400" />;
    case 'screenshot': return <Camera size={14} className="text-purple-400" />;
    default: return <Sparkles size={14} className="text-zinc-500" />;
  }
}
