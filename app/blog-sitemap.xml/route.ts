import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = 'https://www.piinti.com';
  
  const { data: blogs } = await supabase
    .from('blogs')
    .select('slug, updated_at, published_at')
    .eq('status', 'published');

  const blogUrls = (blogs || []).map((blog) => {
    const lastMod = new Date(blog.updated_at || blog.published_at || new Date()).toISOString();
    return `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${blogUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'
    }
  });
}
