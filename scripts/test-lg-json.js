const { launchBrowser } = require('./browser-launcher');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await page.goto('https://www.lg.com/tr/klima/es-w18gk2f0/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));
  
  const data = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    let container = h1 ? h1.parentElement : null;
    while(container && !container.querySelector('.c-price__purchase')) {
      container = container.parentElement;
    }
    
    const priceTag = container ? container.querySelector('.c-price__purchase') : null;
    
    return {
      title: h1 ? h1.innerText : 'No h1',
      price: priceTag ? priceTag.innerText.trim() : 'No price near h1'
    };
  });
  
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
