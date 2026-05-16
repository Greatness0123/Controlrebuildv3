export interface UserInfo {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Master';
  tasksCompleted: number;
  hoursSaved: number;
  successRate: number;
  picovoiceKey: string | null;
  aiSettings: any;
  appSettings: any;
  actCount: number;
  askCount: number;
  totalTokens: number;
  dailyTokenData: Record<string, { prompt: number; candidates: number; total: number }>;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: UserInfo;
}

export interface LoginPayload {
  email: string;
  password?: string;
}
