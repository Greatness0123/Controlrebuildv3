# Deployment & Integration Requirements

This file lists the dependencies and setup steps required to achieve real-time view and control on both Web and Desktop versions.

## Desktop App Requirements

### Dependencies (Automated by `npm install`)
- `screenshot-desktop`: Captures the host screen.
- `@computer-use/nut-js`: Native mouse and keyboard control.
- `@supabase/supabase-js`: Database and signaling.

### Native Requirements (Manual)
- **Windows**: No extra steps usually needed.
- **macOS**: Must grant "Accessibility" and "Screen Recording" permissions to the app.
- **Linux**: Requires `libxtst-dev` and `libpng-dev` for nut.js and screenshot-desktop.
  ```bash
  sudo apt-get install libxtst-dev libpng-dev
  ```

## Web App (Control Web) Requirements

### Development Dependencies
- `next`: React Framework.
- `lucide-react`: Professional icons.
- `@supabase/supabase-js`: Real-time signaling and auth.
- `simple-peer` (Recommended for final deployment): Simplifies WebRTC implementation.

### Infrastructure (for VMs)
- **Docker**: Must be installed on the VM host.
- **VNC Server**: Installed inside the Docker image (e.g., `x11vnc`).
- **noVNC**: Web client to bridge VNC to WebSockets.

## Integration Steps

1. **Signaling Implementation**:
   - The desktop app generates a pairing code and listens to the `remote_signaling` table in Supabase.
   - The web app inserts signaling messages (SDP/ICE) into this table.
   - Once a WebRTC connection is established, screen data is streamed directly between peers.

2. **Command Execution**:
   - Web app sends mouse/keyboard events via WebRTC DataChannel.
   - `RemoteDesktopManager.js` in the desktop app receives these events and calls `nut.js` to execute them.

3. **AI Integration**:
   - The AI Agent in the web version can be prompted with "Control this machine".
   - The agent uses the same spatial reasoning as the desktop version but sends its actions to the `remote_signaling` table instead of local host.
