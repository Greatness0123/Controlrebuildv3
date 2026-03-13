# Remote Desktop Setup (View and Control)

This guide explains how to set up and use the "View and Control" feature to access your local machine from the Control Web app.

## Security
This feature uses end-to-end encryption (via WebRTC) and a secure pairing code to ensure only you can access your machine.

## Steps to Enable

### 1. On your Desktop App:
1. Open **Settings**.
2. Go to the **Security** or **Remote Access** tab.
3. Toggle **Enable Remote Access** to ON.
4. Click **Generate Pairing Code**. You will get an 8-character code (e.g., `A1B2C3D4`).

### 2. On Control Web:
1. Go to your **Computers** dashboard.
2. Click **Add My Own Computer**.
3. Enter the **Pairing Code** from your desktop app.
4. Click **Connect**.

## How it Works
1. **Signaling**: The Desktop app and Web app use Supabase to exchange connection metadata (SDP/ICE candidates).
2. **Direct Connection**: Once paired, a WebRTC peer-to-peer connection is established.
3. **Control**: The web app sends input events (mouse, keyboard) over the WebRTC data channel. The desktop app executes these natively using its built-in tools.
4. **View**: The desktop app streams its screen back to the web app in real-time.

## Troubleshooting
- Ensure both devices are online.
- If you are behind a strict firewall, ensure "STUN/TURN" servers are configured in settings.
- Regenerate the pairing code if it expires (10-minute limit).
