# Control Web Architecture

Control Web is a cloud-based version of the Control assistant, allowing users to run AI agents on virtual machines or access their local systems remotely.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, Lucide React (Icons)
- **Backend**: Next.js API Routes, Supabase (Auth, DB, Real-time)
- **VM Management**: Docker-based VMs (using `docker-in-docker` or cloud provider APIs)
- **Remote Desktop**: WebRTC for low-latency streaming + Hybrid Tailscale/Cloudflare for secure tunneling.

## Directory Structure
```
control_web/
├── app/                  # Next.js App Router
│   ├── dashboard/        # Main user dashboard
│   ├── vm/               # Virtual Machine interface
│   └── remote/           # Remote Desktop interface
├── components/           # Reusable UI components
├── lib/                  # Shared logic (Supabase client, etc.)
└── public/               # Static assets
```

## Setup Instructions
1. Install dependencies: `npm install` inside `control_web`.
2. Configure `.env.local` with Supabase and VM provider credentials.
3. Run development server: `npm run dev`.
