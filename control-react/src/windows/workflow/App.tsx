import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowStore } from '../../stores/workflowStore';
import { Workflow, WorkflowStep } from '../../types/workflow';
import { Icon } from '../../components/shared/Icon';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { ScrollArea } from '../../components/shared/ScrollArea';
import { Tooltip } from '../../components/shared/Tooltip';

export default function WorkflowApp() {
  const { workflows, activeWorkflowId, setActiveWorkflow, addWorkflow, updateWorkflow } = useWorkflowStore();
  const [isAddingStep, setIsAddingStep] = useState(false);

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

  const handleAddWorkflow = () => {
    const newWf: Workflow = {
      id: crypto.randomUUID(),
      name: 'Untitled Workflow',
      enabled: true,
      trigger: { type: 'keyword', value: '' },
      steps: []
    };
    addWorkflow(newWf);
    setActiveWorkflow(newWf.id);
  };

  const handleUpdateName = (name: string) => {
    if (activeWorkflow) updateWorkflow({ ...activeWorkflow, name });
  };

  const handleAddStep = (type: WorkflowStep['type']) => {
    if (activeWorkflow) {
      const updatedSteps = [...activeWorkflow.steps, { type, value: '' }];
      updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
    }
    setIsAddingStep(false);
  };

  const handleExport = async () => {
    if (activeWorkflowId) {
      const res = await window.workflowAPI.exportWorkflow(activeWorkflowId);
      if (res && res.success) {
        alert('Workflow exported successfully');
      }
    }
  };

  const handleRun = async () => {
    if (activeWorkflowId) {
      await window.workflowAPI.executeWorkflow(activeWorkflowId);
      window.chatAPI.showWindow('chat');
    }
  };

  const handleSave = async () => {
    if (activeWorkflow) {
      await window.workflowAPI.saveWorkflow(activeWorkflow);
    }
  };

  const handleImport = async () => {
    const res = await window.workflowAPI.importWorkflow();
    if (res && res.success) {
      // Stores will auto-sync via listeners in Phase 5 wiring or manual refresh
      window.workflowAPI.getAllWorkflows().then(wfs => {
        // useWorkflowStore.getState().setWorkflows(wfs);
        // For now, reload session or assume main process broadcast
      });
    }
  };

  return (
    <div className="flex h-screen bg-bg-base text-text-primary overflow-hidden select-none">
      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,var(--bg-elevated)_1px,transparent_1px)] bg-[size:32px_32px]">
        {/* Toolbar */}
        <header className="absolute top-6 left-1/2 -translate-x-1/2 h-14 px-4 bg-bg-surface/80 backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl flex items-center gap-6 z-50">
          <div className="flex items-center gap-4 border-r border-border-subtle pr-6">
            <button onClick={() => window.chatAPI.showWindow('chat')} className="p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors">
              <Icon name="ArrowLeft" size="sm" />
            </button>
            <input
              value={activeWorkflow?.name || 'Select a workflow'}
              onChange={(e) => handleUpdateName(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-sm min-w-[120px]"
              placeholder="Workflow Name"
            />
          </div>

          <div className="flex items-center gap-2">
            <Tooltip content="Add Step">
               <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft="Plus"
                  onClick={() => setIsAddingStep(!isAddingStep)}
                >
                  Add Step
                </Button>
                <AnimatePresence>
                  {isAddingStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-2 left-0 w-48 bg-bg-elevated border border-border-strong rounded-xl shadow-2xl overflow-hidden py-1"
                    >
                      {(['app', 'web_search', 'nl_task', 'file'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => handleAddStep(type)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors capitalize"
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>
            </Tooltip>
            <Button variant="primary" size="sm" iconLeft="Play" onClick={handleRun}>Run</Button>
            <Button variant="ghost" size="sm" iconLeft="Save" onClick={handleSave}>Save</Button>
            <Button variant="ghost" size="sm" iconLeft="Download" onClick={handleExport}>Export</Button>
          </div>

          <div className="flex items-center gap-1 border-l border-border-subtle pl-6">
            <button className="p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors"><Icon name="Search" size="sm" /></button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors"><Icon name="Maximize2" size="sm" /></button>
          </div>
        </header>

        {/* Empty State */}
        {!activeWorkflow && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 opacity-40">
            <div className="w-24 h-24 bg-bg-surface border border-border-subtle rounded-3xl flex items-center justify-center">
              <Icon name="GitBranch" size="xl" />
            </div>
            <div className="text-center space-y-2">
               <h3 className="font-bold uppercase tracking-widest text-sm">No workflow selected</h3>
               <p className="text-xs max-w-[200px]">Select a workflow from the sidebar or create a new one to begin</p>
            </div>
            <Button variant="primary" onClick={handleAddWorkflow}>Create New Workflow</Button>
          </div>
        )}

        {/* Workflow Steps (Vertical list representation for Phase 3) */}
        {activeWorkflow && (
          <ScrollArea className="h-full pt-32 pb-20 flex flex-col items-center">
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-20">
               {/* Trigger Node */}
               <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full p-6 bg-bg-surface border border-ash rounded-2xl shadow-xl flex items-center gap-6 relative"
               >
                 <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-text-muted border border-white/5 shrink-0">
                   <Icon name="Zap" size="lg" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Trigger</span>
                    <input
                      className="bg-transparent border-none outline-none w-full text-sm font-medium"
                      value={activeWorkflow.trigger.value}
                      placeholder="e.g. 'open project'"
                      onChange={(e) => updateWorkflow({ ...activeWorkflow, trigger: { ...activeWorkflow.trigger, value: e.target.value } })}
                    />
                 </div>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-px bg-border-subtle" />
               </motion.div>

               {/* Step Nodes */}
               {activeWorkflow.steps.map((step, i) => (
                 <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full p-6 bg-bg-surface border border-border-subtle rounded-2xl shadow-xl flex items-center gap-6 relative group"
                 >
                   <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-text-muted border border-white/5 shrink-0">
                     <Icon name={step.type === 'app' ? 'Play' : step.type === 'web_search' ? 'Globe' : 'FileText'} size="lg" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Step {i + 1}</span>
                      <input
                        className="bg-transparent border-none outline-none w-full text-sm font-medium"
                        value={step.value}
                        placeholder={`Describe the ${step.type}...`}
                        onChange={(e) => {
                          const steps = [...activeWorkflow.steps];
                          steps[i].value = e.target.value;
                          updateWorkflow({ ...activeWorkflow, steps });
                        }}
                      />
                   </div>
                   <button
                    onClick={() => {
                      const steps = activeWorkflow.steps.filter((_, idx) => idx !== i);
                      updateWorkflow({ ...activeWorkflow, steps });
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all"
                   >
                     <Icon name="Trash2" size="sm" />
                   </button>
                   {i < activeWorkflow.steps.length - 1 && (
                     <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-px bg-border-subtle" />
                   )}
                 </motion.div>
               ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Sidebar List */}
      <div className="w-[300px] bg-bg-surface border-l border-border-strong flex flex-col shadow-2xl relative z-40">
        <header className="h-16 px-6 border-b border-border-subtle flex items-center justify-between">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">My Workflows</h4>
           <div className="flex items-center gap-1">
             <button onClick={handleImport} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors" title="Import Workflows">
               <Icon name="Upload" size="sm" />
             </button>
             <button onClick={handleAddWorkflow} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors" title="New Workflow">
               <Icon name="Plus" size="sm" />
             </button>
           </div>
        </header>
        <ScrollArea className="flex-1 p-3 space-y-1">
          {workflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setActiveWorkflow(wf.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${activeWorkflowId === wf.id ? 'bg-white text-black border-white shadow-xl' : 'bg-transparent border-transparent hover:bg-white/5 text-text-secondary'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold truncate pr-2">{wf.name}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${wf.enabled ? 'bg-green-500' : 'bg-text-disabled'}`} />
              </div>
              <span className="text-[10px] opacity-60 truncate block capitalize">Trigger: {wf.trigger.type}</span>
            </button>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}

function Tooltip({ content, children }: { content: string, children: React.ReactNode }) {
  return <div className="group relative">{children}<div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{content}</div></div>;
}
