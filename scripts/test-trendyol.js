const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

async function testTrendyol() {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.CHROME_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log("Navigating to Trendyol...");
    await page.goto('https://www.trendyol.com/sr?q=iphone', { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log("Taking screenshot...");
    await page.screenshot({ path: 'C:\\Users\\EREN\\Desktop\\PİİNTİ\\scripts\\trendyol-test.png' });
    
    console.log("Extracting HTML...");
    const html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('C:\\Users\\EREN\\Desktop\\PİİNTİ\\scripts\\trendyol-test.html', html);
    
    console.log("Done.");
    await browser.close();
}

testTrendyol().catch(console.error);
