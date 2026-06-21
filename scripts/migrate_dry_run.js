require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TR_MAP = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','Ö':'o','Ş':'s','Ü':'u' };

function normalizeTitle(title) {
  if (!title) return '';
  let t = title.toLowerCase();
  t = t.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
  t = t.replace(/[^a-z0-9\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// Yeni Ana ve Alt Kategoriler (Slug -> Parent Slug)
const NEW_CATEGORIES = {
  // 1. Elektronik
  'cep-telefonu-aksesuar': 'elektronik',
  'bilgisayar-laptop': 'elektronik',
  'bilgisayar-donanimi': 'elektronik',
  'tv-ses-goruntu-sistemleri': 'elektronik',
  'kucuk-ev-aletleri': 'elektronik',
  'beyaz-esya': 'elektronik',
  'isitma-sogutma': 'elektronik',
  'fotograf-kamera': 'elektronik',
  'oyun-konsollari': 'elektronik',
  // 2. Ev & Yaşam
  'mobilya-dekorasyon': 'ev-yasam',
  'ev-tekstili': 'ev-yasam',
  'mutfak-gerecleri-zuccaciye': 'ev-yasam',
  'elektrik-aydinlatma': 'ev-yasam',
  'banyo-ev-gerecleri': 'ev-yasam',
  'sanatsal-malzemeler': 'ev-yasam',
  // 3. Ofis & Kırtasiye
  'kirtasiye-urunleri': 'ofis-kirtasiye',
  'ofis-mobilyasi-ekipmanlari': 'ofis-kirtasiye',
  // 4. Anne, Bebek & Oyuncak
  'bebek-bakim-ekipman': 'anne-bebek-oyuncak',
  'anne-urunleri': 'anne-bebek-oyuncak',
  'oyuncak': 'anne-bebek-oyuncak',
  // 5. Moda, Saat & Takı
  'kadin-giyim': 'moda-saat-taki',
  'erkek-giyim': 'moda-saat-taki',
  'ayakkabi-canta': 'moda-saat-taki',
  'saat': 'moda-saat-taki',
  'taki-mucevher': 'moda-saat-taki',
  // 6. Kitap, Müzik & Hobi
  'kitap': 'kitap-muzik-hobi',
  'muzik-enstruman': 'kitap-muzik-hobi',
  'hobi-el-sanatlari': 'kitap-muzik-hobi',
  // 7. Spor & Outdoor
  'spor-giyim-ekipman': 'spor-outdoor',
  'outdoor-kamp': 'spor-outdoor',
  'fitness': 'spor-outdoor',
  // 8. Sağlık, Bakım & Kozmetik
  'kozmetik-makyaj': 'saglik-bakim-kozmetik',
  'kisisel-bakim': 'saglik-bakim-kozmetik',
  'saglik-urunleri': 'saglik-bakim-kozmetik',
  // 9. Oto, Bahçe & Yapı Market
  'oto-aksesuar-lastik': 'oto-bahce-yapi-market',
  'bahce-urunleri': 'oto-bahce-yapi-market',
  'yapi-market-hirdavat': 'oto-bahce-yapi-market',
  // 10. Petshop
  'kedi-urunleri': 'petshop',
  'kopek-urunleri': 'petshop',
  'diger-evcil-hayvan-urunleri': 'petshop'
};

function mapToNewCategory(product) {
  const t = normalizeTitle(product.title);
  
  // Kitap
  if (t.includes('kitap') || t.includes('roman') || t.includes('nuls') || t.includes('manuel') || t.includes('guide') || t.includes('dergi') || t.split(' ').includes('book') || t.includes('paperback')) {
    // Istisna: kahve makinesi kılavuzu veya "manuel" makine ise (Örn: Homend manuel espresso makinesi)
    if (t.includes('espresso') || t.includes('kahve') || t.includes('makinesi')) return 'kucuk-ev-aletleri';
    return 'kitap';
  }

  // Kişisel Bakım (Tıraş makinesi, epilatör, saç kurutma vs.)
  if (t.includes('tiras') || t.includes('epilasyon') || t.includes('kurutma') || t.includes('sac duzlestirici') || t.includes('trimmer') || t.includes('bakim seti') || t.includes('sakal')) return 'kisisel-bakim';
  
  // Kozmetik & Makyaj (Parfüm vb)
  if (t.includes('parfum') || t.includes('kozmetik')) return 'kozmetik-makyaj';

  // Küçük Ev Aletleri (Ütü, Süpürge, Airfryer, Kahve/Çay Makinesi, Blender, Fritöz)
  if (t.includes('supurge') || t.includes('airfryer') || t.includes('fritoz') || t.includes('frito') || t.includes('dyson') || t.includes('robot') || t.includes('kahve') || t.includes('cay') || t.includes('tchibo') || t.includes('mikser') || t.includes('utu') || t.includes('blender') || t.includes('espresso') || t.includes('multicooker') || t.includes('juicer') || t.includes('yikama')) return 'kucuk-ev-aletleri';
  
  // Saat (Akıllı Saatler Moda > Saat veya Elektronik > Cep Telefonu Aksesuarı mı?)
  // Genelde akıllı saatler cep telefonu aksesuarı sayılır
  if (t.includes('akilli saat') || t.includes('watch') || t.includes('akilli bileklik') || t.includes('smart band') || t.includes('saati')) return 'cep-telefonu-aksesuar';

  // Cep Telefonu & Aksesuar
  if ((t.includes('telefon') || t.includes('iphone') || t.includes('galaxy s') || t.includes('galaxy a') || t.includes('poco') || t.includes('pixel') || t.includes('kablo') || t.includes('kilif')) && !t.includes('kulaklik')) return 'cep-telefonu-aksesuar';

  // TV, Ses & Görüntü Sistemleri (Kulaklık, Hoparlör)
  if (t.includes('kulaklik') || t.includes('kulakligi') || t.includes('airpods') || t.includes('earbuds') || t.includes('headset') || t.includes('buds') || t.includes('hoparlor') || t.includes('tws') || t.includes('marshall') || t.includes('freeclip') || t.includes('riversong')) return 'tv-ses-goruntu-sistemleri';

  // Oyun Konsolları
  if (t.includes('playstation') || t.includes('xbox') || t.includes('nintendo') || t.includes('konsol') || t.includes('dualsense') || t.includes('gamepad') || t.includes('joy con') || t.includes('mario') || t.includes('metroid') || t.includes('controller') || t.includes('steering wheel')) return 'oyun-konsollari';

  // Bilgisayar & Laptop
  if (t.includes('laptop') || t.includes('bilgisayar') || t.includes('macbook') || t.includes('notebook') || t.includes('ideapad') || t.includes('surface') || t.includes('tablet')) return 'bilgisayar-laptop';
  
  // Bilgisayar Donanımı (Mouse, Klavye, Monitör)
  if (t.includes('monitor') || t.includes('mouse') || t.includes('klavye')) return 'bilgisayar-donanimi';

  // Fitness (Koşu bandı, dambıl, halter, mat)
  if (t.includes('kosu') || t.includes('fitness') || t.includes('halter') || t.includes('yoga') || t.includes('spor') || t.includes('dambil') || t.includes('pilates') || t.includes('mat') || t.includes('stepper') || t.includes('el yayi') || t.includes('egzersiz') || t.includes('agirlik sehpasi') || t.includes('lifting straps')) return 'fitness';
  
  // Mutfak Gereçleri & Züccaciye (Çay vs)
  if (t.includes('cay') || t.includes('kahve')) return 'mutfak-gerecleri-zuccaciye';
  
  // Yapı Market & Hırdavat (Dayson silikon vs)
  if (t.includes('silikon') || t.includes('matkap')) return 'yapi-market-hirdavat';

  return 'BELIRSIZ';
}

async function run() {
  const { data: products } = await supabase.from('products').select('id, title, category_id, categories(name)');
  
  const stats = {
    total: products.length,
    mapped: 0,
    unmapped: 0,
    newCategories: {}
  };
  
  const unmappedProducts = [];

  products.forEach(p => {
    const newSlug = mapToNewCategory(p);
    if (newSlug === 'BELIRSIZ') {
      stats.unmapped++;
      unmappedProducts.push(p.title);
    } else {
      stats.mapped++;
      stats.newCategories[newSlug] = (stats.newCategories[newSlug] || 0) + 1;
    }
  });

  console.log("=== DRY RUN SONUÇLARI ===");
  console.log(`Toplam Ürün: ${stats.total}`);
  console.log(`Eşleşen Ürün: ${stats.mapped}`);
  console.log(`Eşleşemeyen (Belirsiz): ${stats.unmapped}`);
  
  console.log("\n=== YENİ KATEGORİ DAĞILIMI ===");
  for (const [cat, count] of Object.entries(stats.newCategories)) {
    console.log(`- ${cat}: ${count} ürün`);
  }

  if (unmappedProducts.length > 0) {
    console.log("\n=== EŞLEŞEMEYEN ÜRÜNLER LİSTESİ ===");
    unmappedProducts.forEach(title => console.log("- " + title));
  }
}

run();
