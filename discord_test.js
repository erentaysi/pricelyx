require('dotenv').config({ path: '.env.local' });

async function runDiscordTest() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('❌ HATA: DISCORD_WEBHOOK_URL bulunamadı (.env.local dosyasını kontrol edin)');
    process.exit(1);
  }

  console.log('--- BAŞLIYOR: DISCORD WEBHOOK TESTİ ---\n');
  console.log(`Webhook URL: ${webhookUrl.substring(0, 40)}...`);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 **Piinti B2B Sistem Uyarısı (TEST)** 🚨\n**Mağaza:** Test Satıcısı\n**Hata:** \`Zararlı XML Feed Tespit Edildi veya Sunucu Çöktü!\`\n**Zaman:** \`${new Date().toISOString()}\`\nLütfen ilgili satıcının feed'ini kontrol edin veya hesabı \`suspended\` durumuna çekin.`
      })
    });

    if (res.ok) {
      console.log('✅ BAŞARILI: Discord kanalına test mesajı başarıyla iletildi! Lütfen Discord\'u kontrol edin.');
    } else {
      console.error(`❌ BAŞARISIZ: Discord sunucusu reddetti. HTTP ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('❌ HATA:', err);
  }
}

runDiscordTest();
