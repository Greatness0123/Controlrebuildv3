# Virtual Machine Management with Docker

Control Web uses Docker to provide isolated virtual environments for AI agents.

## Docker Setup for VMs
To provide "Free" VMs, you can use a host with Docker installed and spawn containers with VNC access.

### Recommended Docker Image
`dorowu/ubuntu-desktop-lxde-vnc` - Provides a full Ubuntu desktop environment accessible via web browsers (noVNC).

### Spawning a VM
```bash
docker run -d \
  -p 6080:80 \
  -v /dev/shm:/dev/shm \
  --name control-vm-user123 \
  dorowu/ubuntu-desktop-lxde-vnc
```

## Scaling
For multiple users, use a container orchestrator like Kubernetes or a Docker Cloud provider (e.g., Fly.io, Railway - though they have limited free tiers).

## Remote Access
Users can view the VM directly in Control Web via an `<iframe>` pointing to the VNC web port (6080).
