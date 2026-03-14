"use client";

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import { Send, User, Bot, Terminal, MousePointer2, Camera, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const { messages, setMessages, addMessage, isStreaming, setStreaming } = useChatStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border-r border-white/5">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-zinc-400">Control AI Agent</h3>
            <p className="text-[11px] text-zinc-600 mt-1 max-w-[200px]">Send a message to start automating tasks on this machine.</p>
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
