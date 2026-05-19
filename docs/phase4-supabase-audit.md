# Phase 4 Supabase Audit

## Overview
This document audits every Supabase interaction within the migrated codebase. Control uses Supabase for user authentication, profile management, global configuration, and real-time device signaling.

## Supabase Call Registry

| Table / RPC | Operation | Called From | Trigger | Data Affected | IPC Broadcast | UI State Impact |
|-------------|-----------|-------------|---------|---------------|---------------|-----------------|
| `users` | `select` | `verifyEntryID` | App Start / Auth | User profile, plan, counts | `user-changed` | Populates `chatStore` user data |
| `users` | `update` | `incrementTaskCount` | Action Completion | `act_count` or `ask_count` | `settings-updated` | Updates rate limit display |
| `users` | `update` | `updateTokenUsage` | AI Response | `total_token_usage`, `daily_token_usage` | `settings-updated` | Updates billing/usage UI |
| `users` | `update` | `updateUserSettings` | Settings Save | `ai_settings`, `app_settings` | `settings-updated` | Updates app-wide behavior |
| `auth` | `signIn` | `login` | Login Form Submit | Auth session, access token | `user-changed` | Redirects to Chat from Entry |
| `app_config`| `select` | `fetchAndCacheKeys` | App Start | Global API keys, model lists | None (Main only) | Gathers backend dependencies |
| `paired_devices` | `insert` | `generatePairingCode` | Pair Device UI | New device record, pairing code | None | Shows code to user |
| `paired_devices` | `update` | `updateDeviceStatus` | Heartbeat / Revoke | Device status, `last_seen` | `settings-updated` | Updates machine status list |
| `workflows` | `select` | `workflow-manager.js` | App Start | Stored user workflows | None (Main only) | Populates workflow list |

## Direct Call Policy
**Confirmed**: The React renderer processes never call Supabase directly. All database logic is strictly confined to `control-react/electron/supabase-service.js`.

## Data Flow Pattern
1. React component triggers an action (e.g., Save Settings).
2. Renderer sends IPC request to Main process.
3. Main process calls `supabase-service.js`.
4. `supabase-service.js` performs the database operation and returns data to Main.
5. Main process updates its local state and broadcasts an IPC event (e.g., `settings-updated`) to all relevant windows.
6. React windows receive the broadcast and update their respective Zustand stores, triggering a UI re-render.

## Persistence
Authentication sessions are persisted in the user's local profile directory via a custom file-based storage provider implemented in the Supabase client initialization. This ensures users remain logged in even after the application is closed.
