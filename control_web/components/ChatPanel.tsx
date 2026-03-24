"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useChatStore, useVMStore, useDeviceStore, useAuthStore } from '@/lib/store';
import { chatApi, vmApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Send, User, Bot, Terminal, MousePointer2, Camera, Loader2,
  Sparkles, AlertCircle, Cpu, Laptop, ChevronDown, Check, Paperclip,
  HandMetal, Square, PlayCircle, PauseCircle, MousePointer,
  X, FileText, Image as ImageIcon, ShieldAlert, Command, ChevronRight, ChevronLeft,
  Mic, MicOff, Cog, Search, Type, ArrowDown, Globe
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatPanelProps {
  sessionId: string;
}

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const { user } = useAuthStore();
  const {
    messages, setMessages, addMessage, isStreaming, setStreaming, sessions, setSessions,
    aiState, setAiState, mousePos, setMousePos
  } = useChatStore();
  const { vms } = useVMStore();
  const { devices } = useDeviceStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [hitlRequired, setHitlRequired] = useState(false);
  const [terminalRequest, setTerminalRequest] = useState<{ command: string } | null>(null);

  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInput(prev => {
               return (prev.trim() + ' ' + finalTranscript).trim();
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          const errorMsg = event.error === 'network' ? 'Network error: Speech service is unavailable.' : `Speech error: ${event.error}`;
          toast.error(errorMsg);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error("Speech recognition not supported in this browser.");
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Recognition start error:", err);
      }
    }
  };

  const session = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);

  const activeTarget = useMemo(() => {
    if (session?.vm_id) return { type: 'vm', id: session.vm_id, name: vms.find(v => v.id === session.vm_id)?.name || 'Unknown VM' };
    if (session?.device_id) return { type: 'device', id: session.device_id, name: devices.find(d => d.id === session.device_id)?.name || 'Unknown Device' };
    return null;
  }, [session, vms, devices]);

  useEffect(() => {
    if (!activeTarget && vms.length > 0 && session) {
      const runningVM = vms.find(v => v.status === 'running');
      if (runningVM) {
        chatApi.update(sessionId, { vm_id: runningVM.id, device_id: null });
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, vm_id: runningVM.id, device_id: undefined } : s));
      }
    }
  }, [vms, activeTarget, session, sessionId, setSessions, sessions]);

  useEffect(() => {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await chatApi.uploadFile(sessionId, file);
      setAttachedFile({
        url: result.file_url,
        name: result.filename,
        type: result.file_type,
      });
      toast.success(`File attached: ${result.filename}`);
    } catch (err: any) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStop = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!sessionId) return;
    try {
      await chatApi.update(sessionId, { ai_status: 'stopped' });
      setStreaming(false);
      isSendingRef.current = false;
      toast.info('Stopping AI agent...');
    } catch (err) {
      console.error('Failed to stop AI:', err);
      toast.error('Could not stop AI.');
    }
  };

  const isSendingRef = useRef(false);

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    e?.preventDefault();
    const userMsg = customMsg || input;
    if (!userMsg.trim() && !attachedFile) return;
    if (isStreaming || isSendingRef.current) return;

    isSendingRef.current = true;
    if (!customMsg) setInput('');
    setError('');
    setStreaming(true);
    setAiState('running');

    const fileUrl = attachedFile?.url;
    const fileName = attachedFile?.name;
    setAttachedFile(null);

    const displayMsg = fileName ? `${userMsg}\n📎 ${fileName}` : userMsg;
    addMessage({
      id: Math.random().toString(),
      session_id: sessionId,
      role: 'user',
      content: displayMsg,
      created_at: new Date().toISOString()
    } as any);

    try {
      const stream = chatApi.sendMessage(sessionId, userMsg, fileUrl, 'act');

      for await (const event of stream) {
        if (event.type === 'message' || event.type === 'thought') {
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: event.content,
            is_thought: event.type === 'thought',
            is_final: event.type === 'message',
            created_at: new Date().toISOString()
          } as any);
        } else if (event.type === 'action') {
          if (event.action === 'HITL') {
            setHitlRequired(true);
            addMessage({
              id: Math.random().toString(),
              session_id: sessionId,
              role: 'assistant',
              content: `🔐 Human assistance needed: ${event.params?.reason || 'Please perform the requested action on the screen.'}`,
              created_at: new Date().toISOString()
            } as any);
          } else {
            addMessage({
              id: Math.random().toString(),
              session_id: sessionId,
              role: 'action',
              content: `Executing ${event.action}...`,
              action_type: event.action,
              action_data: event.params,
              created_at: new Date().toISOString()
            } as any);
          }
        } else if (event.type === 'hitl') {
          setHitlRequired(true);
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: `🔐 Your input is needed: ${event.content}`,
            created_at: new Date().toISOString()
          } as any);
        } else if (event.type === 'terminal_permission') {
          setTerminalRequest({ command: event.command });
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: `🖥️ The AI wants to run a terminal command on your device. Please approve or deny.`,
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
      isSendingRef.current = false;
    }
  };

  const handleTerminalApprove = async () => {
    if (!terminalRequest) return;
    const command = terminalRequest.command;
    setTerminalRequest(null);
    await handleSend(undefined, `Terminal command approved. Run: ${command}`);
  };

  useEffect(() => {
    if (aiState === 'running') {
      const handleMouseMove = (e: MouseEvent) => {
        const x = Math.round((e.clientX / window.innerWidth) * 1000);
        const y = Math.round((e.clientY / window.innerHeight) * 1000);
        setMousePos({ x, y });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [aiState]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background border-r border-border relative">

      {terminalRequest && (
        <div className="mx-4 mt-3 p-4 bg-card border border-amber-500/20 rounded-2xl animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground mb-1">Terminal Command Requested</p>
              <code className="text-[11px] text-amber-500 bg-secondary px-2 py-1 rounded block truncate mr-2">
                {terminalRequest.command}
              </code>
              <p className="text-[10px] text-text-muted mt-2">AI wants to run this command on your device.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleTerminalApprove}
              className="flex-1 py-2 bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
            >
              Allow
            </button>
            <button
              onClick={() => { setTerminalRequest(null); handleSend(undefined, "Terminal command was denied by the user. Find an alternative approach."); }}
              className="flex-1 py-2 bg-card border border-border text-text-muted text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-card-hover transition-all"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 p-4 scroll-smooth flex flex-col",
          messages.length === 0 ? "overflow-hidden" : "overflow-y-auto"
        )}
      >
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-1000 max-w-lg mx-auto py-32 pt-32">
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="w-16 h-16 bg-card border border-border flex items-center justify-center rounded-2xl mb-8 shadow-2xl group hover:scale-110 transition-all duration-500">
                  <Command size={32} strokeWidth={1.5} className="text-foreground" />
                </div>
                <h1 className="text-4xl font-black text-foreground mb-2 tracking-tighter font-walter leading-tight">
                  {(() => {
                    const hr = new Date().getHours();
                    if (hr < 12) return "Good Morning";
                    if (hr < 18) return "Good Afternoon";
                    return "Good Evening";
                  })()}, <br />{user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer'}.
                </h1>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
          {isStreaming && (
            <div className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 px-1">
              <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-ping" />
              </div>
              <div className="flex-1 space-y-2 mt-1.5">
                <div className="h-1.5 w-24 bg-border/50 rounded-full animate-pulse" />
                <div className="h-1.5 w-48 bg-border/30 rounded-full animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {attachedFile && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl">
          {attachedFile.type === 'image' ? (
            <ImageIcon size={14} className="text-blue-500 shrink-0" />
          ) : (
            <FileText size={14} className="text-text-muted shrink-0" />
          )}
          <span className="text-[11px] text-text-secondary truncate font-medium flex-1">{attachedFile.name}</span>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-text-muted hover:text-foreground transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="p-4 border-t border-border bg-secondary pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">

          <form
            onSubmit={handleSend}
            className="relative flex items-end gap-2 bg-background border border-border rounded-2xl p-1.5 focus-within:border-border transition-all shadow-xl"
          >

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.txt,.md,.csv,.json,.pdf,.py,.js,.ts,.tsx,.jsx,.html,.css"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-1 p-2.5 text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50 shrink-0"
              title="Attach file"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
            </button>

            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                "mb-1 p-2.5 transition-all duration-300 rounded-lg shrink-0",
                isListening
                  ? "bg-red-500/10 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  : "text-text-muted hover:text-text-secondary"
              )}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
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
              placeholder="Tell Control what to do or ask a question..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none text-sm p-2.5 resize-none max-h-40 placeholder:text-text-muted min-h-[42px] leading-relaxed text-foreground"
            />

            <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? handleStop : undefined}
              disabled={(!input.trim() && !attachedFile) && !isStreaming}
              className={cn(
                "mb-1 p-2.5 rounded-xl transition-all shadow-sm shrink-0",
                isStreaming
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  : "bg-accent-primary text-accent-foreground hover:opacity-90 disabled:opacity-30"
              )}
              title={isStreaming ? "Stop AI" : "Send message"}
            >
              {isStreaming ? (
                <div className="relative flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin opacity-20 absolute" />
                  <Square size={14} className="fill-current relative z-10" />
                </div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
        <p className="text-[9px] text-text-muted mt-3 text-center uppercase tracking-widest font-bold">
          AI can make mistakes. Verify important actions.
        </p>
      </div>
    </div>
  );
}

/* ─── Message Bubble ─── */
function MessageBubble({ msg }: { msg: any }) {
  const isUser = msg.role === 'user';
  const isAction = msg.role === 'action';

  if (isAction) {
    const actionIcon = getActionIcon(msg.action_type);
    return (
      <div className="flex items-start gap-3 px-1">
        <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
          {actionIcon}
        </div>
        <div className="flex-1 min-w-0 bg-card border border-border rounded-xl px-3 py-2">
          <div className="text-xs text-text-secondary font-medium items-center flex gap-2 justify-between">
            <span className="font-bold text-foreground text-[11px] uppercase tracking-wider">{formatActionType(msg.action_type)}</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="text-text-muted text-[11px] mt-1 line-clamp-1">{msg.content}</div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] text-sm p-4 rounded-2xl rounded-tr-sm bg-accent-primary/10 text-foreground break-words border border-accent-primary/20">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  if (msg.is_thought) {
    return (
      <div className="flex flex-col items-start px-1 opacity-60">
        <div className="max-w-[90%] text-[11px] px-3 py-2 rounded-xl bg-secondary border border-border italic text-text-secondary leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[95%] text-sm px-1 py-1 break-words leading-relaxed text-foreground">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function formatActionType(type: string): string {
  if (!type) return 'Action';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getActionIcon(type: string) {
  const size = 10;
  switch (type?.toLowerCase()) {
    case 'click':
    case 'double_click':
    case 'right_click': return <MousePointer2 size={size} className="text-blue-500" />;
    case 'type':
    case 'keyboard': return <Type size={size} className="text-emerald-500" />;
    case 'terminal': return <Terminal size={size} className="text-green-500" />;
    case 'screenshot': return <Camera size={size} className="text-purple-500" />;
    case 'scroll': return <ArrowDown size={size} className="text-orange-500" />;
    case 'search':
    case 'find': return <Search size={size} className="text-cyan-500" />;
    case 'browser_navigate':
    case 'browser_get_content': return <Globe size={size} className="text-cyan-500" />;
    default: return <Cog size={size} className="text-text-muted" />;
  }
}
