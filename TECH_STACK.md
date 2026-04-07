# Controlrebuildv3 - Complete Tech Stack Document

---

## 1. DESKTOP APPLICATION (Electron)

### Framework & Runtime
- **Electron v28.0.0** — Cross-platform desktop app framework (Chromium + Node.js)
- **Node.js** — JavaScript runtime for main/preload processes
- **CommonJS module system** (`"type": "commonjs"`)

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@computer-use/nut-js` | ^4.2.0 | Cross-platform GUI automation (keyboard/mouse/screen control) |
| `@google/generative-ai` | ^0.24.1 | Google Gemini AI model integration for chat/agent responses |
| `openai` | ^4.104.0 | OpenAI API client for LLM interactions |
| `@supabase/supabase-js` | ^2.49.1 | Supabase client for auth, database, and real-time features |
| `@picovoice/porcupine-node` | ^4.0.1 | Wake word detection (hotword triggering) |
| `@picovoice/pvrecorder-node` | ^1.2.8 | Audio recording for wake word detection |
| `playwright` | ^1.58.2 | Browser automation and web scraping |
| `python-shell` | ^5.0.0 | Spawning and managing Python processes from Node.js |
| `ws` | ^8.20.0 | WebSocket client/server for real-time communication |
| `screenshot-desktop` | ^1.15.3 | Cross-platform screenshot capture |
| `jimp` | ^0.22.12 | Image processing/manipulation in pure JavaScript |
| `node-global-key-listener` | ^0.1.1 | Global keyboard shortcut listening |
| `say` | ^0.16.0 | Text-to-speech (native OS TTS) |
| `marked` | ^17.0.1 | Markdown parsing and rendering |
| `lucide-react` | ^0.562.0 | Icon library |
| `flutterwave-react-v3` | ^1.3.3 | Payment processing (Flutterwave) |
| `fs-extra` | ^11.1.1 | Extended file system operations |
| `dotenv` | ^17.2.3 | Environment variable loading |
| `electron-is-dev` | ^2.0.0 | Development vs production detection |
| `uuid` | ^11.0.0 | Unique ID generation |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `electron-builder` | ^24.0.0 | Packaging and distribution (NSIS, DMG, AppImage, deb) |
| `electron-rebuild` | ^3.1.5 | Native module rebuilding for Electron |
| `cross-env` | ^7.0.3 | Cross-platform environment variable setting |
| `@playwright/test` | ^1.58.2 | End-to-end testing framework |

### Build Targets
- **Windows**: NSIS installer + Portable (x64)
- **macOS**: DMG (x64 + arm64) with hardened runtime
- **Linux**: AppImage + deb (x64)

### Architecture
- **Main Process**: `src/main/main.js` — App lifecycle, window management, IPC
- **Preload Scripts**: `src/preload/` — Secure context bridge (6 preload scripts)
- **Renderer Process**: `src/renderer/` — HTML/JS UI windows (chat, settings, workflow, lite, overlay)

---

## 2. WEB APPLICATION (control_web — Next.js)

### Framework
- **Next.js 14.2.3** — React framework with App Router
- **React 18** — UI library
- **TypeScript 5** — Type-safe development
- **ES5 target** with ESNext modules

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.3 | React framework (App Router, SSR, API routes) |
| `react` / `react-dom` | ^18 | UI rendering |
| `@supabase/supabase-js` | ^2.43.2 | Supabase client |
| `@supabase/ssr` | ^0.3.0 | Supabase server-side rendering utilities |
| `@novnc/novnc` | ^1.5.0 | VNC client for remote desktop streaming |
| `framer-motion` | ^12.36.0 | Animation library |
| `recharts` | ^3.8.1 | Charting/data visualization |
| `react-markdown` | ^10.1.0 | Markdown rendering in React |
| `remark-gfm` | ^4.0.1 | GitHub-flavored markdown support |
| `lucide-react` | ^0.378.0 | Icon components |
| `zustand` | ^4.5.7 | Lightweight state management |
| `sonner` | ^2.0.7 | Toast notifications |
| `next-themes` | ^0.4.6 | Dark/light theme management |
| `tailwind-merge` | ^2.3.0 | Tailwind CSS class merging |
| `clsx` | ^2.1.1 | Conditional CSS class utility |
| `flutterwave-react-v3` | ^1.3.3 | Payment processing |
| `@tailwindcss/typography` | ^0.5.19 | Prose typography plugin |
| `autoprefixer` | ^10.4.27 | CSS autoprefixing |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | TypeScript compiler |
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework |
| `postcss` | ^8 | CSS processing |
| `eslint` / `eslint-config-next` | ^8 | Linting |
| `@types/node` / `@types/react` / `@types/react-dom` | ^18/^20 | Type definitions |

### Styling
- **Tailwind CSS v3.4.1** — Utility-first CSS with custom theme
- **Custom fonts**: Roboto (sans-serif), Walter Turncoat (cursive), custom landing fonts
- **CSS Variables** for theming (dark mode support via `darkMode: ["class"]`)
- **PostCSS** for CSS processing

### Configuration
- **Path aliases**: `@/*` → root
- **Image optimization**: Remote patterns from `images.pexels.com`
- **API rewrites**: `/api/*` → backend at `http://20.164.16.171:8000`
- **Webpack**: Top-level await enabled, `@novnc/novnc` transpiled

---

## 3. BACKEND API (control_web/backend — FastAPI)

### Framework
- **FastAPI 0.111.0** — Modern Python web framework
- **Uvicorn 0.29.0** (standard) — ASGI server
- **Python 3.x** (async)

### Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.111.0 | Web API framework |
| `uvicorn[standard]` | 0.29.0 | ASGI server with hot reload |
| `docker` | 7.1.0 | Docker SDK for Python (VM management) |
| `supabase` | 2.4.6 | Supabase Python client |
| `httpx` | 0.27.2 | Async HTTP client |
| `google-generativeai` | 0.5.4 | Google Gemini AI integration |
| `python-dotenv` | 1.0.1 | Environment variable loading |
| `websockets` | 12.0 | WebSocket support |
| `Pillow` | 10.3.0 | Image processing |
| `python-multipart` | 0.0.9 | Form/file upload parsing |
| `pydantic` | 2.7.1 | Data validation and serialization |
| `aiohttp` | 3.9.5 | Async HTTP client |
| `beautifulsoup4` | 4.12.3 | HTML parsing/scraping |

### API Routes
- VM management (`vm_routes`)
- Chat (`chat_routes`)
- Desktop pairing (`pair_routes`)
- Secrets management (`secret_routes`)
- Payments (`payment_routes`)
- Workflows (`workflow_routes`)
- Remote relay (`remote_relay`)

---

- Billing metrics: A dedicated billing_metrics table is used to store per-request usage data (user_id, mode: 'ask'|'act', tokens, created_at, and optional session_id). This enables reliable billing dashboards and time-series metrics independent from other user data.

## 4. PYTHON COMPONENTS (Desktop App)

### Vosk Speech Recognition Server
- **File**: `vosk_server_v2.py`
- **vosk** >= 0.3.42 — Offline speech recognition engine
- **websockets** >= 10.0 — WebSocket server for audio streaming
- **edge-tts** >= 6.1.0 — Microsoft Edge text-to-speech

### Desktop App Python Dependencies (requirements.txt)
| Package | Version | Purpose |
|---------|---------|---------|
| `python-dotenv` | >= 1.0.0 | Environment variables |
| `vosk` | >= 0.3.42 | Offline speech-to-text |
| `pyaudio` | >= 0.2.13 | Audio input capture |
| `websockets` | >= 10.0 | WebSocket communication |
| `pillow` | >= 9.0.0 | Image processing |
| `mss` | >= 6.1.0 | Fast cross-platform screenshots |
| `pyautogui` | >= 0.9.53 | GUI automation (mouse/keyboard) |
| `google-generativeai` | >= 0.3.0 | Google Gemini AI |
| `pvporcupine` | >= 2.2.0 | Wake word detection |
| `edge-tts` | >= 6.1.0 | Text-to-speech |
| `pyperclip` | >= 1.8.2 | Clipboard operations |
| `pyinstaller` | >= 5.0.0 | Python binary packaging |
| `aiohttp` | >= 3.8.0 | Async HTTP |
| `requests` | >= 2.28.0 | HTTP requests |

---

## 5. VM AGENT (control_web/vm — Linux Desktop VM)

### Runtime
- **Python** (async) — `ai_agent.py` WebSocket server on port 8080
- **Linux with XFCE** desktop environment (implied by `xfce4-terminal`, `thunar`)
- **X11** display server (`DISPLAY=:1`)

### Dependencies
| Package | Purpose |
|---------|---------|
| `pyautogui` | GUI automation (mouse/keyboard/screen) |
| `websockets` | WebSocket server for command reception |
| `Pillow (PIL)` | Screenshot capture and JPEG compression |
| `pytesseract` | OCR (optional) |
| `xdotool` | X11 keyboard/mouse simulation (via subprocess) |
| `wmctrl` | X11 window management (via subprocess) |

### Browser
- **Firefox** — Default browser for automation

### Tools
- **xfce4-terminal** — Terminal emulator
- **thunar** — File manager
- **micro** — Text/code editor

### Capabilities
- Screenshot capture (JPEG compressed, base64 encoded)
- Mouse: click, double-click, right-click, move, drag, scroll
- Keyboard: type, key press, key combos
- Browser: navigate, find content, tab management
- Terminal: execute commands, read output
- File operations: read, write, edit, append, delete, zip, download
- Window management: list, switch, arrange, close, minimize, maximize, move
- OCR: text extraction from screenshots
- App launching: code editor, file manager, terminal, browser

---

## 6. DATABASE & AUTHENTICATION

### Supabase
- **PostgreSQL** database (via Supabase)
- **Supabase Auth** — User authentication (login/signup)
- **Supabase Realtime** — Real-time data subscriptions
- **Supabase URL**: `https://gdvitudsmqktiutyyndv.supabase.co`

### Schema Files
- `supabase_schema.sql` — Main database schema
- `control_web/schema_*.sql` — Additional schemas (workflows, VM agents, mode additions)

---

## 7. INFRASTRUCTURE & DEVOPS

### Containerization
- **Docker** — Container runtime
- **Docker Compose v3.8** — Multi-service orchestration

### Services (docker-compose.yml)
| Service | Image | Purpose |
|---------|-------|---------|
| `caddy` | caddy:2-alpine | Reverse proxy with automatic HTTPS (Let's Encrypt) |
| `backend` | Custom (FastAPI) | API server on port 8000 |
| `vm-base-image` | control-vm | Base VM image builder |

### Reverse Proxy
- **Caddy v2** — Automatic TLS, reverse proxy to backend
- **Domain**: `control.southafricanorth.cloudapp.azure.com`
- **Azure Cloud** — Hosted on Azure (southafricanorth region)

### VM Deployment
- **Azure VM** — `20.164.16.171`
- **Docker socket mounting** — Backend controls Docker on host for dynamic VM creation

---

## 8. PAYMENT PROCESSING

- **Flutterwave** — Payment gateway (react library v1.3.3)
- Integrated in both Electron app and Next.js web app

---

## 9. AI/ML INTEGRATIONS

| Service | SDK | Purpose |
|---------|-----|---------|
| **Google Gemini** | `@google/generative-ai` (JS), `google-generativeai` (Python) | Primary AI model for chat and agent responses |
| **OpenAI** | `openai` (JS SDK v4.104.0) | Alternative LLM provider |

---

## 10. VOICE & AUDIO

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Wake Word** | Picovoice Porcupine v4.0.1 | Hotword detection |
| **Audio Capture** | Picovoice PVRecorder v1.2.8, PyAudio | Microphone input |
| **Speech-to-Text** | Vosk v0.3.42 | Offline speech recognition |
| **Text-to-Speech** | Edge-TTS v6.1.0, `say` (native OS) | Voice output |

---

## 11. TESTING

| Tool | Purpose |
|------|---------|
| **Playwright** ^1.58.2 | E2E testing and browser automation |
| **@playwright/test** | Test runner |

---

## 12. STATIC WEBSITE (website/)

- **Vanilla HTML/CSS/JavaScript** — No framework
- **Supabase JS SDK** (CDN) — Client-side auth and database
- **Custom CSS** — Responsive design with gradients and glassmorphism

---

## 13. SCRIPTS & UTILITIES

| Script | Language | Purpose |
|--------|----------|---------|
| `generate_flowcharts.py` | Python | Flowchart generation |
| `set-gemini-model.js` | Node.js | Gemini model configuration |
| `upload-keys.js` | Node.js | Key upload utility |
| `generate_icons.py` | Python | App icon generation |

---

## 14. SUMMARY BY LAYER

| Layer | Technology |
|-------|------------|
| **Desktop Shell** | Electron 28 + Node.js (CommonJS) |
| **Desktop UI** | Vanilla HTML/CSS/JS (no framework) |
| **Web Frontend** | Next.js 14 + React 18 + TypeScript + Tailwind CSS |
| **Web Backend API** | FastAPI (Python) + Uvicorn |
| **VM Agent** | Python async + WebSocket server |
| **Database** | PostgreSQL (via Supabase) |
| **AI Models** | Google Gemini + OpenAI |
| **Voice** | Vosk (STT) + Edge-TTS (TTS) + Porcupine (wake word) |
| **Automation** | nut-js (desktop) + pyautogui (Python) + Playwright (browser) |
| **Payments** | Flutterwave |
| **Infrastructure** | Docker + Docker Compose + Caddy + Azure VM |
| **CI/CD** | electron-builder (NSIS/DMG/AppImage/deb) + PyInstaller |
| **Testing** | Playwright |
