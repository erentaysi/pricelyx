CREATE TABLE IF NOT EXISTS clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,          -- Anonim cookie ID (IP yerine)
    is_affiliate BOOLEAN DEFAULT FALSE -- Affiliate link mi ham link mi?
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_product_id ON clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_clicks_vendor_id ON clicks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
