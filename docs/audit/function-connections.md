# Function Connections & Data Flows - Control AI

This document details the logical wiring of the Control AI application, mapping how functions, events, and IPC channels connect across the Electron processes and the web platform.

---

## Significant Modules & Functions

### 1. `ComputerUseAgent` (Main Process)
- **File**: `src/main/main.js`
- **Function**: `init()`
- **Purpose**: Synchronizes all background services (Vosk, Wakeword, Backends) and ensures the user is authenticated before allowing interaction.
- **Calls (Outbound)**: `dbService.fetchAndCacheKeys()`, `this.backendManager.startBackend()`, `this.windowManager.initializeWindows()`.
- **Calls (Inbound)**: `app.whenReady()`.
- **Events**: Listens to `hotkey-triggered`, `wakeword-detected`.
- **IPC Channels**: Handles `login-with-email`, `get-user-info`, `execute-task`.
- **Side Effects**: Sets `process.env` variables, creates window instances, modifies local `cached_user.json`.

### 2. `BackendManager` (Main Process)
- **File**: `src/main/backend-manager-fixed.js`
- **Function**: `executeTask(task, mode)`
- **Purpose**: The primary gateway for starting any AI-driven work.
- **Calls (Outbound)**: `backend.processRequest()`, `this.broadcastToWindows()`.
- **Calls (Inbound)**: `ComputerUseAgent.setupIPCHandlers()` via `execute-task` channel.
- **Events**: Emits `ai-stream`, `ai-response`, `after-message`.
- **Side Effects**: Appends logs to `backend-manager.log`, triggers global visual effects (`task-active`), hides/shows the chat window.

### 3. `ActBackend` (Main Process)
- **File**: `src/main/backends/act-backend.js`
- **Function**: `processRequest(userRequest, attachments)`
- **Purpose**: Orchestrates the loop of vision analysis and OS execution.
- **Calls (Outbound)**: `this.takeScreenshot()`, `this.model.generateContentStream()`, `this.executeAction()`, `this.verifyAction()`.
- **Calls (Inbound)**: `BackendManager.executeTask()`.
- **Events**: Triggers `onEvent` callbacks (mapped to `action_start`, `task_complete`, etc.).
- **Side Effects**: Writes WEBP screenshots to `os.tmpdir()`, moves mouse cursor via `nut-js`, executes shell commands.

### 4. `ChatWindow` (Renderer Process)
- **File**: `src/renderer/chat-window.js`
- **Function**: `sendMessage()`
- **Purpose**: Captures user input and initiates the AI task pipeline.
- **Calls (Outbound)**: `window.chatAPI.executeTask()`, `this.addMessage()`, `this.updateStatus()`.
- **Calls (Inbound)**: DOM event listeners on `sendBtn` and `Enter` key.
- **Events**: Listens for `ai-stream`, `ai-response`, `action-start` via IPC.
- **IPC Channels**: Uses `execute-task`.
- **Side Effects**: Manipulates DOM to add message bubbles, modifies `localStorage` for session history, manages WebSocket connection to Vosk.

---

## Data Flow Narrative

### User Input → AI Processing → Response Rendering

1.  **Capture**: The user types a request (e.g., "Open Blender") into the `chatInput` in the **Renderer Process** and clicks Send.
2.  **IPC Bridge**: `ChatWindow.sendMessage()` calls the `executeTask` method exposed via the `chatAPI` preload bridge. This sends the request across the Electron **IPC Channel** `execute-task` to the **Main Process**.
3.  **Routing**: The `execute-task` handler in `main.js` receives the request, checks rate limits via `supabase-service.js`, and passes it to `BackendManager.executeTask()`.
4.  **Observation**: `BackendManager` selects `ActBackend`. The backend immediately calls `takeScreenshot()`, which hides all app windows, captures the primary display, resizes it to 540px width (WEBP), and restores the windows.
5.  **Reasoning**: The screenshot and user request are sent to the **Gemini 2.0 API**. `ActBackend` uses `generateContentStream()` to get a real-time response.
6.  **Streaming**: As Gemini streams text, `ActBackend` emits `ai_stream` events. `BackendManager` catches these and broadcasts them back to the **Renderer Process** via IPC. The UI updates the "Thinking..." bubble in real-time.
7.  **Execution**: Once the AI identifies an action (e.g., `terminal { "command": "start blender" }`), `ActBackend` calls `tool-executor.js`. The command is run via `child_process.exec`.
8.  **Verification**: After execution, `ActBackend` takes another screenshot and asks the AI to verify if Blender is actually open.
9.  **Completion**: `ActBackend` triggers `task_complete`. `BackendManager` broadcasts this to the renderer.
10. **Persistence**: `ChatWindow.js` receives the completion, finalizes the message bubble, and saves the updated conversation to `localStorage`.

---

## The Three Most Fragile Connection Points

### 1. Hardcoded WebSocket URL for Vosk (`ws://127.0.0.1:2700`)
- **Location**: `src/renderer/chat-window.js`
- **Why it's fragile**: If the local Vosk server fails to start (common due to port conflicts or missing Python paths), the UI provides no recovery mechanism. The hardcoded nature prevents the app from working in environments where 127.0.0.1 is restricted or where the server is hosted remotely. It lacks a handshake/retry logic, leading to silent failures in voice mode.

### 2. Manual Window Hiding/Showing for Screenshots
- **Location**: `src/main/backends/act-backend.js`
- **Why it's fragile**: The "hide all windows, wait 100ms, capture, show all windows" loop is highly susceptible to race conditions. If the OS is slow or a window is in the middle of an animation, the screenshot might capture the app itself (obfuscating the target) or fail to restore the windows, leaving the user with a "hidden" interface they can't recover.

### 3. IPC Message Serialization of File Data
- **Location**: `src/renderer/chat-window.js` -> `main.js`
- **Why it's fragile**: Large file attachments are converted to standard JS Arrays before being sent via IPC. This consumes massive amounts of memory and can crash the Electron bus for files > 10MB. There is no streaming of binary data; it relies on a single "megalithic" IPC call which frequently times out or causes the UI thread to freeze during the serialization process.
