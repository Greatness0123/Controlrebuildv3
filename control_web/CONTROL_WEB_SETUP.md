# Control Web — Setup Guide

Follow these steps to set up the functional, dynamic Control Web environment.

## 1. Prerequisites
- **Docker**: Must be installed and running.
- **Python 3.10+**: For the FastAPI backend.
- **Node.js 18+**: For the Next.js frontend.
- **Supabase Account**: You'll need your project URL and keys.

## 2. Infrastructure Setup

### Database
1. Go to your Supabase SQL Editor.
2. Run the `supabase_schema.sql` (if not already run).
3. Run the `control_web/schema_update.sql` to add the chat and pairing tables.

### Virtual Machine Image
Build the Control VM image that will be used for user instances:
```bash
cd control_web
docker build -t control-vm ./vm
```

## 3. Backend Setup (FastAPI)
1. Create a Python virtual environment:
```bash
cd control_web/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Create a `.env` file (refer to `.env.example`):
```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
GEMINI_API_KEY=your-google-ai-key
```
4. Start the backend:
```bash
python main.py
```

## 4. Frontend Setup (Next.js)
1. Install dependencies:
```bash
cd control_web
npm install
```
2. Ensure your `.env` (or `.env.local`) has the correct Supabase keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://20.164.16.171:8000
```
3. Start the dev server:
```bash
npm run dev
```

## 5. Usage Flow
1. **Sign Up**: Create an account on the web app.
2. **Launch VM**: Go to the **Machines** page and create your first instance.
3. **Start Chat**: Go to the **Dashboard** and click **New Chat**.
4. **Automate**: Send a task to the AI (e.g., "Open a browser and search for news"). Watch the agent execute actions on the live VNC viewer!
5. **Pair Desktop**: Generate a code on the **Pair** page and enter it in your Control Desktop app's remote settings.

## Troubleshooting
- **Docker Connection**: If the backend can't connect to Docker, ensure your user has permissions to access the Docker socket.
- **VNC Connection**: If the viewer shows "Connection Failed", verify the container is running and the `novnc_port` is exposed.
- **AI Errors**: Check the backend logs for Gemini API quota or key errors.
