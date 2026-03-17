-- Control Web Schema Updates

-- Ensure virtual_machines table exists
CREATE TABLE IF NOT EXISTS public.virtual_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'stopped',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add container tracking to virtual_machines
ALTER TABLE public.virtual_machines 
  ADD COLUMN IF NOT EXISTS container_id TEXT,
  ADD COLUMN IF NOT EXISTS vnc_port INTEGER,
  ADD COLUMN IF NOT EXISTS novnc_port INTEGER,
  ADD COLUMN IF NOT EXISTS os_type TEXT DEFAULT 'ubuntu';

-- Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    vm_id UUID REFERENCES public.virtual_machines(id) ON DELETE SET NULL,
    device_id UUID, -- for paired device sessions
    title TEXT DEFAULT 'New Chat',
    model TEXT DEFAULT 'gemini-2.5-flash',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'action')),
    content TEXT NOT NULL,
    screenshot_url TEXT,
    action_type TEXT, -- 'click', 'type', 'scroll', 'terminal', 'screenshot'
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paired Devices
CREATE TABLE IF NOT EXISTS public.paired_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    device_type TEXT DEFAULT 'desktop', -- 'desktop', 'laptop'
    pairing_code TEXT,
    pairing_expires TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paired', 'revoked', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paired_devices ENABLE ROW LEVEL SECURITY;

-- Chat Sessions: Authenticated users only
CREATE POLICY "Users manage own chat sessions" ON public.chat_sessions
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Chat Messages: Authenticated users only
CREATE POLICY "Users manage own chat messages" ON public.chat_messages
    FOR ALL USING (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())));

-- Paired Devices: 
-- 1. Allow Desktop App (anon) to create a pairing request
CREATE POLICY "Allow anon to create pairing" ON public.paired_devices
    FOR INSERT TO anon
    WITH CHECK (status = 'pending');

-- 2. Allow Authenticated users (Web App) to see and manage their own devices
CREATE POLICY "Users manage own paired devices" ON public.paired_devices
    FOR ALL TO authenticated
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_paired_devices_updated_at BEFORE UPDATE ON public.paired_devices
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_paired_devices_user ON public.paired_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_machines_user ON public.virtual_machines(user_id);
