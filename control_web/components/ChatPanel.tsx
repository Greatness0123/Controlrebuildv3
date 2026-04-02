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
  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; }, [input]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptBeforeListening = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const base = transcriptBeforeListening.current.trim();
          const separator = base ? ' ' : '';

          let sessionFinal = '';
          let sessionInterim = '';

          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              sessionFinal += event.results[i][0].transcript;
            } else {
              sessionInterim += event.results[i][0].transcript;
            }
          }

          const currentFullText = (base + separator + sessionFinal + sessionInterim).trim();
          setInput(currentFullText);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
            setIsListening(false);
          }
          const errorMsg = event.error === 'network' ? 'Network error: Speech service is unavailable.' : `Speech error: ${event.error}`;
          if (event.error !== 'no-speech') toast.error(errorMsg);
        };

        recognition.onend = () => {
          if (isListening) {
            try {
              transcriptBeforeListening.current = inputRef.current;
              recognition.start();
            } catch (e) {
              console.error("Mic restart error", e);
              setIsListening(false);
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error("Speech recognition not supported in this browser.");
        return;
      }
      try {
        transcriptBeforeListening.current = input || '';
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

      let currentAssistantMessageId: string | null = null;
      let currentThoughtMessageId: string | null = null;

      for await (const event of stream) {
        if (event.type === 'message' || event.type === 'thought') {
          const isThought = event.type === 'thought';
          let msgId: string;

          if (isThought) {
            msgId = currentThoughtMessageId || Math.random().toString();
            currentThoughtMessageId = msgId;
          } else {
            msgId = currentAssistantMessageId || Math.random().toString();
            currentAssistantMessageId = msgId;
          }

          const existingMessages = useChatStore.getState().messages;
          if (existingMessages.find(m => m.id === msgId)) {
            setMessages(existingMessages.map(m => m.id === msgId ? { ...m, content: event.content, is_final: event.type === 'message' } : m));
          } else {
            addMessage({
              id: msgId,
              session_id: sessionId,
              role: 'assistant',
              content: event.content,
              is_thought: isThought,
              is_final: event.type === 'message',
              created_at: new Date().toISOString()
            } as any);
          }
        } else if (event.type === 'action') {
          // Update last assistant message if it's currently streaming thought/message
          // Or just add the action message
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'action',
            content: `Executing ${event.action}...`,
            action_type: event.action,
            action_data: event.params,
            created_at: new Date().toISOString()
          } as any);

          if (event.action === 'HITL') {
            setHitlRequired(true);
            addMessage({
              id: Math.random().toString(),
              session_id: sessionId,
              role: 'assistant',
              content: `🔐 Human assistance needed: ${event.params?.reason || 'Please perform the requested action on the screen.'}`,
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


      {/* ── Target Selector ────────────────────────────────────── */}
      <TargetSelector
        sessionId={sessionId}
        activeTarget={activeTarget}
        vms={vms}
        devices={devices}
        sessions={sessions}
        setSessions={setSessions}
      />

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
  const isAction = msg.role === 'action' || (msg.role === 'assistant' && msg.action_type);

  if (isAction) {
    const actionIcon = getActionIcon(msg.action_type);
    return (
      <div className="flex items-start gap-3 px-1 my-2">
        <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center shrink-0 shadow-sm">
          {actionIcon}
        </div>
        <div className="flex-1 min-w-0 bg-secondary/50 border border-border rounded-2xl px-4 py-3 hover:bg-secondary transition-colors">
          <div className="text-xs text-text-secondary font-medium items-center flex gap-2 justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-foreground text-[10px] uppercase tracking-[0.15em]">{formatActionType(msg.action_type)}</span>
              <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest px-1.5 py-0.5 bg-border/30 rounded">Executed</span>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse" />
          </div>
          <div className="text-text-secondary text-[11px] font-medium font-mono truncate bg-background/50 px-2 py-1 rounded border border-border/50">
            {msg.content || (msg.action_data ? JSON.stringify(msg.action_data) : 'Performing action...')}
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-2">
        <div className="max-w-[85%] text-[13px] p-4 rounded-3xl rounded-tr-lg bg-accent-primary/5 text-foreground break-words border border-accent-primary/10 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  if (msg.is_thought) {
    return (
      <div className="flex flex-col items-start px-1 my-3 group">
        <div className="flex items-center gap-2 mb-1.5 ml-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <Sparkles size={12} className="text-accent-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">AI Reasoning</span>
        </div>
        <div className="max-w-[90%] text-[11px] px-4 py-3 rounded-2xl bg-secondary/30 border border-border/50 italic text-text-secondary leading-relaxed backdrop-blur-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex flex-col items-start my-2">
      <div className="max-w-[95%] text-[14px] px-2 py-1 break-words leading-relaxed text-foreground">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-pre:rounded-2xl">
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

/* ─── Target Selector ─── */
interface TargetSelectorProps {
  sessionId: string;
  activeTarget: { type: string; id: string; name: string } | null;
  vms: any[];
  devices: any[];
  sessions: any[];
  setSessions: (sessions: any[]) => void;
}

function TargetSelector({ sessionId, activeTarget, vms, devices, sessions, setSessions }: TargetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectTarget = async (type: 'vm' | 'device' | null, id: string | null) => {
    setOpen(false);
    setSaving(true);
    try {
      const update = type === 'vm'
        ? { vm_id: id, device_id: null }
        : type === 'device'
          ? { vm_id: null, device_id: id }
          : { vm_id: null, device_id: null };

      await chatApi.update(sessionId, update);

      // Optimistic local update
      setSessions(sessions.map(s =>
        s.id === sessionId ? { ...s, ...update } : s
      ));
      toast.success(id ? `Target set` : 'Target cleared');
    } catch {
      toast.error('Failed to update target');
    } finally {
      setSaving(false);
    }
  };

  const runningVMs = vms.filter(v => v.status === 'running');
  const onlineDevices = devices.filter(d => d.status === 'paired' || d.status === 'online');

  return (
    <div className="px-4 pb-2 border-b border-border bg-secondary" ref={ref}>
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted shrink-0">Target</span>

        {/* Current target pill / trigger */}
        <button
          onClick={() => setOpen(o => !o)}
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all",
            activeTarget
              ? activeTarget.type === 'vm'
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-card border-border text-text-muted hover:border-text-muted"
          )}
        >
          {saving ? (
            <Loader2 size={10} className="animate-spin" />
          ) : activeTarget ? (
            activeTarget.type === 'vm' ? <Cpu size={10} /> : <Laptop size={10} />
          ) : (
            <ChevronDown size={10} />
          )}
          <span className="max-w-[140px] truncate">
            {activeTarget ? activeTarget.name : 'No target'}
          </span>
          <ChevronDown size={10} className={cn("transition-transform shrink-0", open && "rotate-180")} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute bottom-[calc(100%+4px)] left-4 right-4 max-w-xs bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="p-1">
              {/* VMs */}
              {runningVMs.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted px-3 pt-2 pb-1">Virtual Machines</p>
                  {runningVMs.map(vm => (
                    <button
                      key={vm.id}
                      onClick={() => selectTarget('vm', vm.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-left transition-colors",
                        activeTarget?.id === vm.id
                          ? "bg-blue-500/10 text-blue-400"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Cpu size={12} className="text-blue-400 shrink-0" />
                      <span className="flex-1 truncate font-medium">{vm.name}</span>
                      {activeTarget?.id === vm.id && <Check size={12} className="text-blue-400 shrink-0" />}
                    </button>
                  ))}
                </>
              )}

              {/* Devices */}
              {onlineDevices.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted px-3 pt-2 pb-1">Paired Devices</p>
                  {onlineDevices.map(device => (
                    <button
                      key={device.id}
                      onClick={() => selectTarget('device', device.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-left transition-colors",
                        activeTarget?.id === device.id
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Laptop size={12} className="text-emerald-400 shrink-0" />
                      <span className="flex-1 truncate font-medium">{device.name}</span>
                      {activeTarget?.id === device.id && <Check size={12} className="text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </>
              )}

              {runningVMs.length === 0 && onlineDevices.length === 0 && (
                <p className="text-[11px] text-text-muted px-3 py-3">No running VMs or online devices</p>
              )}

              {/* Clear */}
              {activeTarget && (
                <>
                  <div className="h-px bg-border mx-2 my-1" />
                  <button
                    onClick={() => selectTarget(null, null)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-text-muted hover:bg-secondary transition-colors text-left"
                  >
                    <X size={12} className="shrink-0" />
                    Clear target
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

