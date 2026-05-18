export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: number[];
  thumbnail?: string;
}

export interface TaskPayload {
  text: string;
  attachments?: Attachment[];
  mode?: 'ask' | 'act' | 'click';
  skipWorkflowCheck?: boolean;
  api_key?: string;
  taskPlan?: any[];
  workflowName?: string;
  workflowId?: string;
}

export interface TaskResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface Action {
  tool: string;
  parameters: any;
}

export interface Step {
  step: number;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tool?: string;
  screenshot?: string;
}

export interface LearnedBehavior {
  name: string;
  description: string;
  pattern: string;
}

export interface GhostCursorData {
  x?: number;
  y?: number;
  text?: string;
  guiding?: boolean;
}
