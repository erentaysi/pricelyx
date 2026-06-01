const { execSync } = require('child_process');

console.log('🔄 Tüm scraper botları sırayla çalıştırılıyor. Lütfen bekleyin...');

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
        console.log(`\n--- ${i + 1}. ${scraper.name} Başlıyor ---`);
        try {
            execSync(`node scripts/${scraper.file}`, { stdio: 'inherit' });
        } catch (err) {
            console.error(`⚠️ ${scraper.name} çalışırken hata oluştu. Diğerlerine geçiliyor...`);
            // Continue with other scrapers even if one fails
        }
    }
    
    console.log('\n✅ Tüm botlar çalıştırıldı!');
} catch (error) {
    console.error('❌ Beklenmeyen bir hata oluştu:', error.message);
}
