const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname, 'scripts');
const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('scraper-') && f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(scriptsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace headless: "new" or headless: 'new' with headless: false
    content = content.replace(/headless:\s*["']new["']/g, 'headless: false');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
