require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 1. Admitad'dan Bearer Token Al
async function getAdmitadToken() {
  return new Promise((resolve, reject) => {
    const postData = `grant_type=client_credentials&client_id=${process.env.ADMITAD_CLIENT_ID}&scope=coupons_for_website advcampaigns`;
    
    const options = {
      hostname: 'api.admitad.com',
      path: '/token/',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${process.env.ADMITAD_BASE64}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error('Token alınamadı: ' + data));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 2. Kuponları Çek ve Filtrele
async function getCoupons(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.admitad.com',
      path: '/coupons/?limit=100&status=active', // Sadece aktifleri cek
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.results || []);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// 3. Ana Calistirma Fonksiyonu
async function updateCampaigns() {
  console.log('🔄 Admitad Kampanya verileri çekiliyor...');
  try {
    const token = await getAdmitadToken();
    console.log('✅ Token başarıyla alındı.');

    const coupons = await getCoupons(token);
    console.log(`📦 Toplam ${coupons.length} aktif kampanya bulundu.`);

    let insertedCount = 0;
    
    for (const c of coupons) {
      const campaignName = c.campaign?.name || 'Bilinmeyen Marka';
      let promoCode = c.promocode || null;

      // ==========================================
      // KRİTİK FİLTRE: BÖLGE VE DECATHLON KURALI
      // ==========================================
      
      // 1. Bölge (Region) Filtresi: Sadece Türkiye (TR) kampanyalarını kabul et.
      // Eger kuponun region'ı belli degilse veya TR icermiyorsa atla. (Genelde c.regions icinde TR olur)
      const regions = c.regions || [];
      const hasTR = regions.some(r => r === 'TR' || r.region === 'TR' || r === 'Türkiye' || r === 'Turkey');
      
      // Geçici olarak eğer Polonya (PL) gibi istenmeyen ülkeler varsa filtreleyelim
      const isPL = campaignName.toLowerCase().includes(' pl') || campaignName.toLowerCase().endsWith('pl');

      if (isPL) {
         continue; // Yabancı (PL vb) kampanyayı es geç, veritabanına kaydetme
      }

      const isDecathlon = campaignName.toLowerCase().includes('decathlon');
      
      // Decathlon kampanyanında yazılı (harf/rakam) promo kod yasak. 
      // Eger promo kod varsa bunu temizle. Sadece link olarak gonder.
      if (isDecathlon && promoCode) {
         promoCode = null; // Kod gizlendi.
      }

      // Tracking linke First Click sub1 parametresini ekle (sub1=piinti)
      let trackingLink = c.goto_link || '';
      if (trackingLink && !trackingLink.includes('sub1=')) {
         trackingLink += (trackingLink.includes('?') ? '&' : '?') + 'sub1=piinti_fc';
      }

      // Veritabanına kaydet
      const { error } = await supabase.from('affiliate_campaigns').upsert({
        source: 'admitad',
        campaign_name: campaignName,
        title: c.name || c.short_name,
        description: c.description || '',
        promo_code: promoCode,
        discount_info: c.discount || null,
        date_start: c.date_start ? new Date(c.date_start).toISOString() : null,
        date_end: c.date_end ? new Date(c.date_end).toISOString() : null,
        tracking_link: trackingLink,
        is_active: true
      }, { onConflict: 'source, tracking_link' });

      if (error) {
        console.error('Kayit hatasi:', error.message);
      } else {
        insertedCount++;
      }
    }

    console.log(`🎉 İşlem tamamlandı! ${insertedCount} kampanya veritabanına başarıyla aktarıldı (Decathlon kuralları dahilinde).`);
  } catch (err) {
    console.error('❌ Hata oluştu:', err);
  } finally {
    process.exit(0);
  }
}

updateCampaigns();
