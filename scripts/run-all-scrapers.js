const { execSync } = require('child_process');
const path = require('path');

// Projenin kök dizini
const rootDir = path.join(__dirname, '..');

console.log('🔄 Tüm scraper botları sırayla çalıştırılıyor. Lütfen bekleyin...');
console.log(`📁 Çalışma dizini: ${rootDir}\n`);

const scrapers = [
    { name: 'Amazon TR', file: 'scraper-amazontr.js' },
    { name: 'Hepsiburada', file: 'scraper-hepsiburada.js' },
    { name: 'Trendyol', file: 'scraper-trendyol.js' },
    { name: 'N11', file: 'scraper-n11.js' },
    { name: 'PttAVM', file: 'scraper-pttavm.js' },
    { name: 'MediaMarkt', file: 'scraper-mediamarkt.js' },
    { name: 'Vatan Bilgisayar', file: 'scraper-vatan.js' },
    { name: 'Pazarama', file: 'scraper-pazarama.js' },
    { name: 'Teknosa', file: 'scraper-teknosa.js' },
    { name: 'Çiçeksepeti', file: 'scraper-ciceksepeti.js' }
];

try {
    for (let i = 0; i < scrapers.length; i++) {
        const scraper = scrapers[i];
        console.log(`\n--- ${i + 1}/${scrapers.length}: ${scraper.name} Başlıyor ---`);
        try {
            execSync(`node scripts/${scraper.file}`, { 
                stdio: 'inherit',
                cwd: rootDir  // Her zaman proje kök dizininden çalıştır
            });
            console.log(`✅ ${scraper.name} tamamlandı.`);
        } catch (err) {
            console.error(`⚠️ ${scraper.name} çalışırken hata oluştu. Diğerlerine geçiliyor...`);
        }
    }
    
    console.log('\n🎉 Tüm botlar çalıştırıldı!');
} catch (error) {
    console.error('❌ Beklenmeyen bir hata oluştu:', error.message);
}
