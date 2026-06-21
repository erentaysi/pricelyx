-- Kategori tablosuna hiyerarşik yapı için parent_id kolonu ekleme
ALTER TABLE public.categories
ADD COLUMN parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL;

-- Eğer mevcut kategorilerde varsa, her ihtimale karşı index eklemek performans sağlar
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
