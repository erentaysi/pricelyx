import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateSeoSlug } from '@/lib/utils';

export async function GET() {
  const baseUrl = 'https://www.piinti.com';
  
  const { data: brands } = await supabase
    .from('brands')
    .select('name');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(brands || []).map((brand) => `
  <url>
    <loc>${baseUrl}/marka/${generateSeoSlug(brand.name)}</loc>
    <changefreq>weekly</changefreq>
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
