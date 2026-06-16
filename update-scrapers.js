/**
 * Tüm scraper dosyalarındaki puppeteer.launch çağrısını
 * ortak browser-launcher.js modülünü kullanacak şekilde günceller.
 */
const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, 'scripts');
const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('scraper-') && f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1) puppeteer-extra require'larını kaldır, browser-launcher ile değiştir
    // puppeteer-extra ve StealthPlugin satırlarını sil
    let newContent = content;
    
    // Add browser-launcher import if not already there
    if (!newContent.includes('browser-launcher')) {
        // Remove old puppeteer-extra imports
        newContent = newContent.replace(/const puppeteer = require\('puppeteer-extra'\);\nconst StealthPlugin = require\('puppeteer-extra-plugin-stealth'\);\npuppeteer\.use\(StealthPlugin\(\)\);\n/g, '');
        newContent = newContent.replace(/const puppeteer = require\("puppeteer-extra"\);\nconst StealthPlugin = require\("puppeteer-extra-plugin-stealth"\);\npuppeteer\.use\(StealthPlugin\(\)\);\n/g, '');
        
        // Add browser-launcher import at the top
        newContent = `const { launchBrowser } = require('./browser-launcher');\n` + newContent;
    }
    
    // 2) Replace puppeteer.launch({...}) calls with launchBrowser()
    newContent = newContent.replace(
        /const browser = await puppeteer\.launch\(\{[\s\S]*?\}\);/g,
        'const browser = await launchBrowser();'
    );
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Güncellendi: ${file}`);
    } else {
        console.log(`⏭️ Değişiklik yok: ${file}`);
    }
});

console.log('\n✅ Tüm scraper\'lar güncellendi!');
