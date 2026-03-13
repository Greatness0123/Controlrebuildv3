# VM Deployment Guide (Control Web)

This guide explains how to deploy the virtual machine infrastructure for Control Web, similar to how Coasty AI handles browser-based VM control.

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
