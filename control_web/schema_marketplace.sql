-- Workflow Marketplace Database Schema

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    workflow_name TEXT NOT NULL,
    workflow_data JSONB,
    price DECIMAL(10, 2) DEFAULT 0,
    description TEXT,
    category TEXT DEFAULT 'productivity',
    stars INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace comments table
CREATE TABLE IF NOT EXISTS marketplace_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace stars table
CREATE TABLE IF NOT EXISTS marketplace_stars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(listing_id, user_id)
);

-- Marketplace purchases table
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(listing_id, buyer_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_stars ON marketplace_listings(stars DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_listing ON marketplace_comments(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_stars_listing ON marketplace_stars(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);

-- RLS Policies
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

-- Marketplace listings policies
CREATE POLICY "Public marketplace listings are viewable by everyone"
    ON marketplace_listings FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can insert their own listings"
    ON marketplace_listings FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own listings"
    ON marketplace_listings FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own listings"
    ON marketplace_listings FOR DELETE
    USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
    ON marketplace_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert comments"
    ON marketplace_comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
    ON marketplace_comments FOR DELETE
    USING (auth.uid() = author_id);

-- Stars policies
CREATE POLICY "Stars are viewable by everyone"
    ON marketplace_stars FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert/delete stars"
    ON marketplace_stars FOR ALL
    USING (auth.uid() = user_id);

-- Purchases policies  
CREATE POLICY "Purchases are viewable by buyer and author"
    ON marketplace_purchases FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = (
        SELECT author_id FROM marketplace_listings 
        WHERE id = marketplace_purchases.listing_id
    ));

CREATE POLICY "Authenticated users can insert purchases"
    ON marketplace_purchases FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);