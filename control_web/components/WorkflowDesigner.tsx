"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Play, Save, Download, Upload, Trash2, X, Bot, Send,
  Paperclip, Loader2, MessageSquare, ChevronRight, ChevronLeft,
  Settings, StopCircle, Zap, Clock, MousePointer2, FileText,
  Globe, Search, Brain, Maximize2, Minimize2, GripVertical,
  MoreVertical, Edit3, Trash, Check, AlertCircle, File, Sparkles,
  Monitor
} from 'lucide-react';
import { useAuthStore, useVMStore, useDeviceStore } from '@/lib/store';
import { workflowApi, chatApi } from '@/lib/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    value: string;
    description?: string;
    days?: string[];
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id?: string;
  name: string;
  enabled: boolean;
  trigger: any;
  nodes: Node[];
  edges: Edge[];
  steps: any[];
}

interface WorkflowDesignerProps {
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  onClose?: () => void;
}

export default function WorkflowDesigner({ initialWorkflow, onSave, onClose }: WorkflowDesignerProps) {
  const { user } = useAuthStore();
  const { vms } = useVMStore();
  const { devices } = useDeviceStore();

  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow || {
    name: 'Untitled Workflow',
    enabled: true,
    trigger: { type: 'none' },
    nodes: [],
    edges: [],
    steps: []
  });

  const [activeView, setActiveView] = useState<'node' | 'list'>('node');
  const [targetMachine, setTargetMachine] = useState<{ id: string; type: 'vm' | 'device' } | null>(null);
  const [scale, setScale] = useState(1);
  const [isAiOverlayOpen, setIsAiOverlayOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [aiSessionId, setAiSessionId] = useState<string>(`wf_gen_${Date.now()}`);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<{ id: string; type: 'out' | 'in' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [aiButtonPos, setAiButtonPos] = useState({ y: 100 });
  const [isAiButtonDragging, setIsAiButtonDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const aiOverlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Visual Editor Logic ---

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setMousePos({ x, y });

    if (draggingNode) {
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === draggingNode ? {
          ...n,
          position: { x: x - dragOffset.x, y: y - dragOffset.y }
        } : n)
      }));
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest('.node-port')) return;

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingNode(nodeId);
    setDragOffset({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    });
  };

  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, type: 'out' | 'in') => {
    e.stopPropagation();
    setConnectingFrom({ id: nodeId, type });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (connectingFrom) {
      const targetPort = (e.target as HTMLElement).closest('.node-port');
      if (targetPort) {
        const targetNodeId = targetPort.getAttribute('data-node-id');
        const targetType = targetPort.getAttribute('data-port-type') as 'out' | 'in';

        if (targetNodeId && targetNodeId !== connectingFrom.id && targetType !== connectingFrom.type) {
          const sourceId = connectingFrom.type === 'out' ? connectingFrom.id : targetNodeId;
          const targetId = connectingFrom.type === 'in' ? connectingFrom.id : targetNodeId;

          if (!workflow.edges.find(edge => edge.source === sourceId && edge.target === targetId)) {
            setWorkflow(prev => ({
              ...prev,
              edges: [...prev.edges, { id: `e_${Date.now()}`, source: sourceId, target: targetId }]
            }));
          }
        }
      }
    }
    setDraggingNode(null);
    setConnectingFrom(null);
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
      data: { value: '', description: '' }
    };
    setWorkflow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
  };

  const deleteNode = (id: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.source !== id && e.target !== id)
    }));
  };

  const updateNodeData = (id: string, data: any) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
    }));
  };

  const handleSave = async () => {
    try {
      if (workflow.id) {
        await workflowApi.update(workflow.id, workflow);
      } else {
        const res = await workflowApi.create(workflow);
        setWorkflow(res.workflow);
      }
      toast.success('Workflow saved successfully!');
      if (onSave) onSave(workflow);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workflow');
    }
  };

  const handleRun = async () => {
    if (!workflow.id) {
      toast.error('Please save the workflow before running it.');
      return;
    }
    if (!targetMachine) {
      toast.error('Please select a target machine to run the workflow on.');
      return;
    }
    try {
      await workflowApi.execute(workflow.id, {
        target_id: targetMachine.id,
        target_type: targetMachine.type
      });
      toast.success('Workflow execution started.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to execute workflow');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflow));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${workflow.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Workflow exported as JSON');
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const imported = JSON.parse(event.target.result);
          setWorkflow({
            ...imported,
            id: undefined // Don't import the ID to avoid conflicts
          });
          toast.success('Workflow imported successfully');
        } catch (err) {
          toast.error('Failed to parse imported JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // --- AI Logic ---

  const handleAiSend = async () => {
    if (!aiInput.trim() || isAiStreaming) return;

    const userMsg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiStreaming(true);

    try {
      // For workflow generation, we use a specialized prompt or endpoint
      // Here we'll simulate a chat with the AI that's focused on workflows
      const fileUrl = attachedFile?.url;
      setAttachedFile(null);
      const stream = chatApi.sendMessage(aiSessionId, `CONTEXT: We are designing a workflow. CURRENT WORKFLOW: ${JSON.stringify(workflow)}. USER REQUEST: ${userMsg}.`, fileUrl, 'workflow');

      let assistantMsg = '';
      setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const event of stream) {
        if (event.type === 'message') {
          assistantMsg += event.content;
          setAiMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = assistantMsg;
            return newMsgs;
          });
        }
      }

      // Check if the assistant returned a JSON workflow
      const jsonMatch = assistantMsg.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsedWorkflow = JSON.parse(jsonMatch[1]);
          if (parsedWorkflow.nodes && parsedWorkflow.edges) {
            setWorkflow(prev => ({
              ...prev,
              nodes: parsedWorkflow.nodes,
              edges: parsedWorkflow.edges,
              name: parsedWorkflow.name || prev.name,
              trigger: parsedWorkflow.trigger || prev.trigger
            }));
            toast.success('Workflow updated by AI!');
          }
        } catch (e) {
          console.error('Failed to parse AI workflow JSON', e);
        }
      }

    } catch (err: any) {
      toast.error(err.message || 'AI failed to respond');
    } finally {
      setIsAiStreaming(false);
    }
  };

  const handleAiButtonMouseDown = (e: React.MouseEvent) => {
    setIsAiButtonDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleAiButtonClick = (e: React.MouseEvent) => {
    // Only toggle if it wasn't a significant drag
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) +
      Math.pow(e.clientY - dragStartPos.y, 2)
    );
    if (dragDistance < 5) {
      setIsAiOverlayOpen(!isAiOverlayOpen);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Use a generic session for workflow file uploads
      const res = await chatApi.uploadFile('workflow_gen', file);
      setAttachedFile({ url: res.file_url, name: res.filename });
      toast.success('File attached for AI');
    } catch (err: any) {
      toast.error('File upload failed');
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isAiButtonDragging) {
        setAiButtonPos({ y: e.clientY - 25 });
      }
    };
    const handleGlobalMouseUp = () => {
      setIsAiButtonDragging(false);
    };

    if (isAiButtonDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isAiButtonDragging]);

  // --- Rendering Helpers ---

  const renderConnectionLines = () => {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {workflow.edges.map(edge => {
          const source = workflow.nodes.find(n => n.id === edge.source);
          const target = workflow.nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;

          const x1 = source.position.x + 180;
          const y1 = source.position.y + 40;
          const x2 = target.position.x;
          const y2 = target.position.y + 40;

          const dx = Math.abs(x1 - x2) * 0.5;
          return (
            <path
              key={edge.id}
              d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-accent-primary opacity-60"
            />
          );
        })}
        {connectingFrom && (
          <path
            d={(() => {
              const node = workflow.nodes.find(n => n.id === connectingFrom.id);
              if (!node) return '';
              const x1 = connectingFrom.type === 'out' ? node.position.x + 180 : node.position.x;
              const y1 = node.position.y + 40;
              const x2 = mousePos.x;
              const y2 = mousePos.y;
              const dx = Math.abs(x1 - x2) * 0.5;
              return `M ${x1} ${y1} C ${connectingFrom.type === 'out' ? x1 + dx : x1 - dx} ${y1}, ${connectingFrom.type === 'out' ? x2 - dx : x2 + dx} ${y2}, ${x2} ${y2}`;
            })()}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            className="text-accent-primary opacity-40"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden relative border border-border rounded-3xl shadow-2xl">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center text-accent-foreground shadow-lg">
            <Zap size={20} />
          </div>
          <div>
            <input
              value={workflow.name}
              onChange={e => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              className="text-lg font-black bg-transparent border-none focus:outline-none p-0 w-64 truncate"
              placeholder="Workflow Name"
            />
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Workflow Designer</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveView('node')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeView === 'node' ? "bg-background text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
              )}
            >
              Nodes
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeView === 'list' ? "bg-background text-foreground shadow-sm" : "text-text-muted hover:text-foreground"
              )}
            >
              List
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-2" />

          <div className="flex gap-1.5 mr-2">
            <button onClick={handleExport} className="p-2 bg-secondary border border-border text-text-muted hover:text-foreground rounded-xl transition-all" title="Export Workflow">
              <Download size={16} />
            </button>
            <button onClick={handleImportClick} className="p-2 bg-secondary border border-border text-text-muted hover:text-foreground rounded-xl transition-all" title="Import Workflow">
              <Upload size={16} />
            </button>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-accent-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg">
            <Save size={14} />
            Save
          </button>
          <div className="flex items-center bg-secondary border border-border rounded-xl px-3 py-1.5 h-10">
            <Monitor size={14} className="text-text-muted mr-2" />
            <select
              className="bg-transparent border-none focus:outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
              value={targetMachine ? `${targetMachine.type}:${targetMachine.id}` : ''}
              onChange={(e) => {
                const [type, id] = e.target.value.split(':');
                setTargetMachine(id ? { id, type: type as 'vm' | 'device' } : null);
              }}
            >
              <option value="">Select Target</option>
              {vms.filter(v => v.status === 'running').map(v => (
                <option key={v.id} value={`vm:${v.id}`}>VM: {v.name}</option>
              ))}
              {devices.filter(d => d.status === 'paired').map(d => (
                <option key={d.id} value={`device:${d.id}`}>Device: {d.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleRun} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-card-hover transition-all">
            <Play size={14} />
            Run
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 text-text-muted hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
        {activeView === 'node' ? (
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-default overflow-auto select-none"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleMouseUp}
            style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)', backgroundSize: '40px 40px' }}
          >
            <div
              className="absolute inset-0"
              style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: '3000px', height: '3000px' }}
            >
              {renderConnectionLines()}
              {workflow.nodes.map(node => (
                <NodeElement
                  key={node.id}
                  node={node}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onPortMouseDown={(e, type) => handlePortMouseDown(e, node.id, type)}
                  onDelete={() => deleteNode(node.id)}
                  onUpdate={(data) => updateNodeData(node.id, data)}
                />
              ))}
            </div>

            {/* Canvas Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <button
                onClick={() => addNode('nl_task')}
                className="w-12 h-12 rounded-full bg-accent-primary text-accent-foreground flex items-center justify-center shadow-2xl hover:scale-110 transition-all"
                title="Add Task Node"
              >
                <Plus size={24} />
              </button>
              <div className="bg-card border border-border rounded-2xl p-1 shadow-2xl flex flex-col gap-1">
                <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="w-8 h-8 flex items-center justify-center hover:bg-card-hover rounded-lg transition-colors"><Maximize2 size={14}/></button>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="w-8 h-8 flex items-center justify-center hover:bg-card-hover rounded-lg transition-colors"><Minimize2 size={14}/></button>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 flex gap-2">
              <NodePicker onPick={addNode} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-12 px-6 overflow-y-auto h-full">
            {workflow.nodes.length === 0 ? (
              <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
                <Brain className="mx-auto mb-4 text-text-muted opacity-20" size={48} />
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No nodes defined in this workflow</p>
                <button onClick={() => setActiveView('node')} className="mt-4 text-[10px] font-black text-accent-primary uppercase tracking-widest">Switch to Node View</button>
              </div>
            ) : (
              <div className="space-y-4">
                {workflow.nodes.map((node, i) => (
                  <div key={node.id} className="bg-card border border-border p-6 rounded-2xl flex items-center gap-6 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-[12px] font-black shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <NodeIcon type={node.type} size={14} className="text-accent-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{node.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm font-bold">{node.data.value || 'Untitled Step'}</div>
                      <div className="text-xs text-text-muted mt-1">{node.data.description || 'No description provided.'}</div>
                    </div>
                    <button onClick={() => deleteNode(node.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI Draggable Button & Overlay */}
      <div
        className="fixed right-0 z-[100] pointer-events-none flex items-center"
        style={{ top: aiButtonPos.y }}
      >
        <div className="flex items-center">
          <button
            onMouseDown={handleAiButtonMouseDown}
            onClick={handleAiButtonClick}
            className={cn(
              "w-12 h-14 rounded-l-3xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl pointer-events-auto transition-all",
              isAiOverlayOpen ? "translate-x-full opacity-0" : "translate-x-0"
            )}
          >
            <Bot size={24} className={cn(isAiButtonDragging && "scale-110")} />
          </button>
        </div>

        {/* AI Sidebar Overlay */}
        <div
          className={cn(
            "fixed inset-y-0 right-0 w-[450px] bg-background border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.3)] pointer-events-auto flex flex-col transition-transform duration-500 ease-out z-[101]",
            isAiOverlayOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0 bg-secondary">
            <div className="flex items-center gap-3">
              <Bot size={20} className="text-foreground" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Workflow AI Designer</span>
            </div>
            <button
              onClick={() => setIsAiOverlayOpen(false)}
              className="p-2 hover:bg-card rounded-xl transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {aiMessages.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-accent-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                  <Sparkles size={32} className="text-accent-primary" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Need a workflow?</h3>
                <p className="text-xs text-text-muted font-medium max-w-[250px] mx-auto leading-relaxed">
                  Tell me what you want to automate, and I'll build the visual flow for you.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  {['Morning routine', 'File cleanup', 'Daily backup', 'Research assistant'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setAiInput(suggestion)}
                      className="px-3 py-1.5 bg-secondary border border-border rounded-full text-[10px] font-bold hover:bg-card transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              aiMessages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user'
                      ? "bg-accent-primary text-accent-foreground rounded-tr-sm"
                      : "bg-secondary text-foreground rounded-tl-sm border border-border"
                  )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            )}
            {isAiStreaming && (
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Thinking...</span>
              </div>
            )}
          </div>

          {attachedFile && (
            <div className="mx-6 mb-2 flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl">
              <File size={12} className="text-text-muted" />
              <span className="text-[10px] font-bold text-text-secondary truncate flex-1">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-text-muted hover:text-foreground"><X size={12}/></button>
            </div>
          )}

          <div className="p-4 border-t border-border bg-secondary">
            <div className="relative flex items-end gap-2 bg-background border border-border rounded-2xl p-1.5 focus-within:border-accent-primary/50 transition-all shadow-xl">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-text-muted hover:text-foreground transition-colors"
              >
                <Paperclip size={18} />
              </button>
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
                placeholder="Ask AI to create or modify..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm p-2.5 resize-none max-h-32 min-h-[42px]"
                rows={1}
              />
              <button
                onClick={handleAiSend}
                disabled={!aiInput.trim() || isAiStreaming}
                className="p-2.5 bg-accent-primary text-accent-foreground rounded-xl disabled:opacity-30 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeElement({ node, onMouseDown, onPortMouseDown, onDelete, onUpdate }: any) {
  return (
    <div
      className="absolute w-[200px] bg-card border border-border rounded-2xl shadow-xl transition-shadow hover:shadow-2xl z-10 overflow-visible"
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={onMouseDown}
    >
      <div className="p-3 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <NodeIcon type={node.type} size={14} className="text-accent-primary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted truncate w-24">
            {node.type.replace('_', ' ')}
          </span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-text-muted hover:text-red-500 p-1">
          <X size={12} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {node.type === 'nl_task' ? (
          <textarea
            value={node.data.value}
            onChange={e => onUpdate({ value: e.target.value })}
            placeholder="Describe task..."
            className="w-full bg-secondary border border-border rounded-lg p-2 text-[11px] focus:outline-none focus:border-accent-primary/50 resize-none min-h-[60px]"
          />
        ) : node.type === 'start_time' ? (
          <input
            type="time"
            value={node.data.value}
            onChange={e => onUpdate({ value: e.target.value })}
            className="w-full bg-secondary border border-border rounded-lg p-2 text-[11px] focus:outline-none"
          />
        ) : (
          <input
            value={node.data.value}
            onChange={e => onUpdate({ value: e.target.value })}
            placeholder="Value..."
            className="w-full bg-secondary border border-border rounded-lg p-2 text-[11px] focus:outline-none"
          />
        )}
      </div>

      {/* Ports */}
      {!node.type.startsWith('start') && (
        <div
          className="node-port absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-card border-2 border-accent-primary rounded-full cursor-crosshair hover:scale-150 transition-transform z-20"
          data-node-id={node.id}
          data-port-type="in"
          onMouseDown={(e) => onPortMouseDown(e, 'in')}
        />
      )}
      <div
        className="node-port absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent-primary rounded-full cursor-crosshair hover:scale-150 transition-transform z-20"
        data-node-id={node.id}
        data-port-type="out"
        onMouseDown={(e) => onPortMouseDown(e, 'out')}
      />
    </div>
  );
}

