-- Allow service role to manage users (bypasses RLS)
-- This ensures the backend can update user usage counts even when using service key

CREATE POLICY "Service role can update users" ON public.users
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Also allow service role to insert billing metrics
CREATE POLICY "Service role can insert billing metrics" ON public.billing_metrics
    FOR INSERT TO service_role
    WITH CHECK (true);