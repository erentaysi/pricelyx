const { launchBrowser } = require('./browser-launcher');

(async () => {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto('https://www.lg.com/tr/buzdolabi/dondurucu-ustte-buzdolabi/gr-b632glqw/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 6000));
    
    const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1') ? document.querySelector('h1').innerText : null;
        const sku = document.querySelector('.sku') ? document.querySelector('.sku').innerText : null;
        const headTitle = document.title;
        const title2 = document.querySelector('.c-product-item__title') ? document.querySelector('.c-product-item__title').innerText : null;
        const cModelName = document.querySelector('.c-model-name') ? document.querySelector('.c-model-name').innerText : null;
        const basicName = document.querySelector('.c-product-basic-info__name') ? document.querySelector('.c-product-basic-info__name').innerText : null;
        const imgTags = Array.from(document.querySelectorAll('.cmp-image__image, img[data-src], img')).map(img => img.src || img.getAttribute('data-src')).filter(Boolean).slice(0, 10);
        return { h1, sku, headTitle, title2, cModelName, basicName, imgTags };
    });
    console.log(JSON.stringify(data, null, 2));
    await browser.close();
})();