function NodeIcon({ type, size, className }: { type: string; size: number; className?: string }) {
  switch (type) {
    case 'start_time': return <Clock size={size} className={className} />;
    case 'start_keyword': return <Zap size={size} className={className} />;
    case 'app': return <Maximize2 size={size} className={className} />;
    case 'file': return <FileText size={size} className={className} />;
    case 'document': return <File size={size} className={className} />;
    case 'web_search': return <Search size={size} className={className} />;
    case 'browser_search': return <Globe size={size} className={className} />;
    case 'nl_task': return <Brain size={size} className={className} />;
    default: return <Settings size={size} className={className} />;
  }
}

function NodePicker({ onPick }: { onPick: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const types = [
    { type: 'start_time', label: 'Trigger: Time', icon: <Clock size={12}/> },
    { type: 'start_keyword', label: 'Trigger: Keyword', icon: <Zap size={12}/> },
    { type: 'app', label: 'Open App', icon: <Maximize2 size={12}/> },
    { type: 'file', label: 'Open File', icon: <FileText size={12}/> },
    { type: 'web_search', label: 'Web Search', icon: <Search size={12}/> },
    { type: 'nl_task', label: 'AI Task', icon: <Brain size={12}/> },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-card border border-border rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-card-hover transition-all"
      >
        <Plus size={14} />
        Add Component
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border rounded-2xl shadow-2xl p-1 overflow-hidden animate-in slide-in-from-bottom-2">
          {types.map(t => (
            <button
              key={t.type}
              onClick={() => { onPick(t.type); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-text-secondary hover:text-foreground hover:bg-secondary rounded-xl transition-all"
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
