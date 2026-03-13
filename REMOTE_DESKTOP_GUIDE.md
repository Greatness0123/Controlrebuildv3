# Remote Desktop: Secure Connection Guide

This feature allows users to see and control their local systems from the Control Web interface.

## 1. Security (Pairing)
- The Desktop app generates a unique **Connection Code** and **Tunnel URL**.
- The user enters this code on Control Web to establish a secure handshake.

## 2. Technical Implementation (Hybrid Approach)
### WebRTC (Streaming)
Used for real-time video streaming of the desktop and low-latency input (mouse/keyboard).
- **Desktop**: Acts as the WebRTC Broadcaster.
- **Web**: Acts as the WebRTC Receiver.

### Secure Tunneling
To bypass NAT and firewalls without opening ports:
- **Tailscale**: Recommended for cross-platform secure networking.
- **Cloudflare Tunnel**: Excellent for exposing a local service to a public URL with zero-trust security.

## 3. Pairing Flow
1. Desktop: `Settings > Remote Access > Enable`.
2. Desktop: Displays Code (e.g., `CTRL-8293-1029`).
3. Web: `Dashboard > Add Computer > Enter Code`.
4. Web & Desktop: Establish WebRTC peer connection via Supabase Real-time signaling.
