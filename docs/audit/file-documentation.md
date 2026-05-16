# File Documentation - Control AI

This document provides a comprehensive map of **every file** in the Control AI repository, detailing their purpose, responsibilities, and technical dependencies.

---

## Project Root

### `.env`
- **Purpose**: Environment variable storage.
- **Responsibility**: Holds sensitive API keys (Gemini, OpenAI, Supabase) and configuration flags for local development.
- **Tech Stack**: Text/Key-Value.
- **Dependencies**: None.
- **Dependents**: `src/main/main.js`, `control_web/backend/app/config.py`.

### `APP_ARCHITECTURE.md`
- **Purpose**: High-level technical overview of the system architecture.
- **Responsibility**: Documents the interaction between Electron, Python backends, and Next.js.
- **Tech Stack**: Markdown.

### `AUDIO_CHUNK_EXPLANATION.md`
- **Purpose**: Documentation for audio processing.
- **Responsibility**: Explains how audio is chunked and streamed for the Vosk server.

### `AZURE_DEPLOYMENT_GUIDE.md`
- **Purpose**: Cloud deployment instructions.
- **Responsibility**: Guides developers on deploying the web platform to Azure.

### `BACKEND_INTERACTIONS.md`
- **Purpose**: API documentation.
- **Responsibility**: Describes the protocol between the Electron frontend and the Python/FastAPI backends.

### `BUILD_GUIDE.md`
- **Purpose**: Compilation instructions.
- **Responsibility**: Details how to package the Electron app for Mac, Windows, and Linux.

### `CHANGELOG_CONTROL.md`
- **Purpose**: Version history.
- **Responsibility**: Records all changes and bug fixes in chronological order.

### `CONVERSION_REPORT.md`
- **Purpose**: Migration tracking.
- **Responsibility**: Documents the transition from early prototypes to the current V3 architecture.

### `DOCKER_EXPLAINER.md`
- **Purpose**: Infrastructure documentation.
- **Responsibility**: Explains the Docker-based VM provisioning system.

### `DOCKER_GUIDE.md`
- **Purpose**: Setup instructions.
- **Responsibility**: Practical guide for starting the local Docker environment.

### `DOCUMENTATION.md`
- **Purpose**: User manual.
- **Responsibility**: Comprehensive guide for end-users on how to use Control AI features.

### `EDGETTS_OPTIMIZATION.md`
- **Purpose**: TTS performance guide.
- **Responsibility**: Details optimizations for the Edge TTS engine to reduce latency.

### `FREE_FEATURES_GUIDE.md`
- **Purpose**: Monetization documentation.
- **Responsibility**: Outlines which features are available to free tier users vs paid tiers.

### `GEMINI_FILE_SUPPORT.md`
- **Purpose**: AI capability guide.
- **Responsibility**: Documents how to use Gemini's multi-modal features with local files.

### `HEY_CONTROL_TOGGLE.md`
- **Purpose**: Feature documentation.
- **Responsibility**: Explains the logic and UI for the wakeword toggle.

### `INSTALL.md`
- **Purpose**: Quickstart guide.
- **Responsibility**: Basic installation steps for developers.

### `INSTALLER_CUSTOMIZATION.md`
- **Purpose**: Packaging documentation.
- **Responsibility**: Instructions for customizing the Electron Forge/Builder installer UI.

### `INTEGRATION_AUDIT_2026.md`
- **Purpose**: Future-proofing report.
- **Responsibility**: Evaluates the app against expected 2026 integration standards.

### `PROJECT_SUMMARY.md`
- **Purpose**: Executive summary.
- **Responsibility**: High-level pitch and summary of what the project accomplishes.

### `README.md`
- **Purpose**: Primary repo documentation.
- **Responsibility**: The landing page for the repository, covering overview, features, and setup.

### `REMOTE_DESKTOP_GUIDE.md`
- **Purpose**: Feature documentation.
- **Responsibility**: Explains the VNC/noVNC remote access setup.

### `REMOTE_DESKTOP_SETUP.md`
- **Purpose**: Technical setup guide.
- **Responsibility**: Low-level instructions for configuring the VNC server on target machines.

