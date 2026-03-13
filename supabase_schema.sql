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
    "gemini_model": "gemini-1.5-flash",
    "openrouter_keys": []
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies

-- Users: Authenticated users can read/update their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Do NOT query public.users inside its own policy (causes infinite recursion).
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = auth_id);

-- Allow authenticated users to insert their own profile row (used by website signup).
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = auth_id);

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
