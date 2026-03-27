-- Workflows Table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    trigger JSONB DEFAULT '{"type": "none"}'::jsonb,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    last_execution_request JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workflows" ON public.workflows
    FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Trigger for workflows updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user ON public.workflows(user_id);
