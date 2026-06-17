-- =========================================================================
-- PİİNTİ BLOG MODÜLÜ VERİTABANI ŞEMASI
-- Bu kodları kopyalayıp Supabase -> SQL Editor içinde "New Query" diyerek çalıştırın.
-- =========================================================================

-- 1. Tabloyu oluştur
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS (Row Level Security) Ayarları
-- Bu tabloyu güvenlik için korumaya alıyoruz
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- 3. Ziyaretçiler için Okuma İzni
-- Sitedeki herkesin (kayıtlı olmayan ziyaretçilerin) blogları okuyabilmesi için select izni veriyoruz
CREATE POLICY "Public Select Blogs" ON blogs FOR SELECT USING (true);

-- 4. (İsteğe Bağlı) Admin/Service Role zaten her şeyi yapabileceği için INSERT/UPDATE politikası eklememize gerek yok.
