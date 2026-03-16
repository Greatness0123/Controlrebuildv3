-- Add ai_status to chat_sessions
ALTER TABLE public.chat_sessions 
    ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'idle' CHECK (ai_status IN ('idle', 'running', 'paused', 'stopped'));
