const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const BROWSER_PATHS = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowserPath() {
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }
    for (const p of BROWSER_PATHS) {
        if (fs.existsSync(p)) {
            console.log(`🌐 Tarayıcı bulundu: ${p}`);
            return p;
        }
    }
    throw new Error('❌ Hiçbir tarayıcı bulunamadı!');
}

async function launchBrowser() {
    const executablePath = findBrowserPath();
    
    // Edge zaten açıkken çakışma olmaması için geçici profil klasörü kullan
    const tmpProfile = path.join(os.tmpdir(), 'piinti-scraper-' + Date.now());
    
    const browser = await puppeteer.launch({
        headless: false,
        executablePath,
        userDataDir: tmpProfile,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080',
            '--no-first-run',
            '--no-default-browser-check',
        ]
    });
    return browser;
}

module.exports = { launchBrowser };
