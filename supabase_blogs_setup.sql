-- 1. Blog tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hızlı okuma için indexler
CREATE INDEX IF NOT EXISTS blogs_slug_idx ON public.blogs (slug);
CREATE INDEX IF NOT EXISTS blogs_status_idx ON public.blogs (status);

-- 3. Next.js'in okuyabilmesi için RLS (Row Level Security) kuralları
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Herkes yayınlanmış blogları okuyabilir
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.blogs FOR SELECT 
USING ( status = 'published' );

-- N8N servisi (Service Role) veritabanına her şeyi yazabilir (Service Role RLS'i bypass eder)
