import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Workflow } from '../types/workflow';

interface WorkflowState {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  isExecuting: boolean;
}

interface WorkflowActions {
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
  setExecuting: (value: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState & WorkflowActions>()(
  devtools(
    persist(
      immer((set) => ({
        workflows: [],
        activeWorkflowId: null,
        isExecuting: false,

        setWorkflows: (workflows) =>
          set((state) => {
            state.workflows = workflows;
          }),

        addWorkflow: (workflow) =>
          set((state) => {
            state.workflows.push(workflow);
          }),

        updateWorkflow: (workflow) =>
          set((state) => {
            const index = state.workflows.findIndex((w: any) => w.id === workflow.id);
            if (index !== -1) state.workflows[index] = workflow;
          }),

        deleteWorkflow: (id) =>
          set((state) => {
            state.workflows = state.workflows.filter((w: any) => w.id !== id);
          }),

        setActiveWorkflow: (id) =>
          set((state) => {
            state.activeWorkflowId = id;
          }),

        setExecuting: (value) =>
          set((state) => {
            state.isExecuting = value;
          }),
      })),
      {
        name: 'control-workflow-storage',
      }
    ),
    { name: 'WorkflowStore', enabled: process.env.NODE_ENV === 'development' }
  )
);
