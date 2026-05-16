# Phase 1 Map — Control AI

## 1. Electron Windows
| Name | HTML File | Purpose | Frameless |
|------|-----------|---------|-----------|
| main (overlay) | `src/renderer/main-overlay.html` | Always-on-top click-through overlay for visual effects and floating button. | Yes |
| chat | `src/renderer/chat-window.html` | Primary interaction sidebar for AI chat. | Yes |
| settings | `src/renderer/settings-modal.html` | App settings and account management. | Yes |
| workflow | `src/renderer/workflow-window.html` | Visual workflow editor. | Yes |
| lite | `src/renderer/lite-window.html` | Minimalist floating bar version of chat. | Yes |
| entry | `src/renderer/entry-window.html` | Login/Authentication screen. | Yes |
| ghostCursor | `src/renderer/ghost-cursor-overlay.html` | Overlay for visualizing remote/AI cursor movements. | Yes |

## 2. IPC Channels
### Main to Renderer (Broadcast/Send)
- `ai-response`
- `ai-stream`
- `transcription-result`
- `action-start`
- `action-step`
- `action-complete`
- `task-start`
- `task-complete`
- `task-stopped`
- `backend-error`
- `wakeword-error`
- `after-message`
- `plan-update`
- `request-confirmation`
- `audio-started`
- `audio-stopped`
- `wakeword-detected`
- `settings-updated`
- `user-data-updated`
- `user-changed`
- `skills-updated`
- `app-initialized`
- `workflow-started`
- `click-step-start`
- `click-step-complete`
- `click-task-complete`
- `ghost-cursor:start-idle`
- `ghost-cursor:init-settings`
- `ghost-cursor:mouse-move`
- `ghost-cursor:move`
- `ghost-cursor:update-text`
- `ghost-cursor:set-guiding`
- `hide-floating-button`
- `show-floating-button`
- `hide-floating-button-if-enabled`
- `interaction-mode-changed`
- `show-visual-effect`

### Renderer to Main (Invoke/Handle)
- `execute-task`
- `stop-task`
- `stop-action`
- `confirm-action`
- `stop-audio`
- `transcribe-audio`
- `set-wakeword-enabled`
- `close-window`
- `hide-window`
- `show-window`
- `should-speak-greeting`
- `speak-greeting`
- `import-skill`
- `is-app-locked`
- `read-behaviors`
- `get-settings`
- `save-settings`
- `show-ghost-cursor`
- `hide-ghost-cursor`
- `update-ghost-cursor`
- `toggle-chat`
- `verify-pin`
- `enable-security-pin`
- `set-security-pin`
- `change-pin`
- `login-with-email`
- `authenticate-user`
- `get-user-info`
- `verify-entry-id`
- `get-picovoice-key`
- `set-picovoice-key`
- `validate-picovoice-key`
- `open-external-url`
- `minimize-window`
- `maximize-window`
- `get-app-version`
- `get-installed-apps`
- `get-cached-apps`
- `refresh-app-cache`
- `get-all-workflows`
- `save-workflow`
- `delete-workflow`
- `toggle-workflow`
- `pick-item`
- `execute-workflow`
- `export-workflow`
- `upload-skill-folder`
- `delete-skill`
- `update-skill`
- `import-workflow`
- `set-window-visibility`
- `logout`
- `new-conversation`
- `lock-app`
- `unlock-app`
- `set-auto-start`
- `init-ghost-cursor-settings`
- `tts-stop`
- `tts-get-voices`
- `tts-set-voice`
- `tts-set-rate`
- `tts-set-volume`
- `tts-test-voice`
- `update-hotkeys`
- `update-floating-button`
- `open-website`
- `quit-app`
- `restart-app`
- `delete-all-data`
- `export-data`
- `browser-navigate`
- `browser-execute-js`
- `browser-get-status`
- `browser-close`
- `set-modal-active`
- `show-confirm-modal`
- `show-prompt-modal`
- `get-tool-schemas`
- `get-tool-names`
- `execute-tool`
- `validate-tool-params`
- `get-remote-pairing-code` (Handle)
- `toggle-remote-access` (Handle)
- `get-remote-status` (Handle)

### Renderer to Main (On/Send)
- `close-settings`
- `window-drag`
- `overlay-hover`
- `overlay-focus`
- `ghost-cursor:step-completed`
- `log-to-terminal`
- `register-devtools-window`

## 3. npm Dependency Audit
### (a) Backend / Main-Process Only
- `@computer-use/nut-js`
- `@google/generative-ai`
- `@picovoice/porcupine-node`
- `@picovoice/pvrecorder-node`
- `dotenv`
- `electron-is-dev`
- `fs-extra`
- `imagescript`
- `jimp`
- `node-global-key-listener`
- `openai`
- `playwright`
- `python-shell`
- `say`
- `screenshot-desktop`
- `sharp`
- `ws`

### (b) Renderer / UI Only
- `flutterwave-react-v3` (Currently in `dependencies`, likely for web/future use or misplaced)
- `lucide-react` (Currently in `dependencies`, used in some JS files?)
- `marked` (In `js/lib/marked.min.js` and npm)

### (c) Shared
- `@supabase/supabase-js`
- `uuid`

## 4. Asset Files
### Icons
- `assets/icons/*` (Various .ico, .icns, .png files)

### Wakeword Models (.ppn)
- `src/renderer/assets/wakeword/hey-control_en_windows_v4_0_0.ppn`
- `assets/wakeword/hey-control_en_mac_v4_0_0.ppn`
- `assets/wakeword/hey-control_en_linux_v4_0_0.ppn`
- `assets/wakeword/hey-control_en_windows_v4_0_0.ppn`

### Fonts
- No local font files found. Fonts are currently loaded via Google Fonts (Inter, JetBrains Mono).

### Audio
- No local audio files found.

## 5. UI Libraries & DOM Manipulation
### Libraries (npm)
- `marked` (Markdown parsing)

### Libraries (CDN/Local Scripts)
- `Font Awesome 6.4.0` (Icons - loaded via CDN in multiple HTML files)
- `Google Fonts` (Inter, JetBrains Mono)
- `marked.min.js` (Local script in `src/renderer/js/lib/`)

### DOM Manipulation
- Standard vanilla JS `document.getElementById`, `querySelector`, `classList`, etc., used extensively in all renderer `.js` files.
- Custom modal logic, sidebar toggling, and message rendering are all manual DOM operations.

## 6. Observations & Ambiguities
- **Supabase Auth**: Auth state seems to be managed in `supabase-service.js` (Main process) and broadcast to windows.
- **Dynamic Channels**: Some channels might be constructed for specific tool executions, but standard `execute-tool` and `action-*` channels seem to cover most cases.
- **Shared Code**: `src/main/app-utils.js` and `src/main/storage-manager.js` seem to be central for state and utility.
