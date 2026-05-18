# Phase 2 IPC Channel Inventory

## 1. Renderer to Main (Invocations)
| Channel | Origin Windows | Payload Type | Return Type | Description |
|---------|----------------|--------------|-------------|-------------|
| `show-window` | chat, entry, main | `string` | `{ success: boolean }` | Shows a managed window by type. |
| `hide-window` | chat, main | `string` | `{ success: boolean }` | Hides a managed window by type. |
| `toggle-chat` | chat, main | `void` | `{ visible: boolean, needsAuth?: boolean }` | Toggles chat window visibility. |
| `close-window` | chat, entry | `string` | `{ success: boolean }` | Closes and destroys a window. |
| `verify-pin` | main | `string` | `{ valid: boolean }` | Verifies the security PIN. |
| `enable-security-pin` | settings | `boolean` | `{ success: boolean, message?: string }` | Enables/disables PIN protection. |
| `set-security-pin` | settings | `string` | `{ success: boolean, message?: string }` | Sets a new security PIN. |
| `change-pin` | settings | `{ currentPin: string, newPin: string }` | `{ success: boolean, message?: string }` | Changes the security PIN. |
| `login-with-email` | entry | `{ email, password }` | `{ success: boolean, user?, message? }` | Authenticates with email/password. |
| `authenticate-user` | entry | `string` (userId) | `{ success: boolean, user?, message? }` | Authenticates with unique ID. |
| `get-user-info` | chat, entry, settings | `void` | `UserInfo \| null` | Retrieves current authenticated user. |
| `verify-entry-id` | entry | `string` | `{ success: boolean, user?, message? }` | Verifies unique entry ID. |
| `get-picovoice-key` | chat, settings | `void` | `{ success: boolean, key: string \| null }` | Gets current Picovoice key. |
| `set-picovoice-key` | settings | `string` | `{ success: boolean, message? }` | Sets Picovoice access key. |
| `validate-picovoice-key` | settings | `string` | `{ success: boolean, message? }` | Validates a Picovoice key. |
| `open-external-url` | all | `string` (url) | `{ success: boolean }` | Opens URL in default browser. |
| `minimize-window` | all | `void` | `{ success: boolean }` | Minimizes the sender window. |
| `maximize-window` | all | `void` | `{ success: boolean }` | Toggles maximization of sender. |
| `get-app-version` | settings | `void` | `{ version: string }` | Returns Electron app version. |
| `get-installed-apps` | settings, workflow | `void` | `string[]` | Scans OS for installed apps. |
| `get-cached-apps` | chat, workflow | `void` | `{ success: boolean, apps: string[] }` | Returns cached app list. |
| `refresh-app-cache` | settings | `void` | `{ success: boolean, count: number }` | Re-scans for apps. |
| `get-all-workflows` | settings, workflow | `void` | `Workflow[]` | Returns all saved workflows. |
| `save-workflow` | workflow | `Workflow` | `{ success: boolean, workflow? }` | Saves or updates a workflow. |
| `delete-workflow` | workflow | `string` (id) | `{ success: boolean }` | Deletes a workflow. |
| `toggle-workflow` | workflow | `{ id, enabled }` | `{ success: boolean }` | Toggles workflow enabled state. |
| `pick-item` | workflow | `string` (type) | `string \| null` | Opens OS file dialog to pick item. |
| `execute-workflow` | workflow | `string` (id) | `{ success: boolean }` | Runs a saved workflow. |
| `export-workflow` | workflow | `string` (id) | `{ success: boolean }` | Exports workflow to JSON file. |
| `import-skill` | chat, settings | `void` | `{ success: boolean, count: number }` | Imports skill files via dialog. |
| `upload-skill-folder` | settings | `void` | `{ success: boolean, count: number }` | Imports directory of skills. |
| `delete-skill` | settings | `string` (name) | `{ success: boolean }` | Deletes a learned behavior. |
| `update-skill` | settings | `SkillUpdate` | `{ success: boolean, error? }` | Updates a learned behavior. |
| `import-workflow` | settings | `void` | `{ success: boolean, count: number }` | Imports workflow from JSON file. |
| `set-window-visibility` | settings | `boolean` | `{ success: boolean }` | Toggles visibility protection. |
| `logout` | settings | `void` | `{ success: boolean }` | Logs out and resets state. |
| `new-conversation` | chat | `void` | `{ success: boolean }` | Resets current chat context. |
| `lock-app` | settings | `void` | `{ success: boolean }` | Locks app and shows PIN entry. |
| `is-app-locked` | chat | `void` | `boolean` | Checks if app is currently locked. |
| `read-behaviors` | chat | `void` | `LearnedBehavior[]` | Reads all skills/behaviors. |
| `unlock-app` | main | `string` (pin) | `{ success: boolean }` | Unlocks app with PIN. |
| `set-wakeword-enabled` | chat | `boolean` | `boolean` | Toggles active wakeword listening. |
| `set-auto-start` | settings | `boolean` | `{ success: boolean }` | Toggles launch on startup. |
| `execute-task` | chat, lite | `TaskPayload` | `TaskResult` | Primary AI execution entry point. |
| `stop-task` | chat, lite | `void` | `void` | Stops current AI execution. |
| `stop-action` | chat, lite | `void` | `void` | Same as stop-task (often hotkey). |
| `show-ghost-cursor` | chat | `void` | `{ success: boolean }` | Shows the ghost cursor overlay. |
| `hide-ghost-cursor` | chat | `void` | `{ success: boolean }` | Hides the ghost cursor overlay. |
| `update-ghost-cursor` | chat | `GhostCursorData` | `{ success: boolean }` | Updates cursor pos/text/mode. |
| `init-ghost-cursor-settings` | ghost-cursor | `void` | `{ success: boolean }` | Triggers setting broadcast to overlay. |
| `confirm-action` | chat, overlay | `boolean` | `{ success: boolean }` | Responds to AI confirmation request. |
| `tts-stop` | chat, settings | `void` | `{ success: boolean }` | Stops active speech. |
| `stop-audio` | chat | `void` | `{ success: boolean }` | Same as tts-stop. |
| `tts-get-voices` | settings | `void` | `{ success: boolean, voices: Voice[] }` | Returns available TTS voices. |
| `tts-set-voice` | settings | `string` | `{ success: boolean }` | Sets active TTS voice. |
| `tts-set-rate` | settings | `number` | `{ success: boolean }` | Sets TTS speech rate. |
| `tts-set-volume` | settings | `number` | `{ success: boolean }` | Sets TTS volume. |
| `tts-test-voice` | settings | `VoiceSettings` | `{ success: boolean }` | Plays sample TTS audio. |
| `should-speak-greeting` | chat | `void` | `{ shouldSpeak: boolean }` | Checks if greeting is enabled. |
| `speak-greeting` | chat | `string` | `{ success: boolean }` | Speaks provided greeting text. |
| `get-settings` | all | `void` | `AppSettings` | Returns full app settings. |
| `save-settings` | all | `Partial<AppSettings>` | `{ success: boolean }` | Updates app settings. |
| `update-hotkeys` | settings | `Hotkeys` | `{ success: boolean }` | Updates registered hotkeys. |
| `update-floating-button` | settings | `boolean` | `{ success: boolean }` | Toggles floating button visibility. |
| `open-website` | settings | `void` | `{ success: boolean }` | Opens product website. |
| `quit-app` | settings | `void` | `{ success: boolean }` | Terminates application. |
| `restart-app` | settings | `void` | `{ success: boolean }` | Relaunches application. |
| `delete-all-data` | settings | `void` | `{ success: boolean }` | Wipes local and user data. |
| `export-data` | settings | `void` | `{ success: boolean, data? }` | Exports settings/workflows to JSON. |
| `browser-navigate` | chat | `string` (url) | `{ success: boolean }` | Navigates agentic browser. |
| `browser-execute-js` | chat | `string` (script) | `{ success: boolean, result? }` | Runs JS in agentic browser. |
| `browser-get-status` | chat | `void` | `BrowserStatus` | Returns browser state/URL. |
| `browser-close` | chat | `void` | `{ success: boolean }` | Closes agentic browser. |
| `set-modal-active` | all | `boolean` | `{ success: boolean }` | Informs main that a modal is open. |
| `show-confirm-modal` | all | `ConfirmOptions` | `boolean` | Shows OS-native confirm dialog. |
| `get-tool-schemas` | chat | `void` | `{ success: boolean, schemas }` | Returns available AI tool schemas. |
| `get-tool-names` | chat | `void` | `{ success: boolean, tools }` | Returns list of tool names. |
| `execute-tool` | chat | `{ name, params }` | `any` | Directly executes a native tool. |
| `validate-tool-params` | chat | `{ name, params }` | `{ valid: boolean }` | Validates params against schema. |
| `get-remote-pairing-code` | settings | `string` (name) | `{ code: string }` | Generates remote access code. |
| `toggle-remote-access` | settings | `boolean` | `{ success: boolean }` | Enables/disables remote control. |
| `get-remote-status` | settings | `void` | `RemoteStatus` | Returns remote connectivity state. |

