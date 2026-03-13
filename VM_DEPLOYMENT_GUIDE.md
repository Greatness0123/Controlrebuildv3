# VM Deployment Guide (Control Web)

This guide explains how to deploy the virtual machine infrastructure for Control Web, similar to how Coasty AI handles browser-based VM control.

## Deployment on Render (Free Tier)

Render is great for hosting Docker containers.

1.  **Repository**: Push the `control_web/vm` directory to a new GitHub repository.
2.  **Create Service**: On Render Dashboard, click `New` -> `Web Service`.
3.  **Connect Repo**: Select your repository.
4.  **Environment**: Select `Docker`.
5.  **Instance Type**: `Free`.
6.  **Advanced**: Add Environment Variable:
    - `RESOLUTION`: `1280x800x24`
7.  **Deploy**: Render will build the Dockerfile and start the noVNC proxy.

## Deployment on Railway

Railway offers a powerful Docker environment with $5 monthly credit.

1.  **New Project**: Click `New Project` -> `Deploy from GitHub repo`.
2.  **Connect Repo**: Select your `control_web/vm` repository.
3.  **Variable**: Go to `Variables` tab and add `RESOLUTION`.
4.  **Networking**: Railway automatically detects port 6080. Generate a domain in the `Settings` tab.

## Connecting to Control Web

Once your VM is running and you have a public URL (e.g., `https://control-vm.up.railway.app`):

1.  **Supabase Setup**: Go to your Supabase dashboard.
2.  **Insert VM**: Add a new row to the `virtual_machines` table:
    - `id`: Unique identifier (e.g., `vm-primary`)
    - `user_id`: Your User ID from Control Web.
    - `vnc_url`: Your public URL followed by `/vnc.html?autoconnect=true`
3.  **Dashboard**: Refresh Control Web. Your new VM will appear in the sidebar and you can control it directly.

## Overview
Control Web uses Docker-based VMs to provide each user with a clean, isolated environment. These VMs are accessed via VNC/noVNC over a secure tunnel.

## Infrastructure Setup

### 1. VM Image
We use a customized Ubuntu-based Docker image with:
- XFCE4 Desktop Environment
- noVNC (Web-based VNC client)
- Chrome/Firefox
- Control Agent fallback (nut.js wrapper)

### 2. Deployment on Cloud (e.g., AWS, GCP, or Railway)
To provide free VMs for each user (based on plan), use a container orchestration service.

#### Example Docker Compose
```yaml
version: '3'
services:
  browser-vm:
    image: control-ai/vm-node:latest
    ports:
      - "8080:8080" # noVNC port
    environment:
      - VNC_PASSWORD=secure_pass
      - RESOLUTION=1280x720
```

### 3. AI Access to VM
The AI Agent connects to the VM via:
1. **Screen Capture**: A stream from the VNC server.
2. **Input Injection**: Control commands sent via WebSocket to the noVNC/VNC server.

## Integration with Control Web
1. When a user creates a computer in the web dashboard, the backend triggers a Docker container spawn.
2. The `supabase` database tracks the VM instance URL and credentials.
3. The web frontend embeds the noVNC client in an iframe for the user to view.
4. The AI Agent runs in a serverless function or worker, fetching screenshots from the VM and sending input commands.

## Setup Instructions
1. Install Docker on your host machine.
2. Pull the base image: `docker pull control-ai/ubuntu-novnc:latest`.
3. Configure the Control Web backend to use the Docker API for container management.
4. Set up a reverse proxy (like Nginx) to handle secure traffic to user-specific containers.
