-- =========================================================================
-- PİİNTİ KAMPANYALAR MODÜLÜ VERİTABANI ŞEMASI
-- Bu kodları kopyalayıp Supabase -> SQL Editor içinde "New Query" diyerek çalıştırın.
-- =========================================================================

-- 1. Tabloyu oluştur
CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  campaign_name VARCHAR(100) NOT NULL,
  description TEXT,
  tracking_link TEXT,
  promo_code VARCHAR(50),
  discount_info VARCHAR(50),
  date_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS (Row Level Security) Ayarları
ALTER TABLE affiliate_campaigns ENABLE ROW LEVEL SECURITY;

-- 3. Ziyaretçiler için Okuma İzni
CREATE POLICY "Public Select Campaigns" ON affiliate_campaigns FOR SELECT USING (true);

-- 4. Service role için INSERT izni (N8N ve script'ler için)
CREATE POLICY "Service Insert Campaigns" ON affiliate_campaigns FOR INSERT WITH CHECK (true);
