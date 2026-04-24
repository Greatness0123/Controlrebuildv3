# Azure Account Migration Guide - Control Desktop

## Overview
This document outlines steps to migrate the Control Desktop backend infrastructure from one Azure account to another.

---

## What Changes

### ❗ Most Important: IP Address Changes
- The `PUBLIC_IP` will change to the new Azure VM's IP
- This affects: backend, frontend, VM agent connections

### ✅ Stays The Same
- `SUPABASE_URL` - Same Supabase project
- `SUPABASE_ANON_KEY` - Same Supabase project
- `SUPABASE_SERVICE_ROLE` - Same Supabase project
- `GEMINI_API_KEY` - Same API key
- Domain names (if using any)

---

## Step-by-Step Migration Checklist

### Phase 1: Before Migration (Source Account)

#### 1. Document Current Configuration
```bash
# SSH into current VM and run:
docker-compose ps
docker-compose logs --tail=50
```

#### 2. Backup All Configurations
```bash
# On the VM, backup these files:
cp -r ~/backend ~/backup_backend_$(date +%Y%m%d)
cp -r ~/caddy ~/backup_caddy_$(date +%Y%m%d)
cp docker-compose.yml ~/backup_docker-compose_$(date +%Y%m%d)
```

#### 3. Export Environment Variables
```bash
# Note down all current settings:
echo $PUBLIC_IP
echo $VM_AGENT_PORT
echo $DOCKER_NETWORK
```

#### 4. Test Current Endpoints
```bash
# Test backend API
curl https://<current_ip>/api/health

# Test VM agent WebSocket
wscat -c ws://<current_ip>:8080
```

---

### Phase 2: New Azure VM Setup

#### 1. Create New VM
- **Region**: Same as before (or closest to your users)
- **OS**: Ubuntu 22.04 LTS
- **Size**: Minimum 4GB RAM, 2 vCPUs
- **Ports to open**:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 8080 (VM Agent WebSocket)
  - 5900 (VNC - optional)

#### 2. Install Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install wscat for testing WebSockets
npm install -g wscat

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

---

### Phase 3: Deploy Services to New VM

#### 1. Transfer Backend Code
```bash
# From your local machine:
scp -r ~/control_web/backend user@<new_ip>:~/
scp -r ~/control_web/caddy user@<new_ip>:~/
scp ~/control_web/docker-compose.yml user@<new_ip>:~/
```

#### 2. Update Backend .env (CRITICAL)
```bash
# SSH into new VM
ssh user@<new_ip>

# Edit backend/.env with NEW IP
cat <<EOF > backend/.env
# --- SUPABASE & API KEYS ---
SUPABASE_URL=https://gdvitudsmqktiutyyndv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkdml0dWRzbXFrdGl1dHl5bmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIxNjAsImV4cCI6MjA4ODkxODE2MH0.uxN2Obtx2EeErFK8sNMW15xpOMf8FSToiozX0vT_f1Q
GEMINI_API_KEY=AIzaSyCYuqhGGkFtEFvXq_vPltpABf_f_p2UYVU
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkdml0dWRzbXFrdGl1dHl5bmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MjE2MCwiZXhwIjoyMDg4OTE4MTYwfQ.6CxEDIGC_SsuUmEevgcy2ZnybeZctGwTN4YjmVDa2No

# --- INFRASTRUCTURE ---
PUBLIC_IP=<NEW_VM_IP_HERE>
DOCKER_NETWORK=control-net
VM_AGENT_PORT=8080
VNC_PORT=5900
EOF
```

#### 3. Update Caddyfile
```bash
# Edit Caddyfile with NEW IP
cat <<EOF > Caddyfile
{
    email your-email@example.com
}

<NEW_VM_IP> {
    reverse_proxy /api/* localhost:8001
    reverse_proxy /* localhost:3000
}
EOF
```

#### 4. Update Docker Compose
```bash
# Ensure docker-compose.yml has correct environment variables
# Check PYTHON_BACKEND_URL points to correct backend
```

#### 5. Start Services
```bash
cd ~/backend
docker-compose up -d

cd ~/caddy
docker-compose up -d

# Or if using single compose at root
docker-compose up -d
```

---

### Phase 4: Frontend Updates (if applicable)

#### If Frontend is Self-Hosted:
Update `control_web/.env`:
```bash
NEXT_PUBLIC_BACKEND_URL=https://<NEW_VM_IP>
PYTHON_BACKEND_URL=http://<NEW_VM_IP>:8001
```

#### If Using control-desktop Electron App:
Update `electron/.env`:
```bash
COASTY_BACKEND_URL=https://<NEW_VM_IP>
```

---

### Phase 5: Verification

#### 1. Test Backend API
```bash
curl https://<NEW_VM_IP>/api/health
# Expected: {"status": "ok"}
```

#### 2. Test VM Agent Connection
```bash
# From local machine:
wscat -c ws://<NEW_VM_IP>:8080
# Should connect successfully
```

#### 3. Test WebSocket from Electron App
```javascript
// In DevTools of Electron app:
window.coasty?.getSetting('pythonBackendUrl') // Should return new IP
```

#### 4. Check Docker Logs
```bash
docker-compose logs -f
# Look for any connection errors
```

---

### Phase 6: DNS Updates (If Using Domain)

If using a domain instead of IP:

1. Update A record at your DNS provider:
   - `api.yourdomain.com` → `<NEW_VM_IP>`

2. Update Caddyfile:
```bash
api.yourdomain.com {
    reverse_proxy /api/* localhost:8001
    reverse_proxy /* localhost:3000
}
```

3. Wait for DNS propagation (5-60 minutes)

---

## Quick Reference: What Files to Update

| File | What to Change |
|------|----------------|
| `backend/.env` | `PUBLIC_IP` to new IP |
| `Caddyfile` | IP address in site block |
| `docker-compose.yml` | Environment variables |
| `frontend/.env` | Backend URL if self-hosted |
| `electron/.env` | Backend URL |

---

## Troubleshooting

### Backend Won't Start
```bash
docker-compose logs backend
# Common issues: port conflicts, missing env vars
```

### VM Agent Can't Connect
```bash
# Check VM agent logs
docker-compose logs vm-agent

# Verify WebSocket port is open
curl -v telnet://<NEW_IP>:8080
```

### Frontend Can't Reach Backend
```bash
# Check Caddy logs
docker-compose logs caddy

# Verify reverse proxy config
curl -v http://localhost:8001/health
```

### Supabase Connection Issues
- Verify `SUPABASE_URL` is correct
- Check if IP whitelist needs update in Supabase dashboard

---

## Post-Migration Verification Checklist

- [ ] Backend API responds at `https://<NEW_IP>/api/health`
- [ ] VM Agent WebSocket connects at `ws://<NEW_IP>:8080`
- [ ] Electron desktop app connects successfully
- [ ] No CORS errors in browser console
- [ ] All Docker containers running: `docker-compose ps`
- [ ] Old VM can be safely shut down after 24 hours of successful operation

---

## Rollback Plan

If migration fails:
1. Keep old VM running for 7 days
2. Update DNS/IP back to old VM temporarily
3. Fix issues on new VM
4. Test again
5. Decommission old VM only after stable operation

---

## Notes

- Supabase keys are project-scoped, not VM-scoped, so they remain valid
- The VM Agent port (8080) must be accessible from the internet for Electron desktop connections
- If using firewall, ensure ports 80, 443, and 8080 are open