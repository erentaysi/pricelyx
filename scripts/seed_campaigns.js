require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const campaigns = [
  { title: 'Amazon Prime Day - Tüm Elektronik %50', campaign_name: 'Amazon TR', description: 'Prime Day\'e özel tüm elektronik ürünlerde yarı yarıya indirim.', tracking_link: 'https://amazon.com.tr', promo_code: 'PRIME50', discount_info: '%50', is_active: true },
  { title: 'Trendyol Süper İndirim Festivali', campaign_name: 'Trendyol', description: 'Seçili 5000+ üründe sepette %25 ek indirim.', tracking_link: 'https://trendyol.com', promo_code: 'FEST25', discount_info: '%25', is_active: true },
  { title: 'Hepsiburada Teknoloji Şenliği', campaign_name: 'Hepsiburada', description: 'Laptop ve tablet kategorisinde 1000 TL indirim kuponu.', tracking_link: 'https://hepsiburada.com', promo_code: 'TECH1000', discount_info: '1000₺', is_active: true },
  { title: 'N11 Yaz Kampanyası', campaign_name: 'N11', description: 'Yaz aylarına özel klima, vantilatör ve soğutucuda büyük indirim.', tracking_link: 'https://n11.com', promo_code: 'YAZ30', discount_info: '%30', is_active: true },
  { title: 'MediaMarkt Flaş İndirim Günleri', campaign_name: 'MediaMarkt', description: '72 saat boyunca geçerli dev indirimler başladı.', tracking_link: 'https://mediamarkt.com.tr', promo_code: 'FLASH15', discount_info: '%15', is_active: true },
  { title: 'Çiçeksepeti Teknoloji Fırsatları', campaign_name: 'Çiçeksepeti', description: 'Akıllı telefon ve aksesuarlarda kaçırılmayacak fırsatlar.', tracking_link: 'https://ciceksepeti.com', promo_code: null, discount_info: '%20', is_active: true },
  { title: 'Amazon Kulaklık & Hoparlör Festivali', campaign_name: 'Amazon TR', description: 'JBL, Sony, Bose kulaklıklarda %40\'a varan indirim.', tracking_link: 'https://amazon.com.tr', promo_code: 'SOUND40', discount_info: '%40', is_active: true },
  { title: 'Trendyol Spor & Outdoor Kampanyası', campaign_name: 'Trendyol', description: 'Koşu bandı, bisiklet ve outdoor ekipmanlarında indirim.', tracking_link: 'https://trendyol.com', promo_code: 'SPOR20', discount_info: '%20', is_active: true },
  { title: 'Hepsiburada Oyun Konsolu Fırsatı', campaign_name: 'Hepsiburada', description: 'PS5, Xbox ve Nintendo Switch konsollarında dev fırsat.', tracking_link: 'https://hepsiburada.com', promo_code: 'GAME500', discount_info: '500₺', is_active: true },
  { title: 'N11 Beyaz Eşya Günleri', campaign_name: 'N11', description: 'Çamaşır makinesi, bulaşık makinesi ve buzdolabında ek indirim.', tracking_link: 'https://n11.com', promo_code: 'BEYAZ10', discount_info: '%10', is_active: true },
  { title: 'MediaMarkt TV & Sinema Sistemleri', campaign_name: 'MediaMarkt', description: '55 inç ve üzeri TV alımlarında soundbar hediye.', tracking_link: 'https://mediamarkt.com.tr', promo_code: null, discount_info: 'Hediye', is_active: true },
  { title: 'Amazon Akıllı Saat Kampanyası', campaign_name: 'Amazon TR', description: 'Apple Watch, Galaxy Watch ve Amazfit saatlerde büyük fırsat.', tracking_link: 'https://amazon.com.tr', promo_code: 'WATCH25', discount_info: '%25', is_active: true },
  { title: 'Trendyol Ev & Yaşam İndirimi', campaign_name: 'Trendyol', description: 'Robot süpürge, hava temizleyici ve akıllı ev ürünlerinde indirim.', tracking_link: 'https://trendyol.com', promo_code: 'EVIM35', discount_info: '%35', is_active: true },
  { title: 'Hepsiburada Okula Dönüş Kampanyası', campaign_name: 'Hepsiburada', description: 'Tablet, dizüstü bilgisayar ve kırtasiyede özel fiyatlar.', tracking_link: 'https://hepsiburada.com', promo_code: 'OKUL15', discount_info: '%15', is_active: true },
  { title: 'N11 Telefon Aksesuar Kampanyası', campaign_name: 'N11', description: 'Kılıf, şarj cihazı ve ekran koruyucuda 2 al 1 öde.', tracking_link: 'https://n11.com', promo_code: '2AL1ODE', discount_info: '2 Al 1 Öde', is_active: true },
  { title: 'Çiçeksepeti Küçük Ev Aletleri', campaign_name: 'Çiçeksepeti', description: 'Airfryer, blender ve tost makinelerinde %30 indirim.', tracking_link: 'https://ciceksepeti.com', promo_code: 'MUTFAK30', discount_info: '%30', is_active: true },
  { title: 'Amazon Bilgisayar Bileşenleri Fırsatı', campaign_name: 'Amazon TR', description: 'RAM, SSD, ekran kartı ve işlemcilerde kaçırılmaz fiyatlar.', tracking_link: 'https://amazon.com.tr', promo_code: null, discount_info: '%35', is_active: true },
  { title: 'MediaMarkt Fotoğraf & Video Ekipmanları', campaign_name: 'MediaMarkt', description: 'DSLR, aynasız fotoğraf makineleri ve drone\'larda indirim.', tracking_link: 'https://mediamarkt.com.tr', promo_code: 'FOTO20', discount_info: '%20', is_active: true },
  { title: 'Trendyol Yazılım & Abonelik Fırsatları', campaign_name: 'Trendyol', description: 'Microsoft 365, Adobe ve antivirus yazılımlarında indirim.', tracking_link: 'https://trendyol.com', promo_code: 'SOFT10', discount_info: '%10', is_active: true },
  { title: 'Hepsiburada Gaming Aksesuar Günleri', campaign_name: 'Hepsiburada', description: 'Gaming mouse, klavye ve kulaklıklarda %40 indirim.', tracking_link: 'https://hepsiburada.com', promo_code: 'GAMING40', discount_info: '%40', is_active: true },
  { title: 'N11 Akıllı Ev Sistemleri Kampanyası', campaign_name: 'N11', description: 'Akıllı priz, ampul, kamera ve robot süpürgelerde fırsat.', tracking_link: 'https://n11.com', promo_code: null, discount_info: '%25', is_active: true },
  { title: 'Amazon Kitap & Kindle Festivali', campaign_name: 'Amazon TR', description: 'Kindle cihazları ve e-kitaplarda büyük kampanya.', tracking_link: 'https://amazon.com.tr', promo_code: 'KINDLE50', discount_info: '%50', is_active: true },
  { title: 'MediaMarkt Apple Özel Fırsatları', campaign_name: 'MediaMarkt', description: 'iPhone, iPad, MacBook ve AirPods alımlarında ek indirim.', tracking_link: 'https://mediamarkt.com.tr', promo_code: 'APPLE5', discount_info: '%5', is_active: true },
  { title: 'Çiçeksepeti Kişisel Bakım Teknolojisi', campaign_name: 'Çiçeksepeti', description: 'Epilatör, saç düzleştirici ve tıraş makinelerinde indirim.', tracking_link: 'https://ciceksepeti.com', promo_code: 'BAKIM20', discount_info: '%20', is_active: true },
  { title: 'Trendyol Monitör & Çevre Birimleri', campaign_name: 'Trendyol', description: '4K monitör, yazıcı ve tarayıcılarda kaçırılmaz fırsatlar.', tracking_link: 'https://trendyol.com', promo_code: 'MONITOR15', discount_info: '%15', is_active: true },
  { title: 'Hepsiburada Network & Modem Kampanyası', campaign_name: 'Hepsiburada', description: 'WiFi 6 modem, mesh sistem ve range extender\'larda indirim.', tracking_link: 'https://hepsiburada.com', promo_code: 'WIFI30', discount_info: '%30', is_active: true },
  { title: 'N11 Taşınabilir Şarj & Powerbank', campaign_name: 'N11', description: '20000mAh ve üzeri powerbanklarda dev fırsat.', tracking_link: 'https://n11.com', promo_code: 'SARJ25', discount_info: '%25', is_active: true },
  { title: 'Amazon Yazıcı & Kartuş Kampanyası', campaign_name: 'Amazon TR', description: 'Lazer ve mürekkepli yazıcılarda %35 indirim.', tracking_link: 'https://amazon.com.tr', promo_code: 'PRINT35', discount_info: '%35', is_active: true },
  { title: 'MediaMarkt Klima & Isıtma Kampanyası', campaign_name: 'MediaMarkt', description: 'Inverter klima ve konvektör ısıtıcılarda kurulum dahil fırsat.', tracking_link: 'https://mediamarkt.com.tr', promo_code: null, discount_info: 'Kurulum Dahil', is_active: true },
  { title: 'Trendyol Çocuk Teknoloji Fırsatları', campaign_name: 'Trendyol', description: 'Çocuk tableti, akıllı saat ve eğitim robotlarında indirim.', tracking_link: 'https://trendyol.com', promo_code: 'COCUK20', discount_info: '%20', is_active: true },
  { title: 'Hepsiburada Premium Gün Fırsatları', campaign_name: 'Hepsiburada', description: 'Premium üyelere özel her gün değişen süper fırsatlar.', tracking_link: 'https://hepsiburada.com', promo_code: null, discount_info: '%45', is_active: true },
  { title: 'N11 Güvenlik Kamerası Kampanyası', campaign_name: 'N11', description: 'IP kamera, güvenlik sistemi ve bebek telsizlerinde indirim.', tracking_link: 'https://n11.com', promo_code: 'GUVENLIK15', discount_info: '%15', is_active: true },
  { title: 'Amazon Echo & Alexa Kampanyası', campaign_name: 'Amazon TR', description: 'Echo Dot, Echo Show ve Alexa uyumlu cihazlarda dev fırsat.', tracking_link: 'https://amazon.com.tr', promo_code: 'ALEXA30', discount_info: '%30', is_active: true },
  { title: 'Çiçeksepeti Bluetooth Hoparlör Şenliği', campaign_name: 'Çiçeksepeti', description: 'JBL, Marshall, Harman Kardon hoparlörlerde kaçırılmaz fırsatlar.', tracking_link: 'https://ciceksepeti.com', promo_code: 'MUZIK25', discount_info: '%25', is_active: true },
  { title: 'MediaMarkt Büyük Ekran TV Kampanyası', campaign_name: 'MediaMarkt', description: '75 inç ve üzeri TV alımlarında 5000 TL indirim kuponu.', tracking_link: 'https://mediamarkt.com.tr', promo_code: 'DEVTV', discount_info: '5000₺', is_active: true },
  { title: 'Trendyol Kulaklık Dünyası', campaign_name: 'Trendyol', description: 'TWS, noise-cancelling ve gaming kulaklıklarda %35 indirim.', tracking_link: 'https://trendyol.com', promo_code: 'KULAK35', discount_info: '%35', is_active: true },
  { title: 'Hepsiburada Harici Disk & SSD Fırsatı', campaign_name: 'Hepsiburada', description: 'Samsung, WD, Seagate harici disklerde süper fiyatlar.', tracking_link: 'https://hepsiburada.com', promo_code: 'DISK20', discount_info: '%20', is_active: true },
  { title: 'N11 Projeksiyon Cihazı Kampanyası', campaign_name: 'N11', description: 'Ev sineması projeksiyonlarında %30 indirim.', tracking_link: 'https://n11.com', promo_code: 'SINEMA30', discount_info: '%30', is_active: true },
  { title: 'Amazon Robot Süpürge Festivali', campaign_name: 'Amazon TR', description: 'iRobot, Roborock, Ecovacs robot süpürgelerde dev fırsat.', tracking_link: 'https://amazon.com.tr', promo_code: 'ROBOT25', discount_info: '%25', is_active: true },
  { title: 'Çiçeksepeti Elektrikli Scooter Günleri', campaign_name: 'Çiçeksepeti', description: 'Xiaomi, Segway ve Ninebot scooterlarda indirim.', tracking_link: 'https://ciceksepeti.com', promo_code: 'SCOOTER10', discount_info: '%10', is_active: true },
];

async function seed() {
  console.log('Adding campaigns...');
  
  // Insert in batches of 10
  for (let i = 0; i < campaigns.length; i += 10) {
    const batch = campaigns.slice(i, i + 10);
    const { error } = await supabase.from('affiliate_campaigns').insert(batch);
    if (error) {
      console.error(`Batch ${i} error:`, error.message);
    } else {
      console.log(`Inserted batch ${i}-${i + batch.length}`);
    }
  }
  
  console.log('Done! Total campaigns added:', campaigns.length);
}

seed();
