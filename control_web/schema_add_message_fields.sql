-- Add missing columns to chat_messages for thought process and HITL support
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS is_thought BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS hitl_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS action_status TEXT CHECK (action_status IN ('running', 'done', NULL));