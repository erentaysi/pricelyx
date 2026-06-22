import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const baseUrl = 'https://www.piinti.com';
  
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .not('slug', 'is', null);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(products || []).map((product) => `
  <url>
    <loc>${baseUrl}/urunler/${product.slug}</loc>
    <lastmod>${product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'
    }
  });
}
