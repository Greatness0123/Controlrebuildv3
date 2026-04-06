-- Add agent_host column to virtual_machines table for VM agent WebSocket connection
ALTER TABLE public.virtual_machines 
  ADD COLUMN IF NOT EXISTS agent_host TEXT;
