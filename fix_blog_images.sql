-- Piinti Blog Resimleri Düzeltme
-- Boş kalan (null) blog resimlerine standart kaliteli bir görsel atar.

UPDATE blogs 
SET image_url = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&q=80' 
WHERE image_url IS NULL;
