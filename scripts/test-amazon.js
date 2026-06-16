const { launchBrowser } = require('./browser-launcher');
const path = require('path');
const fs = require('fs');

async function testAmazon() {
    console.log('🔍 Amazon TR Test - Sayfa yapısı inceleniyor...');
    
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    const url = 'https://www.amazon.com.tr/s?k=iphone';
    console.log(`📡 URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // 5 saniye bekle (sayfa tamamen yüklensin)
    await new Promise(r => setTimeout(r, 5000));
    
    // Screenshot al
    const screenshotPath = path.join(__dirname, 'amazon-test.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Ekran görüntüsü: ${screenshotPath}`);
    
    // Kaç ürün kartı bulunuyor?
    const counts = await page.evaluate(() => {
        return {
            // Amazon selectors
            s_result: document.querySelectorAll('[data-component-type="s-search-result"]').length,
            s_asin: document.querySelectorAll('[data-asin]').length,
            // Genel
            divCount: document.querySelectorAll('div').length,
            title: document.title,
            bodyStart: document.body.innerHTML.substring(0, 500)
        };
    });
    
    console.log('\n📊 Sayfa Analizi:');
    console.log('  Sayfa başlığı:', counts.title);
    console.log('  [data-component-type="s-search-result"] sayısı:', counts.s_result);
    console.log('  [data-asin] sayısı:', counts.s_asin);
    console.log('  Toplam div sayısı:', counts.divCount);
    
    // İlk 500 karakter
    console.log('\n📄 Body başlangıcı:');
    console.log(counts.bodyStart);
    
    await browser.close();
    console.log('\n✅ Test tamamlandı!');
}

testAmazon().catch(console.error);
