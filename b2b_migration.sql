-- ============================================================
-- b2b_migration.sql
-- Piinti.com — B2B Satıcı Paneli ve Güvenlik Altyapısı
-- Bu scripti Supabase -> SQL Editor icinde calistirin.
-- ============================================================

-- 1. Vendors Tablosuna B2B Sütunlarını Ekleme
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
ADD COLUMN IF NOT EXISTS xml_feed_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- 2. Vendor Users Tablosu (Supabase Auth ile Vendor_id Eşleştirme)
CREATE TABLE IF NOT EXISTS vendor_users (
  id SERIAL PRIMARY KEY,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_id)
);

-- 3. Feed Sync Logs Tablosu (Kalıcı Senkronizasyon Geçmişi - User İsteği)
CREATE TABLE IF NOT EXISTS feed_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial_error'
  error_details TEXT, -- JSON veya string detayları
  items_processed INT DEFAULT 0,
  items_rejected INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ürün Fiyatlarına last_updated_at Ekleme (48/72 Saat Kuralı İçin)
ALTER TABLE product_prices
ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Row Level Security (RLS) Aktivasyonu
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_sync_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLİTİKALARI
-- ==========================================

-- Vendor Users: Sadece kendisi okuyabilir
CREATE POLICY "Satıcılar kendi yetki kayıtlarını görebilir"
ON vendor_users FOR SELECT USING (auth_id = auth.uid());

-- Vendors: Herkes dükkanları görebilir (ürün listesi vs. için lazım)
CREATE POLICY "Herkes mağazaları görebilir"
ON vendors FOR SELECT USING (true);

-- Vendors: Satıcılar sadece kendi profillerini güncelleyebilir VE suspended değilse
CREATE POLICY "Satıcılar sadece bekleyen/onaylı mağazalarını güncelleyebilir"
ON vendors FOR UPDATE USING (
  id IN (SELECT vendor_id FROM vendor_users WHERE auth_id = auth.uid()) 
  AND status != 'suspended'
);

-- Product Prices: Herkes okuyabilir (Site ziyaretçileri fiyatları görmeli)
CREATE POLICY "Herkes fiyatları okuyabilir"
ON product_prices FOR SELECT USING (true);

-- Product Prices: YAZMA (Sıfır Güven/Zero Trust)
-- Bir fiyat değişikliği yapılması için: 
-- 1) İstek atan kişinin auth_id'si vendor_users'da olmalı
-- 2) Bu vendor'ın durumu KESİNLİKLE 'approved' olmalı (pending veya suspended olanlar red yer)
CREATE POLICY "Sadece approved satıcılar kendi fiyatlarını yazabilir/güncelleyebilir"
ON product_prices FOR ALL USING (
  vendor_id IN (
    SELECT vu.vendor_id 
    FROM vendor_users vu
    JOIN vendors v ON v.id = vu.vendor_id
    WHERE vu.auth_id = auth.uid() AND v.status = 'approved'
  )
);

-- Feed Sync Logs: Satıcılar kendi geçmiş hatalarını görebilir
CREATE POLICY "Satıcılar kendi loglarını görebilir"
ON feed_sync_logs FOR SELECT USING (
  vendor_id IN (SELECT vendor_id FROM vendor_users WHERE auth_id = auth.uid())
);
