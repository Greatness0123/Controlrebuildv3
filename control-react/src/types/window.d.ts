import { ChatAPI, EntryAPI, SettingsAPI, OverlayAPI, GhostCursorAPI, LiteAPI, WorkflowAPI } from './preload-apis';

declare global {
  interface Window {
    chatAPI: ChatAPI;
    entryAPI: EntryAPI;
    settingsAPI: SettingsAPI;
    overlayAPI: OverlayAPI;
    ghostCursorAPI: GhostCursorAPI;
    liteAPI: LiteAPI;
    workflowAPI: WorkflowAPI;
  }
}
