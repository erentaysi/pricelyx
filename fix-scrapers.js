const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, 'scripts');
const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('scraper-') && f.endsWith('.js'));

const oldLaunch = `const browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.CHROME_PATH || 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });`;

const oldLaunch2 = `const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: process.env.CHROME_PATH || "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });`;

const oldLaunch3 = `const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: process.env.CHROME_PATH || "C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });`;

const newLaunch = `const browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.CHROME_PATH || 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--disable-blink-features=AutomationControlled'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null
    });`;

let fixedCount = 0;

files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content
        .replace(/const browser = await puppeteer\.launch\(\{[\s\S]*?headless: false,[\s\S]*?args: \['--no-sandbox'[^\]]*\][\s\S]*?\}\);/g, newLaunch);
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ Güncellendi: ${file}`);
        fixedCount++;
    } else {
        console.log(`⏭️ Değişmedi: ${file}`);
    }
});

console.log(`\n${fixedCount} dosya güncellendi.`);
