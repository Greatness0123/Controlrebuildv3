import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore, Session, Message } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTaskExecution } from '../../hooks/useTaskExecution';
import { useVoice } from '../../hooks/useVoice';
import { useVosk } from '../../hooks/useVosk';
import { Attachment } from '../../types/chat';
import { Icon } from '../../components/shared/Icon';
import { Button } from '../../components/shared/Button';
import { Tooltip } from '../../components/shared/Tooltip';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { Badge } from '../../components/shared/Badge';
import { ScrollArea } from '../../components/shared/ScrollArea';
import { CodeBlock } from '../../components/shared/CodeBlock';
import { Spinner } from '../../components/shared/Spinner';
import { SlashCommandPopup } from './components/SlashCommandPopup';

const STATIC_SLASH_COMMANDS = [
  { command: '/importskill', description: 'Import a new learned behavior' },
  { command: '/reset', description: 'Reset the current conversation' },
  { command: '/screenshot', description: 'Take a manual screenshot' },
  { command: '/clear', description: 'Clear all messages' },
];

export default function ChatApp() {
  const {
    sessions,
    activeSessionId,
    messages,
    streamingContent,
    isProcessing,
    mode,
    currentActions,
    setMode,
    setActiveSession,
    addSession,
    deleteSession,
  } = useChatStore();

  const { selectedModel } = useSettingsStore();
  const { executeTask, stopTask } = useTaskExecution();
  const { toggleWakeword, isWakewordEnabled } = useVoice();
  const [inputValue, setInputValue] = useState('');
  const [baseText, setBaseText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [learnedBehaviors, setLearnedBehaviors] = useState<any[]>([]);

  const { startRecording, stopRecording, isRecording, isConnecting } = useVosk((text, isPartial) => {
    if (isPartial) {
      setInputValue(baseText + (baseText ? ' ' : '') + text + '...');
    } else {
      const newBase = baseText + (baseText ? ' ' : '') + text;
      setBaseText(newBase);
      setInputValue(newBase);
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeMessages = activeSessionId ? messages[activeSessionId] || [] : [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const data = Array.from(new Uint8Array(buffer));
      const attachment: Attachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        data
      };
      if (file.type.startsWith('image/')) {
        attachment.thumbnail = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: file.type }));
      }
      setAttachments(prev => [...prev, attachment]);
    }
  };

  useEffect(() => {
    window.chatAPI.readBehaviors().then(res => {
      setLearnedBehaviors(res.behaviors || []);
    });
  }, []);

  const filteredCommands = [
    ...STATIC_SLASH_COMMANDS,
    ...learnedBehaviors.map(b => ({ command: `/${b.name.toLowerCase().replace(/\s+/g, '')}`, description: b.description }))
  ].filter(c => c.command.startsWith(inputValue.toLowerCase()));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages, streamingContent, currentActions]);

  const handleFileAttach = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const buffer = await file.arrayBuffer();
        const data = Array.from(new Uint8Array(buffer));
        const attachment: Attachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data
        };
        if (file.type.startsWith('image/')) {
          attachment.thumbnail = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: file.type }));
        }
        setAttachments(prev => [...prev, attachment]);
      }
    };
    input.click();
  };

  const handleSend = () => {
    if ((!inputValue.trim() && attachments.length === 0) || isProcessing) return;

    if (inputValue.startsWith('/')) {
        const fullCmds = [
          ...STATIC_SLASH_COMMANDS,
          ...learnedBehaviors.map(b => ({ command: `/${b.name.toLowerCase().replace(/\s+/g, '')}`, description: b.description, behavior: b }))
        ];
        const cmd = fullCmds.find(s => s.command === inputValue.trim().split(' ')[0]);
        if (cmd) {
            if (cmd.command === '/clear') {
              // Handle clear
            } else if (cmd.command === '/reset') {
              // Handle reset
            } else if ((cmd as any).behavior) {
                const behavior = (cmd as any).behavior;
                executeTask(`Execute skill "${behavior.name}": ${behavior.pattern}`, mode, attachments);
            }
            setInputValue('');
            setShowSlashCommands(false);
            return;
        }
    }

    if (!activeSessionId) {
      const newSession: Session = {
        id: crypto.randomUUID(),
        title: inputValue.slice(0, 40),
        lastModified: new Date().toISOString(),
        mode,
      };
      addSession(newSession);
    }

    executeTask(inputValue, mode, attachments);
    setInputValue('');
    setAttachments([]);
  };

  return (
    <div
      className="flex flex-col h-screen bg-bg-base text-text-primary overflow-hidden border-l border-border-strong shadow-2xl"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="flex items-center justify-between px-4 h-14 bg-bg-elevated border-b border-border-subtle shrink-0 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Tooltip content="History">
            <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors">
              <Icon name="History" size="md" />
            </button>
          </Tooltip>
          <Tooltip content="Workflows">
            <button onClick={() => setIsWorkflowsOpen(true)} className="p-2 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors">
              <Icon name="GitBranch" size="md" />
            </button>
          </Tooltip>
        </div>

        <div
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/20 border border-border-subtle hover:border-border-strong cursor-pointer transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as any}
          onClick={() => setIsSettingsOpen(true)}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            {selectedModel || 'Gemini 2.5 Flash'}
          </span>
          <Icon name="ChevronDown" size={12} className="text-text-muted" />
        </div>

        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Tooltip content="Settings">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors">
              <Icon name="Settings" size="md" />
            </button>
          </Tooltip>
          <Tooltip content={isWakewordEnabled ? "Mute Wakeword" : "Enable Wakeword"}>
            <button onClick={() => toggleWakeword(!isWakewordEnabled)} className={`p-2 rounded-md transition-colors ${isWakewordEnabled ? 'text-text-primary' : 'text-text-disabled hover:bg-white/5'}`}>
              <Icon name={isWakewordEnabled ? 'Zap' : 'ZapOff'} size="md" />
            </button>
          </Tooltip>
          <button onClick={() => window.chatAPI.showWindow('lite')} className="p-2 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-colors">
            <Icon name="Minus" size="md" />
          </button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 space-y-6" ref={scrollRef}>
        {activeMessages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] ${msg.role === 'user' ? 'bg-bg-elevated p-4 rounded-2xl rounded-tr-none border border-border-subtle' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? <CodeBlock code={String(children).replace(/\n$/, '')} language={match ? match[1] : 'text'} /> : <code className="bg-black/30 px-1 rounded text-sm" {...props}>{children}</code>;
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* ACT Mode Action Timeline */}
        {mode === 'act' && currentActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-surface border-l-2 border-border-strong rounded-r-2xl p-4 space-y-4"
          >
             <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Live Timeline</div>
             <div className="space-y-3">
               {currentActions.map((action, i) => (
                 <div key={i} className="flex items-center gap-3 group">
                   <div className="shrink-0 text-text-secondary">
                      <Icon name={action.status === 'completed' ? 'CheckCircle2' : action.status === 'failed' ? 'XCircle' : 'Loader2'} size={14} className={action.status === 'completed' ? 'text-color-success' : action.status === 'failed' ? 'text-color-error' : 'animate-spin'} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-text-muted uppercase">{action.tool}</div>
                      <div className="text-xs truncate">{action.description}</div>
                   </div>
                   {action.screenshot && (
                     <img src={action.screenshot} className="w-8 h-6 rounded bg-black object-cover border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity cursor-zoom-in" />
                   )}
                 </div>
               ))}
             </div>
          </motion.div>
        )}

        {streamingContent && (
          <div className="flex flex-col items-start max-w-[90%]">
             <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <p className="mb-4 last:mb-0 text-sm leading-relaxed inline">{children}</p> }}>
                {streamingContent}
              </ReactMarkdown>
              <span className="inline-block w-1.5 h-4 ml-1 bg-white animate-pulse" />
          </div>
        )}
      </ScrollArea>

      <footer className="p-4 space-y-4 bg-bg-base/80 backdrop-blur-md border-t border-border-subtle relative">
        <AnimatePresence>
            {showSlashCommands && (
                <SlashCommandPopup
                    commands={filteredCommands}
                    selectedIndex={selectedIndex}
                    onSelect={(cmd) => {
                        setInputValue(cmd + ' ');
                        setShowSlashCommands(false);
                        inputRef.current?.focus();
                    }}
                />
            )}
        </AnimatePresence>

        <div className="flex p-1 bg-bg-surface rounded-xl border border-border-subtle">
          {(['ask', 'act', 'click'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="relative flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors z-10">
              {mode === m && <motion.div layoutId="mode-pill" className="absolute inset-0 bg-white rounded-lg z-[-1]" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />}
              <Icon name={m === 'ask' ? 'MessageSquare' : m === 'act' ? 'Zap' : 'MousePointer'} size={14} className={mode === m ? 'text-black' : 'text-text-muted'} />
              <span className={mode === m ? 'text-black' : 'text-text-muted'}>{m}</span>
            </button>
          ))}
        </div>

        {attachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group shrink-0">
                {att.thumbnail ? (
                  <img src={att.thumbnail} className="w-12 h-12 rounded-lg object-cover border border-border-subtle" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center border border-border-subtle">
                    <Icon name="File" size="sm" className="text-text-muted" />
                  </div>
                )}
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="X" size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-2 bg-bg-surface border border-border-default focus-within:border-border-strong rounded-2xl transition-colors">
          <button onClick={handleFileAttach} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Icon name="Paperclip" size="md" />
          </button>
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => {
                setInputValue(e.target.value);
                setBaseText(e.target.value);
                setShowSlashCommands(e.target.value === '/');
            }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={mode === 'ask' ? "Ask anything..." : "Describe a task..."}
            className="flex-1 bg-transparent border-none outline-none resize-none py-2 text-sm max-h-40"
          />
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition-colors ${isRecording ? 'text-color-error' : 'text-text-muted hover:text-white'}`}
          >
            <Icon name={isRecording ? 'Mic' : 'MicOff'} size="md" className={isConnecting ? 'animate-pulse' : ''} />
          </button>
          <button onClick={isProcessing ? stopTask : handleSend} className={`p-2 rounded-xl transition-all ${isProcessing ? 'bg-red-500 text-white' : 'bg-white text-black hover:scale-105 active:scale-95'}`}>
            <Icon name={isProcessing ? 'Square' : 'ArrowUp'} size="md" />
          </button>
        </div>
      </footer>
    </div>
  );
}
