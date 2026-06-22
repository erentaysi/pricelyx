import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://www.piinti.com';
  
  const sitemaps = [
    `${baseUrl}/products-sitemap.xml`,
    `${baseUrl}/categories-sitemap.xml`,
    `${baseUrl}/brands-sitemap.xml`,
    `${baseUrl}/blog-sitemap.xml`
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps.map((url) => `
  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'
    }
  });
}
