-- Migration: products tablosuna barcode kolonu ve index eklenmesi
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
