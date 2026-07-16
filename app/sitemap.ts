import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const revalidate = 86400; // Sitemap günde 1 kez güncellenir

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.piinti.com';
  
  // Statik Sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/urunler`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }
  ];

  try {
    // Tüm Ürünleri Çek
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false });

    // Tüm Kategorileri Çek
    const { data: categories } = await supabase
      .from('categories')
      .select('name');

    // Tüm Blogları Çek (Eğer blog tablosu varsa)
    const { data: blogs } = await supabase
      .from('blogs')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })
      .catch(() => ({ data: [] })); // Tablo yoksa hata fırlatmasını önle

    const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
      url: `${baseUrl}/urunler/${product.slug}`,
      lastModified: new Date(product.updated_at || new Date()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
      url: `${baseUrl}/urunler?cat=${encodeURIComponent(category.name)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    const blogPages: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticPages;
  }
}
