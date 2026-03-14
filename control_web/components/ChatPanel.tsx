"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useChatStore, useVMStore, useDeviceStore } from '@/lib/store';
import { chatApi, vmApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Send, User, Bot, Terminal, MousePointer2, Camera, Loader2, 
  Sparkles, AlertCircle, Cpu, Laptop, ChevronDown, Check, Target 
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get current session data from store
  const session = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);

  const handleSwitchTarget = async (type: 'vm' | 'device', id: string) => {
    try {
      const res = await chatApi.update(sessionId, {
        vm_id: type === 'vm' ? id : null,
        device_id: type === 'device' ? id : null
      });
      // Update session in store
      setSessions(sessions.map(s => s.id === sessionId ? res.session : s));
      toast.success(`Now controlling ${type === 'vm' ? 'VM' : 'Device'}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to switch target");
    } finally {
      setTargetSelectorOpen(false);
    }
  };

  // Determine active target (VM or Device)
  const activeTarget = useMemo(() => {
    if (session?.vm_id) return { type: 'vm', id: session.vm_id, name: vms.find(v => v.id === session.vm_id)?.name || 'Unknown VM' };
    if (session?.device_id) return { type: 'device', id: session.device_id, name: devices.find(d => d.id === session.device_id)?.name || 'Unknown Device' };
    return null;
  }, [session, vms, devices]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await chatApi.messages(sessionId);
        if (res.messages.length === 0) {
          // If no messages, add a greeting
          const greeting = {
            id: 'greeting',
            session_id: sessionId,
            role: 'assistant',
            content: "Hello! I'm your Control AI assistant. I can help you manage your virtual machines and local systems. What would you like to do today?",
            created_at: new Date().toISOString()
          };
          setMessages([greeting as any]);
        } else {
          setMessages(res.messages);
        }
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
        } else if (event.type === 'error') {
          setError(event.content);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setStreaming(false);
      // Refresh messages to get persistent IDs from DB
      const res = await chatApi.messages(sessionId);
      setMessages(res.messages);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border-r border-white/5 relative">
      {/* Target Selector Header */}
      <div className="bg-zinc-900/50 border-b border-white/5 px-4 py-3 z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setTargetSelectorOpen(!targetSelectorOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border rounded-xl transition-all group relative",
              activeTarget 
                ? "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 shadow-lg shadow-blue-500/10" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                activeTarget ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-zinc-500"
              )}>
                <Target size={14} />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Active Target</span>
                <span className={cn(
                  "text-[11px] font-bold truncate max-w-[120px]",
                  activeTarget ? "text-white" : "text-zinc-500 italic"
                )}>
                  {activeTarget ? activeTarget.name : 'Unassigned'}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={cn("text-zinc-600 ml-1 transition-transform duration-200", targetSelectorOpen && "rotate-180")} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              activeTarget ? "bg-green-500 shadow-sm shadow-green-500/50" : "bg-zinc-700"
            )} />
            <span className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">
              {activeTarget ? 'Connected' : 'No Target Selected'}
            </span>
          </div>
        </div>

        {/* Target Selector Dropdown */}
        {targetSelectorOpen && (
          <div className="absolute left-4 top-[60px] w-[280px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
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
                {vms.map(vm => (
                  <button
                    key={vm.id}
                    onClick={() => handleSwitchTarget('vm', vm.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all",
                      activeTarget?.id === vm.id ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", vm.status === 'running' ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-zinc-700")} />
                      <span className="truncate max-w-[150px]">{vm.name}</span>
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform -rotate-6">
                <Sparkles size={40} className="text-white" />
              </div>
            </div>
            
            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-black text-white tracking-tight">Welcome to Control</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                I'm your next-generation AI assistant. Target a system above and tell me what tasks you'd like to automate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-md">
              {[
                { label: 'Check Status', icon: Cpu },
                { label: 'Run Scripts', icon: Terminal },
                { label: 'UI Automation', icon: MousePointer2 },
                { label: 'Monitoring', icon: Camera },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3 text-left hover:bg-white/[0.05] transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 transition-colors">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400">{item.label}</span>
                </div>
              ))}
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
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px]">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-950">
        <form 
          onSubmit={handleSend}
          className="relative flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2 focus-within:border-white/20 transition-all shadow-inner"
        >
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
            className="flex-1 bg-transparent border-none focus:outline-none text-sm p-3 resize-none max-h-40 placeholder:text-zinc-700"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="mb-1 p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
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
      <div className="flex items-start gap-4 px-2 opacity-80">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
          <ActionIcon type={msg.action_type} />
        </div>
        <div className="flex-1 min-w-0 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2">
            AI Action: {msg.action_type}
          </div>
          <div className="text-xs text-zinc-400 font-mono bg-white/[0.02] p-2 rounded-lg border border-white/5">
            {msg.content}
            {msg.action_data && (
              <pre className="mt-1 text-[10px] text-zinc-600">
                {JSON.stringify(msg.action_data, null, 2)}
              </pre>
            )}
          </div>
          {msg.screenshot_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <img src={msg.screenshot_url} alt="Action Screenshot" className="w-full h-auto" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-4", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg",
        isUser ? "bg-zinc-800 border border-white/10" : "bg-white shadow-white/10"
      )}>
        {isUser ? <User size={14} className="text-zinc-400" /> : <Sparkles size={14} className="text-black" />}
      </div>
      <div className={cn("flex-1 max-w-[85%] space-y-1", isUser && "text-right")}>
        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">
          {isUser ? 'You' : 'Control AI'}
        </div>
        <div className={cn(
          "text-sm p-4 rounded-2xl inline-block transition-all duration-200 break-words overflow-hidden",
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
