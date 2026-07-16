const { execSync } = require('child_process');
const path = require('path');

const SCRAPERS = [
  'civil_scraper.js',
  'ebebek_scraper.js',
  'toyzz_scraper.js',
  'joker_scraper.js',
  'kanz_scraper.js'
];

console.log("=========================================");
console.log("🚀 PIINTI TÜM BOTLARI ÇALIŞTIRMA SİSTEMİ");
console.log("=========================================\n");

for (let scraper of SCRAPERS) {
  console.log(`\n▶️ BAŞLIYOR: ${scraper}`);
  const scriptPath = path.join(__dirname, scraper);
  
  try {
    // stdio: 'inherit' konsol çıktılarını doğrudan ana ekrana yansıtır
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log(`✅ TAMAMLANDI: ${scraper}`);
  } catch (error) {
    console.error(`❌ HATA: ${scraper} çalışırken çöktü!`);
    console.error(error.message);
  }
}

console.log("\n=========================================");
console.log("🎉 TÜM BOTLAR BAŞARIYLA ÇALIŞTIRILDI!");
console.log("=========================================");
