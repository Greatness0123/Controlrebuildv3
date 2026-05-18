# Phase 2 Complete — Control AI

## 1. IPC Contract Summary
The master IPC contract is defined in `/control-react/src/types/ipc.ts`. It covers:
- **MainHandlers**: 78 typed channels that the Renderer can invoke or send to the Main process.
- **RendererEvents**: 44 typed events that the Main process can push to Renderer windows.

Key domains covered:
- Window Management
- Authentication & Security (including PIN lock)
- App Settings (full audit from `settings-manager.js`)
- AI Task Execution (Ask, Act, Click modes)
- Workflow Management
- Voice & Wakeword (Picovoice/Vosk/EdgeTTS)
- Agentic Browser
- Ghost Cursor Overlay

## 2. Preload Scripts
All 7 windows have been provided with typed preload scripts in `/control-react/electron/preload/`:
- `chat.ts`: Full suite of task, settings, and auth APIs.
- `entry.ts`: Auth-focused API for login and initialization.
- `settings.ts`: Comprehensive settings and data management API.
- `overlay.ts`: Visual effect and interaction control API.
- `ghost-cursor.ts`: Precise positioning and instruction API.
- `lite.ts`: Minimalist task execution and streaming API.
- `workflow.ts`: Full workflow CRUD and execution API.

Each script uses `contextBridge` and ensures every listener returns a cleanup function.

## 3. Zustand State Stores
Five stores were created in `/control-react/src/stores/` using `immer`, `persist`, and `devtools`:
- `authStore`: Manages `UserInfo` and authentication state.
- `settingsStore`: Persists full `AppSettings` (audited from `settings-manager.js`).
- `chatStore`: Manages sessions and messages. Persists session metadata and list; message arrays are kept in-memory (hybrid model).
- `overlayStore`: Manages overlay visibility, interaction mode, and visual actions.
- `workflowStore`: Persists the list of user workflows and execution state.

## 4. Shared Hooks
Five hooks were created in `/control-react/src/hooks/` to bridge IPC and Stores:
- `useTaskExecution`: Manages the lifecycle of an AI task, from optimistic user message to streaming assistant response and completion.
- `useAuth`: Syncs auth state and handles login/logout.
- `useSettings`: Provides debounced settings persistence to the main process.
- `useOverlay`: Manages visual signals and interaction modes for the overlay window.
- `useVoice`: Handles TTS playback and wakeword toggle state.

## 5. Discoveries & Normalization
- **UserInfo Shape**: Audited from `supabase-service.js`. Includes task counts, token usage, and plan details.
- **AppSettings Shape**: Audited from `settings-manager.js`. Added new fields like `edgeGlowEnabled`, `borderStreakEnabled`, and `ghostCursor` parameters.
- **Normalization**: Standardized return types for all `invoke` calls to consistently return `{ success: boolean, ... }` or specific data objects, avoiding raw boolean/null returns where possible.

## 6. Verification
- [x] `src/main/` was not modified.
- [x] No `.py` files were touched.
- [x] IPC Channel Inventory created in `/docs/phase2-ipc-channel-inventory.md`.
- [x] Typed contracts, preload scripts, stores, and hooks implemented.
