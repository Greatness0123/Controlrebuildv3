import { r as reactExports, j as jsxRuntimeExports, A as AnimatePresence, m as motion, c as client, R as React } from "./globals-DPKk9YB3.js";
import { c as create, d as devtools, p as persist, i as immer } from "./immer-zSCVQdSb.js";
import { I as Icon } from "./Icon--HAIB-bv.js";
import { B as Button } from "./Button-CSJGGdAl.js";
import { S as ScrollArea } from "./ScrollArea-C4veLPX8.js";
import { T as Tooltip } from "./Tooltip-Dmjz3k_R.js";
const useWorkflowStore = create()(
  devtools(
    persist(
      immer((set) => ({
        workflows: [],
        activeWorkflowId: null,
        isExecuting: false,
        setWorkflows: (workflows) => set((state) => {
          state.workflows = workflows;
        }),
        addWorkflow: (workflow) => set((state) => {
          state.workflows.push(workflow);
        }),
        updateWorkflow: (workflow) => set((state) => {
          const index = state.workflows.findIndex((w) => w.id === workflow.id);
          if (index !== -1) state.workflows[index] = workflow;
        }),
        deleteWorkflow: (id) => set((state) => {
          state.workflows = state.workflows.filter((w) => w.id !== id);
        }),
        setActiveWorkflow: (id) => set((state) => {
          state.activeWorkflowId = id;
        }),
        setExecuting: (value) => set((state) => {
          state.isExecuting = value;
        })
      })),
      {
        name: "control-workflow-storage"
      }
    ),
    { name: "WorkflowStore", enabled: false }
  )
);
function WorkflowApp() {
  const { workflows, activeWorkflowId, setActiveWorkflow, addWorkflow, updateWorkflow } = useWorkflowStore();
  const [isAddingStep, setIsAddingStep] = reactExports.useState(false);
  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);
  const handleAddWorkflow = () => {
    const newWf = {
      id: crypto.randomUUID(),
      name: "Untitled Workflow",
      enabled: true,
      trigger: { type: "keyword", value: "" },
      steps: []
    };
    addWorkflow(newWf);
    setActiveWorkflow(newWf.id);
  };
  const handleUpdateName = (name) => {
    if (activeWorkflow) updateWorkflow({ ...activeWorkflow, name });
  };
  const handleAddStep = (type) => {
    if (activeWorkflow) {
      const updatedSteps = [...activeWorkflow.steps, { type, value: "" }];
      updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
    }
    setIsAddingStep(false);
  };
  const handleExport = async () => {
    if (activeWorkflowId) {
      const res = await window.workflowAPI.exportWorkflow(activeWorkflowId);
      if (res && res.success) {
        alert("Workflow exported successfully");
      }
    }
  };
  const handleRun = async () => {
    if (activeWorkflowId) {
      await window.workflowAPI.executeWorkflow(activeWorkflowId);
      window.chatAPI.showWindow("chat");
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
      window.workflowAPI.getAllWorkflows().then((wfs) => {
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen bg-bg-base text-text-primary overflow-hidden select-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,var(--bg-elevated)_1px,transparent_1px)] bg-[size:32px_32px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "absolute top-6 left-1/2 -translate-x-1/2 h-14 px-4 bg-bg-surface/80 backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl flex items-center gap-6 z-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 border-r border-border-subtle pr-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.chatAPI.showWindow("chat"), className: "p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "ArrowLeft", size: "sm" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: activeWorkflow?.name || "Select a workflow",
              onChange: (e) => handleUpdateName(e.target.value),
              className: "bg-transparent border-none outline-none font-bold text-sm min-w-[120px]",
              placeholder: "Workflow Name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { content: "Add Step", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "sm",
                iconLeft: "Plus",
                onClick: () => setIsAddingStep(!isAddingStep),
                children: "Add Step"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: isAddingStep && /* @__PURE__ */ jsxRuntimeExports.jsx(
              motion.div,
              {
                initial: { opacity: 0, y: 10, scale: 0.95 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: 10, scale: 0.95 },
                className: "absolute top-full mt-2 left-0 w-48 bg-bg-elevated border border-border-strong rounded-xl shadow-2xl overflow-hidden py-1",
                children: ["app", "web_search", "nl_task", "file"].map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: () => handleAddStep(type),
                    className: "w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors capitalize",
                    children: type.replace("_", " ")
                  },
                  type
                ))
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "primary", size: "sm", iconLeft: "Play", onClick: handleRun, children: "Run" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", iconLeft: "Save", onClick: handleSave, children: "Save" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", iconLeft: "Download", onClick: handleExport, children: "Export" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 border-l border-border-subtle pl-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Search", size: "sm" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Maximize2", size: "sm" }) })
        ] })
      ] }),
      !activeWorkflow && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center space-y-6 opacity-40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 bg-bg-surface border border-border-subtle rounded-3xl flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "GitBranch", size: "xl" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold uppercase tracking-widest text-sm", children: "No workflow selected" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs max-w-[200px]", children: "Select a workflow from the sidebar or create a new one to begin" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "primary", onClick: handleAddWorkflow, children: "Create New Workflow" })
      ] }),
      activeWorkflow && /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-full pt-32 pb-20 flex flex-col items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-8 w-full max-w-2xl px-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            className: "w-full p-6 bg-bg-surface border border-ash rounded-2xl shadow-xl flex items-center gap-6 relative",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-text-muted border border-white/5 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Zap", size: "lg" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1", children: "Trigger" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "bg-transparent border-none outline-none w-full text-sm font-medium",
                    value: activeWorkflow.trigger.value,
                    placeholder: "e.g. 'open project'",
                    onChange: (e) => updateWorkflow({ ...activeWorkflow, trigger: { ...activeWorkflow.trigger, value: e.target.value } })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 h-8 w-px bg-border-subtle" })
            ]
          }
        ),
        activeWorkflow.steps.map((step, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            className: "w-full p-6 bg-bg-surface border border-border-subtle rounded-2xl shadow-xl flex items-center gap-6 relative group",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-text-muted border border-white/5 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: step.type === "app" ? "Play" : step.type === "web_search" ? "Globe" : "FileText", size: "lg" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1", children: [
                  "Step ",
                  i + 1
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "bg-transparent border-none outline-none w-full text-sm font-medium",
                    value: step.value,
                    placeholder: `Describe the ${step.type}...`,
                    onChange: (e) => {
                      const steps = [...activeWorkflow.steps];
                      steps[i].value = e.target.value;
                      updateWorkflow({ ...activeWorkflow, steps });
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => {
                    const steps = activeWorkflow.steps.filter((_, idx) => idx !== i);
                    updateWorkflow({ ...activeWorkflow, steps });
                  },
                  className: "p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-all",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Trash2", size: "sm" })
                }
              ),
              i < activeWorkflow.steps.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-1/2 -translate-x-1/2 h-8 w-px bg-border-subtle" })
            ]
          },
          i
        ))
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[300px] bg-bg-surface border-l border-border-strong flex flex-col shadow-2xl relative z-40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-16 px-6 border-b border-border-subtle flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-black uppercase tracking-widest text-text-muted", children: "My Workflows" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleImport, className: "p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors", title: "Import Workflows", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Upload", size: "sm" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleAddWorkflow, className: "p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors", title: "New Workflow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { name: "Plus", size: "sm" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "flex-1 p-3 space-y-1", children: workflows.map((wf) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActiveWorkflow(wf.id),
          className: `w-full text-left p-4 rounded-xl border transition-all ${activeWorkflowId === wf.id ? "bg-white text-black border-white shadow-xl" : "bg-transparent border-transparent hover:bg-white/5 text-text-secondary"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold truncate pr-2", children: wf.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-1.5 h-1.5 rounded-full ${wf.enabled ? "bg-green-500" : "bg-text-disabled"}` })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] opacity-60 truncate block capitalize", children: [
              "Trigger: ",
              wf.trigger.type
            ] })
          ]
        },
        wf.id
      )) })
    ] })
  ] });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowApp, {}) })
);