### `REQUIREMENTS.md`
- **Purpose**: Business requirements.
- **Responsibility**: Lists the target goals and KPIs for the Control AI project.

### `SKILLS_IMPLEMENTATION.md`
- **Purpose**: Developer guide.
- **Responsibility**: Detailed instructions on how to add new "Skills" (learned behaviors) to the agent.

### `SUPABASE_GUIDE.md`
- **Purpose**: Backend documentation.
- **Responsibility**: Details the schema and functions used in the Supabase database.

### `TECH_STACK.md`
- **Purpose**: Architecture overview.
- **Responsibility**: Lists every library and framework used in the project.

### `UPDATES_GUIDE.md`
- **Purpose**: Maintenance documentation.
- **Responsibility**: How to push updates to both the desktop and web apps.

### `VM_DEPLOYMENT_GUIDE.md`
- **Purpose**: Infra documentation.
- **Responsibility**: Steps for deploying the Docker VM host.

### `VM_SETUP_GUIDE.md`
- **Purpose**: Technical guide.
- **Responsibility**: Configuration of the XFCE/Ubuntu environment within the Docker containers.

### `VM_WALLPAPER_STARTUP.md`
- **Purpose**: UI customization.
- **Responsibility**: Scripting the wallpaper and branding of the virtual desktops.

### `WAKEWORD_SOLUTIONS.md`
- **Purpose**: Voice engine audit.
- **Responsibility**: Comparison of different wakeword engines (Porcupine vs Snowboy vs Vosk).

### `act_terminal.py`
- **Purpose**: Python prototype.
- **Responsibility**: Early implementation of the action execution logic. Appears to be legacy/reference code.

### `ai_library_suggestions.md`
- **Purpose**: Research document.
- **Responsibility**: List of AI libraries to consider for future upgrades.

### `ask_terminal.py`
- **Purpose**: Python prototype.
- **Responsibility**: Early implementation of the conversational mode logic. Appears to be legacy/reference code.

### `control@1.0.0`
- **Purpose**: Binary artifact.
- **Responsibility**: Likely a compiled build of the application. Should be excluded from git.

### `creative_software_automation.md`
- **Purpose**: Industry-specific guide.
- **Responsibility**: Best practices for automating tools like Blender and Adobe Premiere.

### `dev_server.log`
- **Purpose**: Log file.
- **Responsibility**: Captured output from the development server. Not for production use.

### `electron`
- **Purpose**: Likely a symlink or binary.
- **Responsibility**: References the Electron runtime.

### `flutterwave_integration.md`
- **Purpose**: Payment documentation.
- **Responsibility**: Details how to set up the Flutterwave API for billing.

### `generate_icons.py`
- **Purpose**: Utility script.
- **Responsibility**: Generates various icon sizes (ico, icns, png) from a single source image.

### `open-computer-use-analysis.pdf`
- **Purpose**: Research paper.
- **Responsibility**: Analysis of Anthropic's "Computer Use" capabilities.

### `orig_chat_window.js`
- **Purpose**: Backup file.
- **Responsibility**: Legacy version of the chat window logic. Dead code.

### `package-lock.json`
- **Purpose**: Dependency lockfile.
- **Responsibility**: Ensures deterministic installs for Node.js dependencies.

### `package.json`
- **Purpose**: Node.js manifest.
- **Responsibility**: Defines scripts, metadata, and dependencies for the Electron app.

### `repo-capabilities-grading.pdf`
- **Purpose**: Benchmarking.
- **Responsibility**: Report card on the current system's capabilities.

### `repository-comparison.pdf`
- **Purpose**: Market analysis.
- **Responsibility**: Comparison against other AI agent repos.

### `requirements.txt`
- **Purpose**: Python manifest.
- **Responsibility**: Dependencies for the core backends.

### `supabase_schema.sql`
- **Purpose**: Database schema.
- **Responsibility**: SQL definitions for tables like `users`, `paired_devices`, and `workflows`.

### `test_coords.js` / `test_coords_simple.js`
- **Purpose**: Debugging tools.
- **Responsibility**: Scripts to test the normalization and scaling of screen coordinates.

### `test_manual.ps1`
- **Purpose**: PowerShell script.
- **Responsibility**: Manual test suite for Windows environments.

