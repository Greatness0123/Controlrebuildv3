# Control Architecture Overhaul - Change Log

## UI/UX Enhancements (Desktop & Web)
- **Settings Redesign**: Migrated from a single-page list to a professional tabbed interface (Account, Appearance, AI Providers, Voice, Security, Remote Access).
- **AI Provider Cards**: AI providers (Gemini, OpenAI, Anthropic, etc.) are now displayed as interactive cards with logos, mimicking high-end agent platforms.
- **Layout Modes**:
    - **Classic Mode**: Standard sidebar/window layout.
    - **Lite Mode**: Minimalist floating input with edge-glow effects, collapsible history, and quick-action controls.
- **Agent-Centric Messaging**: Messages now include "thinking" blocks, action cards with status indicators (running/success/error), and professional font/spacing.
- **Website Auth**: Switched from User ID based authentication to Email/Password authentication for a more standard web experience.
- **Application Linking**: Introduced a "Link ID" system to sync the website profile with the desktop application.

## Backend & Infrastructure
- **Supabase Migration**: Completely replaced Firebase with Supabase.
    - Implemented `supabase_schema.sql` for users, VMs, and remote signaling.
    - Built `supabase-service.js` for both desktop and web components.
- **Remote Desktop Control**:
    - Implemented a WebRTC-based signaling layer using Supabase.
    - Added pairing code generation for secure connection between the Web Dashboard and Local Desktop.
- **VM Management**:
    - Added support for tracking virtual machines per user.
    - Provided `VM_DEPLOYMENT_GUIDE.md` for setting up free Docker-based VNC environments.

## Feature Updates
- **AI Providers**: Integrated Gemini as a primary provider with fallbacks for native search and other tools.
- **Rate Limiting**: Integrated plan-based rate limits (Free/Pro/Master) visible in the desktop header.
- **Voice & Audio**: Refined Vosk integration for smoother voice-to-text transitions.
- **Security**: Added PIN-lock capability and confirmation prompts for high-risk AI actions.

## Documentation
- `SUBAPASE_INTEGRATION_GUIDE.md`: Steps to set up the new database.
- `VM_DEPLOYMENT_GUIDE.md`: Instructions for free VM hosting using Docker.
- `REMOTE_DESKTOP_SETUP.md`: Guide for the new "View and Control" feature.
- `DOCKER_EXPLAINER.md`: Educational guide on Docker architecture as requested.
