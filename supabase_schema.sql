-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- 12-digit user ID
    auth_id UUID REFERENCES auth.users(id), -- Link to Supabase Auth
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free',
    member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tasks_completed INTEGER DEFAULT 0,
    hours_saved FLOAT DEFAULT 0,
    success_rate FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    act_count INTEGER DEFAULT 0,
    ask_count INTEGER DEFAULT 0,
    token_usage JSONB DEFAULT '{}'::jsonb,
    daily_token_usage JSONB DEFAULT '{}'::jsonb,
    picovoice_key TEXT,
    remote_access_enabled BOOLEAN DEFAULT false,
    remote_pairing_code TEXT,
    remote_pairing_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App Config table (for shared API keys and global settings)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial API Keys config
INSERT INTO public.app_config (key, value)
VALUES ('api_keys', '{
    "gemini_keys": [],
    "gemini_model": "gemini-2.0-flash",
    "openrouter_keys": []
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies

-- Users: Authenticated users can read/update their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_id OR id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

-- App Config: Read-only for authenticated users
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read config" ON public.app_config
    FOR SELECT TO authenticated USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Virtual Machines table
CREATE TABLE IF NOT EXISTS public.virtual_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'stopped', -- 'running', 'stopped', 'starting'
    instance_url TEXT,
    vnc_password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remote Control Signaling (WebRTC)
CREATE TABLE IF NOT EXISTS public.remote_signaling (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id),
    source TEXT NOT NULL, -- 'web' or 'desktop'
    target TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for VM and Signaling
ALTER TABLE public.virtual_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_signaling ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own VMs" ON public.virtual_machines
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage their signaling" ON public.remote_signaling
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Trigger for VM updated_at
CREATE TRIGGER update_vm_updated_at BEFORE UPDATE ON public.virtual_machines
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
