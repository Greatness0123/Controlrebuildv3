export interface Workflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
}

export interface WorkflowTrigger {
  type: 'keyword' | 'time';
  value: string;
  days?: string[];
}

export interface WorkflowStep {
  type: 'app' | 'file' | 'document' | 'web_search' | 'browser_search' | 'nl_task';
  value: string;
}
