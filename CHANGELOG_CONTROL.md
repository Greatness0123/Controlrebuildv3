# Changelog - Control

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **AI Workflow Designer (Web)**: Implemented a visual, node-based workflow creator in the web dashboard.
- **AI Workflow Assistant**: Added a draggable AI assistant overlay that can generate and modify visual workflows through interactive natural language conversation.
- **Workflow Execution**: Integrated a database-driven signaling system for triggering workflow execution on remote machines and VMs.
- **Billing & Token Usage**: Added a visual token usage display to the Billing settings tab with Daily, Weekly, and Monthly toggles. Tracked via specific 'prompt' and 'candidates' metrics.
- **Mobile Responsiveness**: Enhanced the Workflows page and Workflow Designer with responsive layouts for mobile and tablet devices.
- **VM Infrastructure**: Added `dbus-x11` and `at-spi2-core` to the Docker environment to ensure XFCE stability.
- **VM Entrypoint**: Implemented D-Bus session management via `dbus-launch` and automated X11 lock cleanup.
- **Web UI**: Added specific rendering for "thought" blocks to separate AI reasoning from final output.

### Changed
- **Unified AI Prompting**: Removed manual ACT/ASK toggles from Web and Desktop. The AI now automatically chooses between general conversation (Markdown) and agentic computer control (JSON) based on intent.
- **Web Aesthetic**: Overhauled the web dashboard to reduce "AI-like" elements. Removed sparkles, excessive icons, and glassmorphism white outlines. Updated theme to deeper blacks with minimalist indicators.
- **Data Architecture**: Optimized web performance by implementing direct Supabase fetching for sessions and messages, using the hosted backend only as a fallback.
- **Desktop Messaging**: Unified the messaging layout for both modes, adopting the "agentic" layout (action cards and thinking blocks) for all interactions.
- **Token Counters**: Updated the Desktop app to correctly synchronize and display `total_token_usage` and `daily_token_usage` from the database.

### Fixed
- **VM Startup**: Resolved XFCE "black screen" and session locking issues in the Docker container.
- **Counter Sync**: Fixed an issue where token and usage counters in the desktop app would remain at zero after interactions.
