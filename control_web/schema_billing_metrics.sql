-- Billing Metrics table for reliable analytics and billing dashboards
-- This table stores per-request usage data independently from the user profile

CREATE TABLE IF NOT EXISTS public.billing_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('ask', 'act')),
    tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for billing_metrics
ALTER TABLE public.billing_metrics ENABLE ROW LEVEL SECURITY;

-- Users can read their own billing metrics
CREATE POLICY "Users read own billing metrics" ON public.billing_metrics
    FOR SELECT TO authenticated
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Service role (backend) can insert billing metrics
CREATE POLICY "Service can insert billing metrics" ON public.billing_metrics
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Index for efficient daily aggregation queries
CREATE INDEX IF NOT EXISTS idx_billing_metrics_user_date 
    ON public.billing_metrics(user_id, created_at::date);

CREATE INDEX IF NOT EXISTS idx_billing_metrics_user_mode 
    ON public.billing_metrics(user_id, mode);