## 2. Main to Renderer (Events)
| Channel | Target Windows | Payload Type | Description |
|---------|----------------|--------------|-------------|
| `ai-response` | chat, lite | `{ text: string, ... }` | Full final response from AI. |
| `ai-stream` | chat, lite | `{ text: string, ... }` | Streaming chunks from AI. |
| `transcription-result` | chat | `{ text: string }` | Voice-to-text result. |
| `action-start` | chat, overlay | `Action` | AI initiated a tool use. |
| `action-step` | chat | `Step` | Individual step within action. |
| `action-complete` | chat | `Result` | AI tool use finished. |
| `task-start` | chat | `Task` | High-level task started. |
| `task-complete` | chat | `void` | Task execution finished. |
| `task-stopped` | chat | `void` | Task manually stopped. |
| `backend-error` | chat | `string` | General backend error message. |
| `wakeword-error` | chat | `string` | Error in Picovoice/Vosk. |
| `after-message` | chat | `{ text: string }` | Post-action commentary. |
| `plan-update` | chat | `Plan` | Updated AI execution plan. |
| `request-confirmation` | chat | `Confirmation` | AI needs user permission. |
| `audio-started` | chat | `void` | TTS has started speaking. |
| `audio-stopped` | chat | `{ queueEmpty?, manualStop? }` | TTS has stopped. |
| `wakeword-detected` | chat | `{ openedChat: boolean }` | Triggered by "Hey Control". |
| `settings-updated` | all | `AppSettings` | Broadcast when any setting changes. |
| `user-data-updated` | all | `UserInfo` | Broadcast when user profile changes. |
| `user-changed` | all | `UserInfo` | Same as user-data-updated. |
| `skills-updated` | settings, chat | `void` | Broadcast when behaviors change. |
| `app-initialized` | chat | `void` | Sent when main is fully ready. |
| `workflow-started` | chat | `{ name: string }` | Sent when a workflow begins run. |
| `click-step-start` | chat | `void` | Mouse movement starting. |
| `click-step-complete` | chat | `void` | Mouse movement/click finished. |
| `click-task-complete` | chat | `void` | Full click sequence finished. |
| `ghost-cursor:start-idle` | ghost-cursor | `void` | Cursor idle animation. |
| `ghost-cursor:init-settings` | ghost-cursor | `GhostCursorSettings` | Initial settings for overlay. |
| `ghost-cursor:mouse-move` | ghost-cursor | `{ x, y }` | Real mouse position for tracking. |
| `ghost-cursor:move` | ghost-cursor | `{ x, y }` | Target AI cursor move. |
| `ghost-cursor:update-text` | ghost-cursor | `{ text }` | Text bubble for cursor. |
| `ghost-cursor:set-guiding` | ghost-cursor | `{ guiding }` | Toggles guiding visual state. |
| `hide-floating-button` | overlay | `void` | Hides the UI floating bubble. |
| `show-floating-button` | overlay | `void` | Shows the UI floating bubble. |
| `interaction-mode-changed` | overlay | `{ interactive: boolean }` | Toggles click-through. |
| `show-visual-effect` | overlay | `{ type: string }` | Triggers edge glow/streak. |
| `request-pin-and-toggle` | overlay | `void` | Security requirement signal. |

## 3. Renderer to Main (Events/Sync)
| Channel | Origin Windows | Payload Type | Description |
|---------|----------------|--------------|-------------|
| `close-settings` | settings | `void` | Requests close from UI. |
| `window-drag` | all | `{ deltaX, deltaY }` | Manual window movement. |
| `overlay-hover` | overlay | `boolean` | Toggles interactivity on hover. |
| `overlay-focus` | overlay | `void` | Requests focus for main window. |
| `ghost-cursor:step-completed` | ghost-cursor | `void` | Signal from overlay to manager. |
| `log-to-terminal` | all | `string` | Debug logging to console. |
| `register-devtools-window` | all | `void` | Links devtools for manager logs. |
