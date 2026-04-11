const cron = require('node-cron');
const chalk = require('chalk');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

// Supabase Kurulumu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Nodemailer Kurulumu (Gmail üzerinden test amaçlı, ENV değişkenlerinden okunur)
// Kullanıcı sonrasında kendi SMTP ayarlarını girebilir
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || 'seninpiintiadresin@gmail.com', // .env.local içerisine MAIL_USER eklenecek
    pass: process.env.MAIL_PASS || 'senin-app-password-sifren'    // .env.local içerisine MAIL_PASS eklenecek
  }
});

function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString('tr-TR');
    if(type === 'info') console.log(chalk.cyan(`[${time}] [BİLGİ] `) + msg);
    if(type === 'success') console.log(chalk.green(`[${time}] [BAŞARI] `) + msg);
    if(type === 'warn') console.log(chalk.yellow(`[${time}] [UYARI] `) + msg);
    if(type === 'error') console.log(chalk.red(`[${time}] [HATA] `) + msg);
}

// Scraper Çalıştırma Modülü
function runScraper(scriptName) {
    return new Promise((resolve, reject) => {
        log(`${scriptName} motoru ateşlendi...`, 'info');
        const process = exec(`node scripts/${scriptName}`);

        process.stdout.on('data', (data) => console.log(chalk.gray(`  └ ${data.trim()}`)));
        process.stderr.on('data', (data) => console.log(chalk.red(`  └ ${data.trim()}`)));

        process.on('close', (code) => {
            if (code === 0) {
                log(`${scriptName} sorunsuz tamamlandı.`, 'success');
                resolve();
            } else {
                log(`${scriptName} işleminde hata oluştu (Kod: ${code}).`, 'error');
                resolve(); // Reject instead of crashing the brain so other processes run
            }
        });
    });
}

// Mail Şablonu Oluşturucu
function createEmailTemplate(title, targetPrice, currentPrice, productUrl) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">PIINTI <span style="color: #14b8a6;">ALARM</span></h1>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0;">Fiyat Zili Çaldı! 🔔</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6;">
                Hedeflediğin fiyat barajı aşıldı! Takip ettiğin ürünün fiyatı senin beklentinin de altına düştü. Hemen yakala:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #334155; margin-top: 0;">${title}</h3>
                <p style="margin: 8px 0; color: #64748b;">Senin Beklediğin: <b style="color: #0f172a;">${targetPrice} ₺</b></p>
                <p style="margin: 8px 0; color: #10b981; font-size: 18px; font-weight: bold;">Şu Anki Fiyat: <span>${currentPrice} ₺</span></p>
            </div>
            <a href="${productUrl}" style="display: block; width: 100%; background-color: #0f172a; color: #ffffff; text-align: center; padding: 16px 0; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">Ürüne Git ve İndirimi Kap</a>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Bu e-posta sana Piinti Akıllı Fiyat Asistanı tarafından gönderildi.<br>piinti.com</p>
        </div>
    </div>
    `;
}

// Alarmları Kontrol Etme Modülü
async function checkPriceAlerts() {
    log('Fiyat alarmları denetleniyor...', 'info');
    
    const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('*, products(title, id)')
        .eq('is_active', true);

    if (error) {
        log(`Alarm sorgulama hatası: ${error.message}`, 'error');
        return;
    }

    if (!alerts || alerts.length === 0) {
        log('Aksiyon bekleyen aktif fiyat alarmı yok.', 'info');
        return;
    }

    log(`${alerts.length} adet aktif alarm inceleniyor...`, 'info');

    let triggeredCount = 0;

    // Helper to generate SEO slugs identical to Next.js
    const generateSlug = (title, id) => {
        const trMap = { 'ç':'c', 'ğ':'g', 'ı':'i', 'ö':'o', 'ş':'s', 'ü':'u', 'Ç':'c', 'Ğ':'g', 'İ':'i', 'Ö':'o', 'Ş':'s', 'Ü':'u'};
        const slug = title.toLowerCase().replace(/[çğıöşüÇĞİÖŞÜ]/g, m => trMap[m]).replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
        return `${slug}-${id}`;
    };

    for (const alert of alerts) {
        // İlgili ürünün fiyatlarını çek
        const { data: pricesData } = await supabase
            .from('product_prices')
            .select('price')
            .eq('product_id', alert.product_id);

        if (!pricesData || pricesData.length === 0) continue;

        const currentMinPrice = Math.min(...pricesData.map(p => p.price));

        if (currentMinPrice <= alert.target_price) {
            // Alarm tetiklendi! E-posta gönderilecek.
            log(`ALARM! [${alert.email}] için [${alert.products.title}] fiyatı ${currentMinPrice} ₺'ye düştü! (Hedef: ${alert.target_price})`, 'success');
            
            const productUrl = `https://piinti.com/urun/${generateSlug(alert.products.title, alert.products.id)}`;
            
            try {
                // Şimdilik Mail ayarları aktif olmadığı için sadece konsola basalım veya try-catch içerisinde sönümlendirelim.
                if(process.env.MAIL_USER && process.env.MAIL_PASS) {
                    await transporter.sendMail({
                        from: `"Piinti Fiyat Zili" <${process.env.MAIL_USER}>`,
                        to: alert.email,
                        subject: `🚨 Fiyat Düştü: Seçtiğin Ürün İndirimde!`,
                        html: createEmailTemplate(alert.products.title, alert.target_price, currentMinPrice, productUrl)
                    });
                    log(`E-Posta fırlatıldı: ${alert.email}`, 'success');
                } else {
                    log(`SMTP (MAIL_USER) ayarı bulunmadığı için mail gönderimi simüle edildi: ${alert.email}`, 'warn');
                }

                // Gönderildi olarak işaretle
                await supabase
                    .from('price_alerts')
                    .update({ is_active: false })
                    .eq('id', alert.id);

                triggeredCount++;
            } catch (err) {
                log(`Gönderim veya Güncelleme Hatası: ${err.message}`, 'error');
            }
        }
    }

    log(`Denetim bitti. ${triggeredCount} adet fırsat hedefi vuruldu.`, 'success');
}

// Ana Operatör Devresi
async function startNeuralNetwork() {
    log('Piinti Oto-Zeka (Brain) Ağları Aktifleştiriliyor...', 'warn');
    console.log(chalk.cyan(`
      \\ \\ / /
       \\ V / 
        | |  PIINTI
        | |  AUTONOMOUS
        |_|  BRAIN v1.0
    `));
    
    const runSequence = async () => {
        log('--- RUTİN AV DÖNGÜSÜ BAŞLADI ---', 'info');
        
        await runScraper('scraper-trendyol.js');
        // İstersen burada saniye bekleme ekleyebilirsin: await new Promise(r => setTimeout(r, 5000));
        await runScraper('scraper-hepsiburada.js');
        await runScraper('scraper-amazontr.js');
        
        await checkPriceAlerts();
        log('--- RUTİN AV DÖNGÜSÜ TAMAMLANDI ---', 'info');
    };

    // Zamanlayıcı (Cron) - Her sabah 09:00 ve akşam 21:00'da çalışır
    // format: 'dakika saat gün ay haftanıngünü'
    cron.schedule('0 9,21 * * *', () => {
        log('Zamanlanmış operasyon tetiklendi (CRON).', 'warn');
        runSequence();
    });

    log('Kritik saatler (09:00 ve 21:00) bekleniyor. Manuel test için tetikleniyor...', 'info');
    // Kurulum sonrası çalıştığını görmek için script başlar başlamaz 1 kez manuel tarama yapar:
    runSequence();
}

startNeuralNetwork();
