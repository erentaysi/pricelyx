-- Bu kodlari kopyalayip Supabase -> SQL Editor icinde "New Query" diyerek calistirmalisin.
-- Boylece Apify + n8n + sitemizin iletisim kuracagi tablolar otomatik yaratitilacak!

-- Eger tablolar onceden varsa once onlari silelim ki cakismasin (CASCADE: tablolara bagli diger tablolari da siler)
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS product_prices CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(50)
);

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  brand_id INT REFERENCES brands(id),
  category_id INT REFERENCES categories(id),
  image_url TEXT,
  rating DECIMAL(3, 1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_trend BOOLEAN DEFAULT FALSE,
  specs JSONB, -- Teknik ozellikleri tutmak icin (Orn: {"Ekran": "6.7 inç", "RAM": "8GB"})
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  logo VARCHAR(50),
  color VARCHAR(50)
);

CREATE TABLE product_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2), -- Indirim varsa kullanilacak
  shipping_info VARCHAR(255),
  product_url TEXT NOT NULL, -- Amazon veya Trendyol satinalma linki
  in_stock BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, vendor_id) -- Ayni saticinin bir urune ait sadece bir guncel fiyati olabilir
);

CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_reviews (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  rating INT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TEST VERİSİ
INSERT INTO vendors (name, logo, color) VALUES ('Amazon TR', '📦', '#FF9900');
INSERT INTO categories (name, slug, icon) VALUES ('Akıllı Telefon', 'akilli-telefon', '📱');
INSERT INTO categories (name, slug, icon) VALUES ('Bilgisayar', 'bilgisayar', '💻');

-- =========================================================================
-- KRİTİK GÜVENLİK AYARLARI (ROW LEVEL SECURITY - RLS)
-- =========================================================================

-- 1. RLS'yi her tablo icin aktif et (Bu komut olmadan herkes her seyi yapabilir!)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- 2. Herkesin verileri GORMESİNE (SELECT) izin ver (Musteriler icin gerekli)
CREATE POLICY "Public Select" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Select" ON brands FOR SELECT USING (true);
CREATE POLICY "Public Select" ON products FOR SELECT USING (true);
CREATE POLICY "Public Select" ON vendors FOR SELECT USING (true);
CREATE POLICY "Public Select" ON product_prices FOR SELECT USING (true);
CREATE POLICY "Public Select" ON price_history FOR SELECT USING (true);
CREATE POLICY "Public Select" ON product_reviews FOR SELECT USING (true);

-- 3. YAZMA/SİLME yetkilerini varsayilan olarak HERKESE KAPALT (Whitelist mantigi)
-- Admin paneli veya n8n ingest icin 'service_role' key kullanılmalı, 'anon' key ise sadece SELECT yapabilir.
