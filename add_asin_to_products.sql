-- Bu kodu kopyalayip Supabase -> SQL Editor icinde "New Query" diyerek calistirmalisin.
-- Boylece mevcut "products" tablosuna "asin" kolonu eklenecektir.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS asin VARCHAR(20) UNIQUE;

-- Not: Eger ayni tablonun RLS yetkilerinde guncelleme gerekiyorsa mevcut "Public Select" zaten tum tabloyu kapsiyor.