### `verify_highlight_v2.py`
- **Purpose**: Verification script.
- **Responsibility**: Checks the "Edge Glow" and "Ghost Cursor" visual indicators.

### `verify_ui.spec.ts`
- **Purpose**: Playwright test.
- **Responsibility**: Automated UI verification for the web platform.

### `vosk-requirements.txt`
- **Purpose**: Python manifest.
- **Responsibility**: Specific dependencies for the Vosk STT server.

### `vosk_server_v2.py`
- **Purpose**: STT Server.
- **Responsibility**: Handles WebSocket audio streaming and transcription.

---

## Source Directory (`/src/main`)

### `src/main/app-utils.js`
- **Purpose**: General utilities.
- **Responsibility**: Application-wide helpers for file system operations and string formatting.

### `src/main/backend-manager-fixed.js`
- **Purpose**: AI execution router.
- **Responsibility**: Orchestrates the Act, Ask, and Click backends. Handles task lifecycle and events.

### `src/main/device-manager.js`
- **Purpose**: Hardware interface.
- **Responsibility**: Manages local device identification and pairing state.

### `src/main/edge-tts.js`
- **Purpose**: TTS interface.
- **Responsibility**: Python-shell wrapper for the `edge-tts` library to provide natural-sounding speech.

### `src/main/electron-browser-manager.js`
- **Purpose**: Browser automation controller.
- **Responsibility**: Controls a hidden/visible Electron window for "agentic" web browsing and scraping.

### `src/main/hotkey-manager.js`
- **Purpose**: Keyboard shortcut controller.
- **Responsibility**: Registers and listens for global system hotkeys (e.g., Ctrl+Space).

### `src/main/main.js`
- **Purpose**: Electron entry point.
- **Responsibility**: Bootstraps the app, initializes managers, and handles core IPC.

### `src/main/prompt-manager.js`
- **Purpose**: Template engine.
- **Responsibility**: Loads and injects variables into system prompts from the `prompts/` directory.

### `src/main/remote-desktop-manager.js`
- **Purpose**: Signaling controller.
- **Responsibility**: Manages the connection between the local desktop and the web dashboard.

### `src/main/search-manager.js`
- **Purpose**: Search tool interface.
- **Responsibility**: Wrapper for Google Search or DuckDuckGo for the AI agent's web tools.

### `src/main/security-manager-fixed.js`
- **Purpose**: PIN and Lock controller.
- **Responsibility**: Handles application locking, PIN verification, and secure storage of sensitive keys.

### `src/main/settings-manager.js`
- **Purpose**: Config store.
- **Responsibility**: Saves and retrieves user settings to/from the local `settings.json`.

### `src/main/storage-manager.js`
- **Purpose**: Data persistence.
- **Responsibility**: Handles local storage of "Learned Behaviors" (Skills) and agent libraries.

### `src/main/supabase-service.js`
- **Purpose**: Cloud DB interface.
- **Responsibility**: Syncs user data, token usage, and pairing codes with Supabase.

### `src/main/tool-executor.js`
- **Purpose**: Sandbox executor.
- **Responsibility**: Validates and executes tool calls (terminal, browser) safely.

### `src/main/tool-registry.js`
- **Purpose**: Tool metadata store.
- **Responsibility**: Defines schemas and descriptions for every tool available to the agent.

### `src/main/vosk-server-manager.js`
- **Purpose**: STT process manager.
- **Responsibility**: Starts/stops the `vosk_server_v2.py` child process.

### `src/main/wakeword-manager.js`
- **Purpose**: Voice trigger controller.
- **Responsibility**: Manages the Picovoice engine for "Hey Control" detection.

### `src/main/window-manager.js`
- **Purpose**: Window orchestrator.
- **Responsibility**: Lifecycle management for all Electron BrowserWindow instances.

### `src/main/workflow-manager.js`
- **Purpose**: Automation scheduler.
- **Responsibility**: Loads, saves, and executes multi-step workflows at scheduled times or triggers.

---

## AI Backends (`/src/main/backends`)

### `src/main/backends/act-backend.js`
- **Purpose**: The primary automation engine.
- **Responsibility**: Implements the observation-action-verification loop using Gemini Vision.

