-- ==========================================
-- ROTA 2: KULLANICI SADAKATİ (AUTH & FAVORİLER)
-- ==========================================

-- 1. YENİ TABLO: User Profiles (Kullanıcı Profilleri)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profilleri herkes görebilir." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Otomatik Profil Oluşturma Trigger'ı (Kullanıcı kayıt olduğunda otomatik profil satırı açar)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sadece eğer trigger yoksa oluşturur (PostgreSQL Drop/Create pattern)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. YENİ TABLO: User Favorites (Kullanıcı Favorileri)
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, product_id) -- Aynı ürüne iki kez favori atılamaz
);

-- RLS for Favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar sadece kendi favorilerini görebilir." 
  ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar yalnızca kendi listesine favori ekleyebilir." 
  ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi favorilerini silebilir." 
  ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- 3. MEVCUT TABLO GÜNCELLEMESİ: Price Alerts
-- price_alerts tablosuna user_id alanını ekle (zaten yoksа)
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='price_alerts' AND column_name='user_id'
  ) THEN
      ALTER TABLE public.price_alerts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS for Price Alerts (Artık giriş yapanlar kendi alarmlarını da çekecek)
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Mevcut 'email' üzerinden misafir erişimlerini veya anonim postları bozmamak için geniş bir Policy:
CREATE POLICY "Kullanıcılar kendi alarmlarını veya e-postalarını görebilir." 
  ON public.price_alerts FOR SELECT USING (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );

CREATE POLICY "Herkes alarm kurabilir (anonim dahil)." 
  ON public.price_alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Kullanıcılar kendi alarmlarını güncelleyebilir." 
  ON public.price_alerts FOR UPDATE USING (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );
