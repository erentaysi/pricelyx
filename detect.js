(async () => {
  try {
    const r = await fetch('https://www.toyzzshop.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log('--- HEADERS ---');
    for (const [key, value] of r.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    const html = await r.text();
    console.log('\n--- PLATFORM HINTS ---');
    if (html.includes('Ideasoft')) console.log('Found Ideasoft');
    if (html.includes('Ticimax')) console.log('Found Ticimax');
    if (html.includes('T-Soft') || html.toLowerCase().includes('tsoft')) console.log('Found T-Soft');
    if (html.includes('Akinon')) console.log('Found Akinon');
    if (html.includes('Shopify')) console.log('Found Shopify');
    if (html.includes('vtex')) console.log('Found VTEX');
    if (html.includes('magento')) console.log('Found Magento');
    if (html.includes('__NEXT_DATA__')) console.log('Found Next.js (Custom/Headless)');
    if (html.includes('nuxt')) console.log('Found Nuxt.js');
    if (html.includes('Inveon')) console.log('Found Inveon');
    if (html.includes('Proje:')) console.log('Found Custom Signature');
    
    // Also look for common API endpoints or script patterns
    const scripts = html.match(/<script.*?src=.*?<\/script>/g) || [];
    console.log('\n--- SCRIPTS ---');
    console.log(scripts.slice(0, 10).join('\n'));
    
    // Find some links
    const links = html.match(/href=[\"'](\/.*?)[\"']/g) || [];
    console.log('\n--- API HINTS IN LINKS ---');
    console.log(links.filter(l => l.includes('api') || l.includes('json')).slice(0, 5));
    
  } catch(e) { console.error('Fetch fail', e.message); }
})();
