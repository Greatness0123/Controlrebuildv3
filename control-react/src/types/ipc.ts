import { UserInfo, AuthResult, LoginPayload } from './auth';
import { AppSettings, Hotkeys, Voice } from './settings';
import { Workflow, WorkflowStep } from './workflow';
import { TaskPayload, TaskResult, Action, Step, LearnedBehavior, GhostCursorData } from './chat';

export interface MainHandlers {
  // ── Window Management ──
  'show-window': (windowType: string) => Promise<{ success: boolean }>;
  'hide-window': (windowType: string) => Promise<{ success: boolean }>;
  'toggle-chat': () => Promise<{ visible: boolean; needsAuth?: boolean }>;
  'close-window': (windowType: string) => Promise<{ success: boolean }>;
  'minimize-window': () => Promise<{ success: boolean }>;
  'maximize-window': () => Promise<{ success: boolean }>;
  'open-external-url': (url: string) => Promise<{ success: boolean }>;
  'open-website': () => Promise<{ success: boolean }>;

  // ── Authentication & Security ──
  'login-with-email': (payload: LoginPayload) => Promise<AuthResult>;
  'authenticate-user': (userId: string) => Promise<AuthResult>;
  'get-user-info': () => Promise<UserInfo | null>;
  'verify-entry-id': (entryId: string) => Promise<AuthResult>;
  'logout': () => Promise<{ success: boolean }>;
  'verify-pin': (pin: string) => Promise<{ valid: boolean }>;
  'enable-security-pin': (enabled: boolean) => Promise<{ success: boolean; message?: string }>;
  'set-security-pin': (pin: string) => Promise<{ success: boolean; message?: string }>;
  'change-pin': (payload: { currentPin: string; newPin: string }) => Promise<{ success: boolean; message?: string }>;
  'lock-app': () => Promise<{ success: boolean }>;
  'unlock-app': (pin: string) => Promise<{ success: boolean }>;
  'is-app-locked': () => Promise<boolean>;