### `src/main/backends/ask-backend.js`
- **Purpose**: The conversational engine.
- **Responsibility**: Optimized for natural language responses and system commands without screen control.

### `src/main/backends/click-backend.js`
- **Purpose**: The "Guided Mode" engine.
- **Responsibility**: Highlights UI elements for the user instead of clicking them automatically.

### `src/main/backends/wakeword-helper.js`
- **Purpose**: Binary utility.
- **Responsibility**: Assists in platform-specific logic for the Porcupine engine.

---

## Prompts (`/src/main/prompts`)

### `src/main/prompts/act-general-system-prompt.md`
- **Purpose**: Core behavior definition.
- **Responsibility**: Instructs the agent on how to behave in ACT mode (JSON formatting, tool usage).

### `src/main/prompts/ask-system-prompt.md`
- **Purpose**: Chat behavior definition.
- **Responsibility**: Instructions for the AI in ASK mode (conciseness, personality).

### `src/main/prompts/native-scripting-reference.md`
- **Purpose**: Technical reference.
- **Responsibility**: Documentation of native OS capabilities the AI can use via terminal.

---

## Renderer & Preload (`/src/renderer`, `/src/preload`)

### `src/renderer/chat-window.html` / `js`
- **Purpose**: Primary UI.
- **Responsibility**: The main chat interface where users interact with Control.

### `src/renderer/settings-modal.html` / `js`
- **Purpose**: Configuration UI.
- **Responsibility**: Panel for managing API keys, themes, and agent behavior.

### `src/renderer/main-overlay.html`
- **Purpose**: Visual feedback layer.
- **Responsibility**: Renders the "Edge Glow" and "Ghost Cursor" effects over the entire OS.

### `src/renderer/entry-window.html` / `js`
- **Purpose**: Authentication UI.
- **Responsibility**: The first screen users see (Login / PIN Entry).

### `src/renderer/lite-window.html`
- **Purpose**: Minimalist UI.
- **Responsibility**: Floating bar version of the chat for power users.

### `src/renderer/ghost-cursor-overlay.html`
- **Purpose**: Agent visualization.
- **Responsibility**: Renders the floating "Ghost" cursor and thought bubbles.

### `src/renderer/workflow-window.html`
- **Purpose**: Workflow editor.
- **Responsibility**: Visual tool for creating automated sequences.

### `src/preload/*.js`
- **Purpose**: IPC Bridges.
- **Responsibility**: Securely exposes Main process APIs to specific Renderer windows.

---

## Web Platform (`/control_web`)

### `control_web/app/page.tsx`
- **Purpose**: Cloud landing page.
- **Responsibility**: Public face of the web platform.

### `control_web/components/ChatPanel.tsx`
- **Purpose**: React chat UI.
- **Responsibility**: Cloud-based interface for remote automation.

### `control_web/components/WorkflowDesigner.tsx`
- **Purpose**: Visual editor.
- **Responsibility**: A drag-and-drop canvas for building automation logic.

### `control_web/components/VNCViewer.tsx`
- **Purpose**: Remote Desktop.
- **Responsibility**: Renders the VM desktop stream using `@novnc/novnc`.

### `control_web/lib/api.ts`
- **Purpose**: API Client.
- **Responsibility**: Typed interface for communicating with the FastAPI backend.

### `control_web/backend/main.py`
- **Purpose**: FastAPI Entry.
- **Responsibility**: Primary router for the cloud infrastructure.

### `control_web/vm/ai_agent.py`
- **Purpose**: VM Agent.
- **Responsibility**: The Python agent that runs inside Docker containers to execute commands.

---

## Scripts & Assets (`/scripts`, `/assets`)

### `scripts/upload-keys.js`
- **Purpose**: Setup utility.
- **Responsibility**: Syncs local `.env` keys to the cloud database.

### `assets/icons/`
- **Purpose**: Branding artifacts.
- **Responsibility**: Storage for app icons across all resolutions and platforms.

### `assets/wakeword/*.ppn`
- **Purpose**: Machine learning models.
- **Responsibility**: Binary weights for the "Hey Control" wakeword detection.
