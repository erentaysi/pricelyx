-- Phase 2: Canonical ID ve pg_trgm eklentisi

-- 1. pg_trgm eklentisini aktif et (Fuzzy metin araması için)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. products tablosuna canonical_id kolonunu ekle
-- Eğer bu alan NULL ise, o ürün Parent (Ana) üründür.
-- Eğer doluysa, başka bir ürünün Child'ıdır.
ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 3. Hızlı eşleştirme için title üzerine trgm indexi ekle (Performans)
CREATE INDEX IF NOT EXISTS trgm_idx_products_title ON products USING GIN (title gin_trgm_ops);