  // ── Settings ──
  'get-settings': () => Promise<AppSettings>;
  'save-settings': (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
  'update-hotkeys': (hotkeys: Hotkeys) => Promise<{ success: boolean }>;
  'update-floating-button': (visible: boolean) => Promise<{ success: boolean }>;
  'set-auto-start': (enabled: boolean) => Promise<{ success: boolean }>;
  'set-window-visibility': (visible: boolean) => Promise<{ success: boolean }>;
  'get-app-version': () => Promise<{ version: string }>;

  // ── AI & Tasks ──
  'execute-task': (task: TaskPayload, mode: string) => Promise<TaskResult>;
  'stop-task': () => Promise<void>;
  'stop-action': () => Promise<void>;
  'confirm-action': (confirmed: boolean) => Promise<{ success: boolean }>;
  'get-learned-behaviors': () => Promise<LearnedBehavior[]>; // mapped from read-behaviors
  'read-behaviors': () => Promise<LearnedBehavior[]>;
  'import-skill': () => Promise<{ success: boolean; count: number }>;
  'upload-skill-folder': () => Promise<{ success: boolean; count: number }>;
  'delete-skill': (name: string) => Promise<{ success: boolean }>;
  'update-skill': (payload: any) => Promise<{ success: boolean; error?: string }>;
  'get-tool-schemas': () => Promise<{ success: boolean; schemas: any }>;
  'get-tool-names': () => Promise<{ success: boolean; tools: string[] }>;
  'execute-tool': (toolName: string, params: any) => Promise<any>;
  'validate-tool-params': (toolName: string, params: any) => Promise<{ valid: boolean }>;

  // ── Workflows ──
  'get-all-workflows': () => Promise<Workflow[]>;
  'save-workflow': (workflow: Workflow) => Promise<{ success: boolean; workflow?: Workflow }>;
  'delete-workflow': (id: string) => Promise<{ success: boolean }>;
  'toggle-workflow': (id: string, enabled: boolean) => Promise<{ success: boolean }>;
  'execute-workflow': (id: string) => Promise<{ success: boolean }>;
  'export-workflow': (id: string) => Promise<{ success: boolean }>;
  'import-workflow': () => Promise<{ success: boolean; count: number }>;
  'pick-item': (type: string) => Promise<string | null>;

  // ── Assets & Apps ──
  'get-installed-apps': () => Promise<string[]>;
  'get-cached-apps': () => Promise<{ success: boolean; apps: string[] }>;
  'refresh-app-cache': () => Promise<{ success: boolean; count: number }>;

  // ── Voice & Wakeword ──
  'set-wakeword-enabled': (enabled: boolean) => Promise<boolean>;
  'get-picovoice-key': () => Promise<{ success: boolean; key: string | null }>;
  'set-picovoice-key': (key: string) => Promise<{ success: boolean; message?: string }>;
  'validate-picovoice-key': (key: string) => Promise<{ success: boolean; message?: string }>;
  'should-speak-greeting': () => Promise<{ shouldSpeak: boolean }>;
  'speak-greeting': (text: string) => Promise<{ success: boolean }>;
  'tts-stop': () => Promise<{ success: boolean }>;
  'stop-audio': () => Promise<{ success: boolean }>;
  'tts-get-voices': () => Promise<{ success: boolean; voices: Voice[] }>;
  'tts-set-voice': (voice: string) => Promise<{ success: boolean }>;
  'tts-set-rate': (rate: number) => Promise<{ success: boolean }>;
  'tts-set-volume': (volume: number) => Promise<{ success: boolean }>;
  'tts-test-voice': (payload: any) => Promise<{ success: boolean }>;

  // ── Agentic Browser ──
  'browser-navigate': (url: string) => Promise<{ success: boolean }>;
  'browser-execute-js': (script: string) => Promise<{ success: boolean; result?: any }>;
  'browser-get-status': () => Promise<any>;
  'browser-close': () => Promise<{ success: boolean }>;

  // ── Remote Desktop ──
  'get-remote-pairing-code': (deviceName: string) => Promise<{ code: string }>;
  'toggle-remote-access': (enabled: boolean) => Promise<{ success: boolean }>;
  'get-remote-status': () => Promise<any>;

  // ── Ghost Cursor ──
  'show-ghost-cursor': () => Promise<{ success: boolean }>;
  'hide-ghost-cursor': () => Promise<{ success: boolean }>;
  'update-ghost-cursor': (data: GhostCursorData) => Promise<{ success: boolean }>;
  'init-ghost-cursor-settings': () => Promise<{ success: boolean }>;

  // ── System ──
  'quit-app': () => Promise<{ success: boolean }>;
  'restart-app': () => Promise<{ success: boolean }>;
  'delete-all-data': () => Promise<{ success: boolean; message?: string }>;
  'export-data': () => Promise<{ success: boolean; data?: any }>;
  'set-modal-active': (active: boolean) => Promise<{ success: boolean }>;
  'show-confirm-modal': (options: any) => Promise<boolean>;
}

export interface RendererEvents {
  // ── AI Interaction ──
  'ai-response': { text: string; [key: string]: any };
  'ai-stream': { text: string; [key: string]: any };
  'transcription-result': { text: string };
  'action-start': Action;
  'action-step': Step;
  'action-complete': any;
  'task-start': any;
  'task-complete': void;
  'task-stopped': void;
  'backend-error': string;
  'wakeword-error': string;
  'after-message': { text: string };
  'plan-update': any;
  'request-confirmation': any;

  // ── Voice ──
  'audio-started': void;
  'audio-stopped': { queueEmpty?: boolean; manualStop?: boolean };
  'wakeword-detected': { openedChat: boolean };
  'porcupine-key-invalid': { message: string };

  // ── State Sync ──
  'settings-updated': AppSettings;
  'user-data-updated': UserInfo;
  'user-changed': UserInfo;
  'skills-updated': void;
  'app-initialized': void;
  'workflow-started': { name: string };

  // ── Click Mode ──
  'click-step-start': void;
  'click-step-complete': void;
  'click-task-complete': void;

  // ── Overlay UI ──
  'hide-floating-button': void;
  'show-floating-button': void;
  'hide-floating-button-if-enabled': void;
  'interaction-mode-changed': { interactive: boolean };
  'show-visual-effect': { type: string };
  'request-pin-and-toggle': void;
  'floating-button-toggle': boolean;

  // ── Ghost Cursor ──
  'ghost-cursor:start-idle': void;
  'ghost-cursor:init-settings': any;
  'ghost-cursor:mouse-move': { x: number; y: number };
  'ghost-cursor:move': { x: number; y: number };
  'ghost-cursor:update-text': { text: string };
  'ghost-cursor:set-guiding': { guiding: boolean };
}
