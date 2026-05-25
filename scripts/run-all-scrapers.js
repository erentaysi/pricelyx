const { execSync } = require('child_process');

console.log('🔄 Tüm scraper botları sırayla çalıştırılıyor. Lütfen bekleyin...');

try {
    console.log('--- 1. Amazon TR Başlıyor ---');
    execSync('node scripts/scraper-amazontr.js', { stdio: 'inherit' });
    
    console.log('--- 2. Hepsiburada Başlıyor ---');
    execSync('node scripts/scraper-hepsiburada.js', { stdio: 'inherit' });
    
    console.log('--- 3. Trendyol Başlıyor ---');
    execSync('node scripts/scraper-trendyol.js', { stdio: 'inherit' });
    
    console.log('--- 4. N11 Başlıyor ---');
    execSync('node scripts/scraper-n11.js', { stdio: 'inherit' });
    
    console.log('✅ Tüm botlar başarıyla çalıştı ve veritabanı doldu!');
} catch (error) {
    console.error('❌ Botlar çalışırken bir hata oluştu:', error.message);
}
