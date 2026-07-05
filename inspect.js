const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  await page.goto('https://www.e-bebek.com/bebek-bezi-c4004', { waitUntil: 'networkidle2' });
  
  const html = await page.evaluate(() => {
     const p = document.querySelector('body');
     return p ? p.innerHTML.substring(0, 5000) : 'no body';
  });
  
  console.log('--- FOUND HTML ---');
  console.log(html);
  
  const productHtml = await page.evaluate(() => {
     // attempt to find product cards based on common ecommerce classes
     const cards = document.querySelectorAll('div[class*="product-item"], div[class*="product-card"], a[href*="/p-"]');
     if(cards.length > 0) return cards[0].outerHTML;
     return 'No typical product cards found';
  });
  
  console.log('--- PRODUCT HTML ---');
  console.log(productHtml);
  
  await browser.close();
})();
