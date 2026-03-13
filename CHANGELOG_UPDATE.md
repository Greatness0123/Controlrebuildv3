# Changelog - Major Architectural Update

## UI/UX Overhaul
- **New Settings Interface**: Redesigned from scratch with a professional tab-based layout.
- **AI Provider Cards**: Providers (Gemini, OpenAI, Anthropic, etc.) are now represented as cards with logos.
- **Layout Selection**: Users can now choose between "Classic" and "Lite" (compact) chat interfaces.
- **Message Styling**: AI and User messages now have distinct bubbles and professional fonts, mimicking the Coasty-ai aesthetic.
- **Sidebar Integration**: The desktop app now features a togglable sidebar for conversation history.

## Technical Migration
- **Supabase Integration**: Migrated the core database and authentication logic from Firebase to Supabase for improved scalability and real-time features.
- **Native Search**: Implemented a `SearchManager` that uses Google Custom Search API with fallbacks to the agentic browser.
- **Improved Coordinate Handling**: Optimized coordinate mapping in `ActBackend` for higher accuracy across different screen resolutions.

## New Functionalities
- **Control Web (Foundation)**: Initial directory structure and Next.js setup for the web-based version of Control.
- **Virtual Machine Support**: Documentation and architecture for spawning free Docker-based VMs for agent execution.
- **Secure Remote Access**: Design for pairing local systems with the Control Web dashboard via WebRTC and secure tunnels.

## Performance & Optimization
- **Memory Efficiency**: Reduced overhead by consolidating backend logic into native JS modules.
- **Binary Size**: Maintained Electron app size under 200MB by optimizing resource bundling.

## Documentation
- Added `DOCKER_GUIDE.md` for a comprehensive overview of containerization.
- Added `SUPABASE_GUIDE.md` for database migration.
- Added `VM_SETUP_GUIDE.md` and `REMOTE_DESKTOP_GUIDE.md` for new cloud features.
