async function test() {
  console.log('Testing products-sitemap.xml...');
  let res = await fetch('http://localhost:3000/products-sitemap.xml');
  console.log('Status:', res.status);
  console.log('Content Start:', (await res.text()).substring(0, 150));

  console.log('\nTesting categories-sitemap.xml...');
  res = await fetch('http://localhost:3000/categories-sitemap.xml');
  console.log('Status:', res.status);
  console.log('Content Start:', (await res.text()).substring(0, 150));

  console.log('\nTesting product page...');
  const slugUrl = 'http://localhost:3000/urunler/apple-iphone-15-512-gb-mavi-fiyatlari';
  res = await fetch(slugUrl);
  console.log('Product URL Status:', res.status);
  const html = await res.text();
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
  console.log('<title>:', titleMatch ? titleMatch[1] : 'Not Found');
  
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/);
  console.log('<meta description>:', descMatch ? descMatch[1] : 'Not Found');
  
  const ldJsonExists = html.includes('application/ld+json');
  console.log('<script type="application/ld+json"> exists:', ldJsonExists);

  console.log('\nTesting 301 redirect...');
  // Pass redirect: 'manual' to catch the 301/302 response
  res = await fetch('http://localhost:3000/urun/ee794aa1-8d12-462d-968e-e87d1d854649', { redirect: 'manual' });
  console.log('Redirect Status:', res.status);
  console.log('Redirect Location:', res.headers.get('location'));
}
test();
