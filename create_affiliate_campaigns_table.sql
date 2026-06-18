-- =========================================================================
-- AFFILIATE CAMPAIGNS (KUPON & KAMPANYA) TABLOSU
-- Admitad ve ReklamStore gibi ağlardan gelecek veriler için
-- =========================================================================

CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL, -- 'admitad' veya 'reklamstore'
  campaign_name VARCHAR(255) NOT NULL, -- Örn: 'Decathlon'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  promo_code VARCHAR(100),
  discount_info VARCHAR(100), -- Örn: '%10', '50 TL', 'Ücretsiz Kargo'
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  tracking_link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source, tracking_link) -- Aynı linki tekrar eklememek için
);

-- RLS (Row Level Security) Ayarları
ALTER TABLE affiliate_campaigns ENABLE ROW LEVEL SECURITY;

-- Sitedeki ziyaretçilerin okuyabilmesi için PUBLIC SELECT izni
CREATE POLICY "Public Select Campaigns" ON affiliate_campaigns FOR SELECT USING (true);
