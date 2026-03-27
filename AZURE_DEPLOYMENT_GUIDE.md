# Control Web - Microsoft Azure Deployment Guide

This guide provides comprehensive instructions for deploying the Control Web backend, frontend, and VM infrastructure on Microsoft Azure.

## Architecture Overview
- **Frontend**: Next.js app deployed to Azure Static Web Apps or Azure App Service.
- **Backend**: FastAPI app deployed to Azure App Service (Web App for Containers).
- **Database**: Supabase (External) or Azure Database for PostgreSQL + Azure Blob Storage.
- **VM Infrastructure**: Azure Container Instances (ACI) or Azure Kubernetes Service (AKS) for dynamic worker VMs.

---

## 1. Prerequisites
- An active Microsoft Azure account.
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and configured (`az login`).
- Docker installed locally.

## 2. Infrastructure Setup (Resource Group)
Create a resource group to contain all services:
```bash
az group create --name ControlResources --location eastus
```

## 3. Container Registry (ACR)
You need a private registry to host the backend and worker VM images.
```bash
az acr create --resource-group ControlResources --name controlregistry --sku Basic
az acr login --name controlregistry
```

## 4. Building and Pushing Images
Build the backend and VM worker images:

### Backend Image
```bash
cd control_web/backend
docker build -t controlregistry.azurecr.io/control-backend:latest .
docker push controlregistry.azurecr.io/control-backend:latest
```

### VM Worker Image
```bash
cd control_web/vm
docker build -t controlregistry.azurecr.io/control-vm:latest .
docker push controlregistry.azurecr.io/control-vm:latest
```

## 5. Deploying the Backend (Azure App Service)
1. **Create an App Service Plan**:
   ```bash
   az appservice plan create --name ControlPlan --resource-group ControlResources --sku B1 --is-linux
   ```

2. **Create the Web App**:
   ```bash
   az webapp create --resource-group ControlResources --plan ControlPlan --name control-api --deployment-container-image-name controlregistry.azurecr.io/control-backend:latest
   ```

3. **Configure Environment Variables**:
   Set the required variables for Supabase and AI providers:
   ```bash
   az webapp config appsettings set --resource-group ControlResources --name control-api --settings \
     SUPABASE_URL="your_supabase_url" \
     SUPABASE_SERVICE_ROLE="your_service_key" \
     GEMINI_API_KEY="your_api_key" \
     PUBLIC_IP="control-api.azurewebsites.net" \
     VM_IMAGE_NAME="controlregistry.azurecr.io/control-vm:latest"
   ```

## 6. VM Infrastructure Configuration
The current code uses `docker.from_env()`, which expects a local Docker socket. For Azure:
1. **Option A (Azure Container Instances)**: Modify `vm_service.py` to use the [Azure Python SDK](https://learn.microsoft.com/en-us/python/api/overview/azure/containerinstance?view=azure-python) to spin up containers in ACI instead of local Docker.
2. **Option B (Self-hosted VM)**: Deploy a large Ubuntu VM on Azure, install Docker, and host both the backend and workers there.

### Recommended Option B Setup:
1. **Create VM**:
   ```bash
   az vm create --resource-group ControlResources --name ControlHost --image Ubuntu2204 --size Standard_D2s_v3 --admin-username azureuser --generate-ssh-keys
   ```
2. **Open Ports**:
   ```bash
   az vm open-port --resource-group ControlResources --name ControlHost --port 8000 # Backend
   az vm open-port --resource-group ControlResources --name ControlHost --port 6080-6100 # noVNC Range
   ```
3. **SSH into VM and run `docker-compose up`** using the provided `docker-compose.yml` in the root.

## 7. Frontend Deployment (Azure Static Web Apps)
Deploy the Next.js app using the Azure Portal or CLI:
1. Connect your GitHub repository.
2. Select **Next.js** as the build preset.
3. Add environment variables in the Static Web App settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_URL` (Pointing to your Azure backend)

---

## Troubleshooting VNC
If the VNC screen is blank:
1. Ensure the **Network Security Group (NSG)** on your Azure VM allows inbound traffic on ports `6080` and `5900`.
2. Verify `PUBLIC_IP` in the backend config matches your Azure VM's Public IP address.
3. Check backend logs: `az webapp log tail --name control-api --resource-group ControlResources`.
