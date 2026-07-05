-- Piinti E-bebek Altyapı Güncellemesi

-- 1. product_prices tablosuna affiliate_url kolonu ekleyelim
ALTER TABLE product_prices ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

-- 2. e-bebek mağazasını vendors tablosuna ekleyelim (eğer yoksa)
INSERT INTO vendors (name, logo, color)
SELECT 'e-bebek', 'https://cdn.e-bebek.com/y.png', '#e3000f'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'e-bebek');
