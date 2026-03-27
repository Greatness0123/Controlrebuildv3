"use client";

import { useState, useEffect } from 'react';
import { workflowApi } from '@/lib/api';
import WorkflowDesigner from '@/components/WorkflowDesigner';
import {
  Plus, Zap, Trash2, Edit2, Play, Search,
  Loader2, MoreVertical, Check, X, Clock
} from 'lucide-react';
import { useModal } from '@/lib/useModal';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const { modal, alert } = useModal();

  const fetchWorkflows = async () => {
    try {
      const res = await workflowApi.list();
      setWorkflows(res.workflows);
    } catch (err: any) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreate = () => {
    setEditingWorkflow(null);
    setIsDesignerOpen(true);
  };

  const handleEdit = (wf: any) => {
    setEditingWorkflow(wf);
    setIsDesignerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await workflowApi.delete(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete workflow');
    }
  };

  const handleToggle = async (wf: any) => {
    try {
      const nextEnabled = !wf.enabled;
      await workflowApi.update(wf.id, { enabled: nextEnabled });
      setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, enabled: nextEnabled } : w));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle workflow');
    }
  };

  if (isDesignerOpen) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4 bg-secondary/30">
        <WorkflowDesigner
          initialWorkflow={editingWorkflow}
          onSave={() => {
            fetchWorkflows();
            setIsDesignerOpen(false);
          }}
          onClose={() => setIsDesignerOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-background">
      {modal}
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Workflows</h1>
            <p className="text-text-muted text-sm font-medium mt-1">Automate your desktop with visual logic and AI agents.</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-accent-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={3} />
            Create Workflow
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-text-muted opacity-50" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-32 bg-card border border-dashed border-border rounded-[3rem] shadow-sm">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Zap size={40} className="text-text-muted opacity-20" />
            </div>
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">No Workflows Found</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto font-medium mb-8">
              Start by creating your first automation or ask the AI to design one for you.
            </p>
            <button
              onClick={handleCreate}
              className="px-8 py-3 bg-card border border-border text-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-card-hover transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="bg-card border border-border rounded-[2rem] p-6 hover:border-accent-primary/50 transition-all group relative overflow-hidden flex flex-col shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                    wf.enabled ? "bg-accent-primary text-accent-foreground shadow-lg" : "bg-secondary text-text-muted border border-border"
                  )}>
                    <Zap size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(wf)}
                      className={cn(
                        "w-10 h-6 rounded-full relative transition-colors duration-300",
                        wf.enabled ? "bg-emerald-500" : "bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300",
                        wf.enabled ? "right-1" : "left-1"
                      )} />
                    </button>
                    <div className="relative group/menu">
                      <button className="p-2 text-text-muted hover:text-foreground">
                        <MoreVertical size={16} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-xl shadow-2xl opacity-0 group-hover/menu:opacity-100 pointer-events-none group-hover/menu:pointer-events-auto transition-all z-10 p-1">
                        <button onClick={() => handleEdit(wf)} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-secondary rounded-lg">Edit</button>
                        <button onClick={() => handleDelete(wf.id)} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 text-red-500 rounded-lg">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black truncate mb-1 uppercase tracking-tight">{wf.name}</h3>
                  <div className="flex items-center gap-2 text-text-muted mb-4">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {wf.trigger?.type === 'time' ? `Scheduled: ${wf.trigger.value}` : wf.trigger?.type === 'keyword' ? `Keyword: ${wf.trigger.value}` : 'Manual Trigger'}
                    </span>
                  </div>

                  <div className="flex gap-1.5 mb-6 overflow-hidden">
                    {wf.nodes?.slice(0, 4).map((n: any, i: number) => (
                      <div key={i} className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                        <NodeIconMini type={n.type} />
                      </div>
                    ))}
                    {wf.nodes?.length > 4 && (
                      <div className="text-[10px] font-black text-text-muted self-center ml-1">+{wf.nodes.length - 4}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(wf)}
                    className="flex-1 py-3 bg-secondary border border-border text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-card-hover transition-all"
                  >
                    Configure
                  </button>
                  <button className="w-12 h-12 bg-accent-primary text-accent-foreground rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg active:scale-95">
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NodeIconMini({ type }: { type: string }) {
  const size = 12;
  switch (type) {
    case 'start_time': return <Clock size={size} />;
    case 'start_keyword': return <Zap size={size} />;
    case 'app': return <X size={size} />; // Just a placeholder, would be icon based
    case 'nl_task': return <BrainMini size={size} />;
    default: return <Plus size={size} />;
  }
}

function BrainMini({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5 5 0 0 1 12 4a5 5 0 0 1 2.5-2 5 5 0 0 1 9.5 3 5 5 0 0 1-4.5 5h-10A5 5 0 0 1 0 5a5 5 0 0 1 9.5-3z" />
      <path d="M12 22a7 7 0 0 0 7-7H5a7 7 0 0 0 7 7z" />
    </svg>
  );
}
