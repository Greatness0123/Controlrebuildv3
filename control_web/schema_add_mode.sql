-- Add mode column to chat_sessions for ask/act tracking
ALTER TABLE public.chat_sessions 
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'act';
