# Controlrebuildv3 ↔ open-computer-use integration audit (April 2026)

This document records what was reviewed, functional health estimates, and concrete changes made while aligning **control_web** (Next.js) and the **desktop app** (Electron) with patterns from **open-computer-use** (Coasty), without removing your real-time VM viewer (VNC) — that remains the primary remote display.

## Reference repository

- **Path:** `c:\Users\USER\Downloads\open-computer-use`
- **Role:** Architectural reference (Electron `MessageItem` / tool cards, FastAPI multi-agent patterns described in `CLAUDE.md`, Zustand chat store with tool invocations).

## Critical bug fixed: VM agent never received `machine_id`

| Area | File | Issue | Functional impact (before) | After |
|------|------|-------|-----------------------------|--------|
| Backend agent | `control_web/backend/app/services/agent_executor.py` | Session VM lookup used Supabase table **`vms`**; the app uses **`virtual_machines`**. `machine_id` was only set inside `if vm_res.data`, so a failed lookup left `machine_id` unset even when `session.vm_id` was valid. | **Act mode** could run with **no VM target**: screenshots and actions were no-ops; the model returned **plain text** instead of driving the VM. | **Fixed:** query `virtual_machines`, and always set `machine_id = session.vm_id` / `device_id = session.device_id` from the chat session. Early exit with a clear message if neither is assigned. |
| API route | `control_web/backend/app/routes/chat_routes.py` | `execute_task` was called with `req.vm_id` / `req.device_id`, which are **not** on `SendMessageRequest` (always `None`). | Redundant/confusing; masked the real bug above. | **Fixed:** rely on session rows in the executor only; removed invalid kwargs. |

**Estimated functionality before fix:** VM automation from the web app ~**0–20%** (depending on whether any code path accidentally set `machine_id`). **After fix:** targeting and VM websocket actions **functional** assuming `vm_control_service` is connected and the VM agent is reachable (same as open-computer-use-style prerequisites).

## Event streaming and UI

| Area | File | Change |
|------|------|--------|
| Web chat | `control_web/components/ChatPanel.tsx` | Map legacy `thinking` SSE events; **action log** rows styled like structured tool cards (running/done, expandable JSON params); **thought** blocks restyled for clearer “thought process” vs assistant reply. |
| Web chat | `control_web/lib/store.ts` | `ChatMessage` extended with optional `action_status: 'running' \| 'done'`. |
| Backend | `control_web/backend/app/services/agent_executor.py` | `thinking` events folded into **`thought`** where appropriate so the web UI shows a single reasoning stream; **Act mode** error if no VM/device assigned. |

## Ask / Act toggle

- **Kept:** The toggle remains **structurally useful**: it maps to `forced_mode` on `/api/chat/{id}/send` and overrides auto-detection in `agent_executor.py` (`forced_mode or _auto_detect_mode(...)`).
- **Recommendation:** In **Act** mode with a VM, the backend now **requires** a session-bound target; users should pick a VM/device in the chat header before automation.

## Prompts (web backend + desktop)

| Location | Update |
|----------|--------|
| `control_web/backend/app/services/agent_executor.py` | `ACT_SYSTEM_PROMPT`: removed the contradictory “greeting in plain text” clause that fought strict JSON in Act mode; added **CAD / Blender / DCC** guidance. `ASK_SYSTEM_PROMPT`: line on professional software. |
| `src/main/prompts/act-system-prompt.md` | New section for **CAD / 3D / creative** workflows. |
| `src/main/prompts/ask-system-prompt.md` | New section for **professional software** Q&A. |

## Remote desktop pipeline (vetting summary)

| Segment | Components | Notes |
|---------|------------|--------|
| Desktop → relay | `control_web/backend/app/routes/remote_relay.py`, `desktop_bridge.py`, Electron pairing | Actions use the relay path; **latency** depends on network and WebSocket health — code review did not show an obvious double-buffer bug; load testing recommended. |
| Web viewer | `control_web/components/VNCViewer.tsx`, `RemoteDesktopViewer.tsx`, `c/[chatId]/page.tsx` | **Real-time VNC** remains the main view (your deviation from screenshot-only UIs). Optional static “screenshot strip” beside VNC was **not** added to avoid duplicating large base64 frames over SSE when VNC already shows the desktop. |

## open-computer-use items not ported 1:1

- **CUA section renderer / tagged XML blocks** in `MessageItem.tsx` + `CuaSectionRenderer.tsx`: different product surface; your stack uses **JSON actions + thought + action log** instead.
- **Electron chat store tool invocations** mirror: partially reflected in **action log rows** on the web; desktop still uses IPC `action-start` / `action-complete` from `backend-manager-fixed.js`.

## Files touched in this pass

- `control_web/backend/app/services/agent_executor.py`
- `control_web/backend/app/routes/chat_routes.py`
- `control_web/components/ChatPanel.tsx`
- `control_web/lib/store.ts`
- `src/main/prompts/act-system-prompt.md`
- `src/main/prompts/ask-system-prompt.md`
- `INTEGRATION_AUDIT_2026.md` (this file)

## Suggested verification steps

1. Start a VM, attach it to a chat session, send an Act instruction (e.g. open terminal). Confirm **action** rows and **thought** updates in the web UI and visible changes on VNC.
2. Toggle **Ask** and ask a conceptual question; confirm **no** JSON action spam.
3. Desktop: run the same scenarios with Act/Ask and confirm local automation still behaves as before.

---

*Rates in this doc are engineering judgment from static analysis and architecture comparison, not automated test metrics.*
