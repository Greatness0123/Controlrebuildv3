# Phase 1 Complete — Control AI

## 1. Files Created
- `/docs/phase1-map.md`: Initial project mapping and audit.
- `/control-react/package.json`: New configuration for React + Vite + Electron.
- `/control-react/vite.config.ts`: Vite build configuration.
- `/control-react/tsconfig.json`: TypeScript compiler configuration.
- `/control-react/tsconfig.node.json`: TypeScript configuration for Node environments.
- `/control-react/src/styles/globals.css`: Global design system tokens and resets.
- `/control-react/electron/`: Contains all migrated backend files.
- `/control-react/src/windows/`: Subdirectories for each of the 7 window shells (chat, entry, settings, overlay, ghost-cursor, lite, workflow).
- Each window shell contains:
    - `index.html`: Entry point.
    - `main.tsx`: React DOM mounting.
    - `App.tsx`: Placeholder component.

## 2. Assets Migrated
- **Icons**: All files from `assets/icons/` copied to `/control-react/assets/icons/`.
- **Wakeword Models**: `.ppn` files from `assets/wakeword/` and `src/renderer/assets/wakeword/` copied to `/control-react/assets/wakeword/`.
- **Note**: No local font or audio files were found in the original repo; these were omitted.

## 3. Dependency Summary
- **Preserved Backend**: `@nut-tree/nut-js`, `@google/generative-ai`, `@picovoice/porcupine-node`, `@picovoice/pvrecorder-node`, `@supabase/supabase-js`, `dotenv`, `fs-extra`, `imagescript`, `jimp`, `node-global-key-listener`, `openai`, `playwright`, `python-shell`, `say`, `screenshot-desktop`, `sharp`, `ws`.
- **New Frontend**: `react`, `react-dom`, `zustand`, `react-markdown`, `remark-gfm`, `highlight.js`, `rehype-highlight`, `lucide-react`, `clsx`, `framer-motion`.
- **Removed Renderer Dependencies**: Direct DOM manipulation libraries (standard browser APIs were used instead of jQuery or similar). `marked` was replaced with the npm version + `react-markdown`.

## 4. IPC Channel Index
A total of 37 broadcast channels (Main to Renderer) and over 80 handle/on channels (Renderer to Main) were indexed in `docs/phase1-map.md`.

## 5. Electron Window Index
| Name | Purpose | Frameless |
|------|-----------|-----------|
| overlay | Click-through visual effects and floating button. | Yes |
| chat | Primary AI chat interaction sidebar. | Yes |
| settings | App and account management. | Yes |
| workflow | Visual workflow editor. | Yes |
| lite | Minimalist floating chat bar. | Yes |
| entry | Authentication and login. | Yes |
| ghost-cursor | Visualization of remote/AI cursor movements. | Yes |

## 6. Verification
- [x] Zero files in `src/main/` were modified.
- [x] Zero `.py` files were touched.
- [x] `/control-react/` structure matches the requested scaffold.
- [x] All 7 window shells are created and functional (as shells).

## 7. Assumptions & Questions
- **Overlay Window**: Confirmed that `main-overlay.html` corresponds to the `overlay` window in the new structure.
- **Fonts/Audio**: No local files were found; fonts are currently CDN-driven. These will be properly handled in the React build (Step 6/7 of Phase 1 ensured variables are ready).
- **Managers**: All manager files in `src/main/` were copied to `/control-react/electron/` as requested.
