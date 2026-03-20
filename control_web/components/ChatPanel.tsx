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
  Mic, MicOff
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
  
  // File upload state
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // STT State
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
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(prev => (prev.trim() + ' ' + transcript).trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error("Microphone access denied. Please check site permissions.");
          } else if (event.error === 'no-speech') {
            toast.error("No speech detected. Please try again.");
          } else {
            toast.error(`Speech error: ${event.error}`);
          }
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

  // Auto-select running VM if none active
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

  // File upload handler
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

    // Optimistically add the user message
    const displayMsg = fileName ? `${userMsg}\n📎 ${fileName}` : userMsg;
    addMessage({
      id: Math.random().toString(),
      session_id: sessionId,
      role: 'user',
      content: displayMsg,
      created_at: new Date().toISOString()
    } as any);

    try {
      const stream = chatApi.sendMessage(sessionId, userMsg, fileUrl);

      for await (const event of stream) {
        if (event.type === 'message' || event.type === 'thought') {
          addMessage({
            id: Math.random().toString(),
            session_id: sessionId,
            role: 'assistant',
            content: event.content,
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
      const res = await chatApi.messages(sessionId);
      setMessages(res.messages);
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
      {/* Header removed as it is now in ChatSessionPage */}

      {/* Terminal Permission Request */}
      {terminalRequest && (
        <div className="mx-4 mt-3 p-4 bg-secondary border border-amber-500/20 rounded-2xl animate-in fade-in">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground mb-1">Terminal Command Requested</p>
              <code className="text-[11px] text-amber-400 bg-background px-2 py-1 rounded block truncate mr-2">
                {terminalRequest.command}
              </code>
              <p className="text-[10px] text-text-muted mt-2">AI wants to run this command on your device.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleTerminalApprove}
              className="flex-1 py-2 bg-accent-primary text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-opacity-90 transition-all font-bold"
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-10">
        <div className="max-w-3xl mx-auto w-full space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-in fade-in duration-1000 max-w-lg mx-auto">
            <div className="flex flex-col items-center justify-center mb-10">
              <div className="w-16 h-16 flex items-center justify-center mb-8 group hover:scale-105 transition-transform duration-500">
                <Command size={48} strokeWidth={1.5} className="text-text-muted opacity-20" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-2 tracking-tighter">
                {(() => {
                  const hr = new Date().getHours();
                  let g = "Good Evening";
                  if (hr < 12) g = "Good Morning";
                  else if (hr < 18) g = "Good Afternoon";
                  return g;
                })()}, {user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer'}.
              </h1>
              <p className="text-text-muted text-sm font-medium leading-relaxed">
                Control Node initialized. Cross-machine signaling is active. <br/>
                How can I assist your workflow today?
              </p>
            </div>
            {/* Suggestions removed for cleaner UI */}
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
      </div>

      {/* Attached File Preview */}
      {attachedFile && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl">
          {attachedFile.type === 'image' ? (
            <ImageIcon size={14} className="text-blue-400 shrink-0" />
          ) : (
            <FileText size={14} className="text-zinc-400 shrink-0" />
          )}
          <span className="text-[11px] text-zinc-300 truncate font-medium flex-1">{attachedFile.name}</span>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-zinc-600 hover:text-white transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-secondary pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto">

          <form 
            onSubmit={handleSend}
            className="relative flex items-end gap-2 bg-background border border-border rounded-2xl p-1.5 focus-within:border-primary/20 transition-all shadow-xl"
          >
          {/* Hidden file input */}
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
            className="mb-1 p-2.5 text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-50 shrink-0"
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
                : "text-zinc-600 hover:text-zinc-400"
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
            placeholder="Tell Control what to do..."
            rows={1}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm p-2.5 resize-none max-h-40 placeholder:text-zinc-700 min-h-[42px] leading-relaxed"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !attachedFile) || isStreaming}
            className="mb-1 p-2.5 bg-accent-primary text-accent-foreground rounded-xl hover:bg-opacity-90 disabled:opacity-30 transition-all shadow-sm shrink-0"
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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

function MessageBubble({ msg }: { msg: any }) {
  const isUser = msg.role === 'user';
  const isAction = msg.role === 'action';

  if (isAction) {
    return (
      <div className="flex justify-start px-2 opacity-80">
        <div className="flex-1 max-w-[85%] space-y-1">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-2 px-1">
            <ActionIcon type={msg.action_type} />
            {msg.action_type}
          </div>
          <div className="text-xs text-zinc-400 font-mono bg-white/[0.02] p-3 rounded-xl border border-white/5 break-words whitespace-pre-wrap">
            {msg.content}
            {msg.action_data && Object.keys(msg.action_data).length > 0 && (
              <pre className="mt-2 text-[10px] text-zinc-600 bg-black/20 p-2 rounded">
                {JSON.stringify(msg.action_data, null, 2)}
              </pre>
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
          "text-sm p-4 rounded-2xl transition-all duration-200 break-words overflow-visible",
          isUser 
            ? "bg-zinc-900 text-white border border-white/5 rounded-tr-none shadow-sm" 
            : "bg-white/5 text-zinc-300 border border-white/[0.02] rounded-tl-none leading-relaxed"
        )}>
          <div className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "dark:prose-invert")}>
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ type }: { type: string }) {
  switch (type?.toLowerCase()) {
    case 'click':
    case 'double_click':
    case 'right_click': return <MousePointer2 size={14} className="text-blue-400" />;
    case 'terminal': return <Terminal size={14} className="text-green-400" />;
    case 'screenshot': return <Camera size={14} className="text-purple-400" />;
    case 'browser_navigate':
    case 'browser_get_content': return <Bot size={14} className="text-cyan-400" />;
    default: return <Sparkles size={14} className="text-zinc-500" />;
  }
}
