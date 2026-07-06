require('dotenv').config({path:'./.env.local'});
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const { data: prices, error } = await supabase
      .from('product_prices')
      .select('product_id, product_url, products!inner(id, title, image_url)')
      .eq('vendor_id', 15)
      .is('products.image_url', null);

    if (error) { console.error('DB error', error); return; }
    console.log(`Found ${prices.length} Toyzz Shop products with null images.`);

    for (const p of prices) {
      console.log(`Processing: ${p.product_url}`);
      const page = await browser.newPage();
      try {
        await page.goto(p.product_url, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Wait for product image specifically just in case
        try { await page.waitForSelector('img[src*="cdn.toyzzshop.com/product"]', {timeout: 5000}); } catch(e){}
        
        const imgSrc = await page.evaluate(() => {
          const og = document.querySelector('meta[property="og:image"]');
          if (og && og.content) return og.content;
          
          const img = document.querySelector('img[src*="cdn.toyzzshop.com/product"]') ||
                      document.querySelector('.product-image img') || 
                      document.querySelector('img.lazyload[src*="product"]');
          return img ? img.src : null;
        });
        
        console.log(`Found image: ${imgSrc}`);
        if (imgSrc && imgSrc.includes('http') && !imgSrc.includes('video_play.svg')) {
           const { error: updErr } = await supabase.from('products').update({ image_url: imgSrc }).eq('id', p.product_id);
           if (updErr) console.error(`Update error for ${p.product_id}:`, updErr);
           else console.log(`Successfully updated ${p.product_id}`);
        } else {
           console.log(`Invalid image found for ${p.product_id}`);
        }
      } catch (err) {
        console.error(`Page error for ${p.product_url}:`, err.message);
      } finally {
        await page.close();
      }
    }
  } catch (err) {
    console.error('Fatal err:', err);
  } finally {
    await browser.close();
  }
})();
