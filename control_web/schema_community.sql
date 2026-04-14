-- Community Comments Table for Feedback

CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    likes INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read, authenticated users can create
CREATE POLICY "Anyone can read community comments" ON public.community_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.community_comments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.community_comments
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.community_comments
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON public.community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created ON public.community_comments(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON public.community_comments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();