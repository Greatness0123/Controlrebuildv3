# Phase 4 IPC Audit

## Overview
This audit catalog of all Inter-Process Communication (IPC) channels active in the React-migrated Control application. Every channel is typed and wired end-to-end between the Electron Main process and the React Renderer processes.

## IPC Channel Inventory

| Channel Name | Direction | Registered In | Preload File | Used By Windows | Payload Type | Return Type | Status |
|--------------|-----------|---------------|--------------|-----------------|--------------|-------------|--------|
| `show-window` | R → M | `main.js` | `chat.ts`, `settings.ts`, etc. | All | `string` (windowType) | `Promise<{success: boolean}>` | Wired |
| `hide-window` | R → M | `main.js` | `chat.ts` | Chat | `string` (windowType) | `Promise<{success: boolean}>` | Wired |
| `toggle-chat` | R → M | `main.js` | `chat.ts`, `overlay.ts` | Chat, Overlay | None | `Promise<{visible: boolean, needsAuth?: boolean}>` | Wired |
| `execute-task`| R → M | `main.js` | `chat.ts`, `lite.ts` | Chat, Lite | `TaskPayload`, `string` (mode) | `Promise<TaskResult>` | Wired |
| `stop-task`   | R → M | `main.js` | `chat.ts`, `lite.ts` | Chat, Lite | None | `Promise<void>` | Wired |
| `get-settings`| R → M | `main.js` | `chat.ts`, `settings.ts` | Chat, Settings | None | `Promise<AppSettings>` | Wired |
| `save-settings`| R → M | `main.js` | `chat.ts`, `settings.ts` | Chat, Settings | `Partial<AppSettings>` | `Promise<{success: boolean}>` | Wired |
| `login-with-email` | R → M | `main.js` | `entry.ts` | Entry | `LoginPayload` | `Promise<AuthResult>` | Wired |
| `get-user-info` | R → M | `main.js` | `chat.ts`, `entry.ts` | Chat, Entry | None | `Promise<UserInfo \| null>` | Wired |
| `show-prompt-modal` | R → M | `main.js` | `chat.ts` | Chat | `string`, `string?`, `any?` | `Promise<string \| null>` | Wired |
| `show-prompt-request` | M → R | N/A | `chat.ts` | Chat | `{message: string, requestId: string, ...}` | `void` | Wired |
| `ai-response` | M → R | N/A | `chat.ts`, `lite.ts` | Chat, Lite | `{text: string, is_action: boolean}` | `void` | Wired |
| `ai-stream` | M → R | N/A | `chat.ts`, `lite.ts` | Chat, Lite | `{chunk: string}` | `void` | Wired |
| `action-start` | M → R | N/A | `chat.ts`, `overlay.ts` | Chat, Overlay | `Action` object | `void` | Wired |
| `ghost-cursor:move` | M → R | N/A | `ghost-cursor.ts` | Ghost Cursor | `{x: number, y: number}` | `void` | Wired |
| `ghost-cursor:update-text` | M → R | N/A | `ghost-cursor.ts` | Ghost Cursor | `{text: string}` | `void` | Wired |
| `ghost-cursor:set-guiding` | M → R | N/A | `ghost-cursor.ts` | Ghost Cursor | `{guiding: boolean}` | `void` | Wired |
| `ghost-cursor:step-completed` | R → M | `main.js` | `ghost-cursor.ts` | Ghost Cursor | None | `void` | Wired |
| `settings-updated` | M → R | N/A | `chat.ts`, `settings.ts` | All | `AppSettings` | `void` | Wired |
| `user-changed` | M → R | N/A | `chat.ts`, `entry.ts` | Chat, Entry | `UserInfo` | `void` | Wired |
| `app-initialized` | M → R | N/A | `chat.ts` | Chat | None | `void` | Wired |
| `window-drag` | R → M | `main.js` | All | All | `{deltaX: number, deltaY: number}` | `void` | Wired |

## Direction Key
- **R → M**: Renderer process calling Main process (usually via `ipcRenderer.invoke`).
- **M → R**: Main process broadcasting/sending to Renderer processes (usually via `webContents.send`).

## Verification Results
All documented channels have been verified for:
1. **Typing**: Defined in `src/types/ipc.ts` and `src/types/preload-apis.ts`.
2. **Preload Exposure**: Correct mapping in `electron/preload/*.ts`.
3. **Frontend Wiring**: React components or Zustand stores subscribing/calling the API.
4. **Backend Handling**: Corresponding `ipcMain.handle` or `ipcMain.on` in `main.js`.
