require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Copy from product-matcher.js
const TR_MAP = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','Ö':'o','Ş':'s','Ü':'u' };
const NOISE_WORDS = ['garantili', 'türkiye garantili', 'apple türkiye', 'samsung türkiye', 'ithalatçı garantili', 'distribütör garantili', 'resmi distribütör', 'prime üyelerine özel', 'fırsat', 'günün fırsatı', 'süper fırsat', 'çok satanlar', 'bedava kargo', 'ücretsiz kargo', 'kargo bedava', 'hızlı teslimat', 'aynı gün kargo', "amazon'un seçimi", 'en çok satan', 'öne çıkan', 'kampanyalı', 'indirimli', 'fırsat ürünü', 'yarın kapında', 'teslimat bilgisi', 'siyah', 'beyaz', 'mavi', 'kırmızı', 'yeşil', 'mor', 'pembe', 'gri', 'altın', 'gümüş', 'turuncu', 'sarı', 'lacivert', 'black', 'white', 'blue', 'red', 'green', 'purple', 'pink', 'gray', 'gold', 'silver', 'orange', 'midnight', 'starlight', 'space gray', 'space grey', 'natural titanium', 'desert titanium', 'blue titanium', 'black titanium', 'yeni', 'new', 'original', 'orijinal', 'a kalite'];

function normalizeTitle(title) {
  if (!title) return '';
  let t = title.toLowerCase();
  t = t.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
  t = t.replace(/\([^)]*\)/g, '');
  for (const word of NOISE_WORDS) {
    const w = word.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
    t = t.replace(new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '');
  }
  t = t.replace(/[^a-z0-9\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function detectCategory(title) {
  const t = normalizeTitle(title);
  if (t.includes('kitap') || t.includes('roman') || t.includes('nuls') || t.includes('manuel') || t.includes('guide') || t.includes('dergi') || t.split(' ').includes('book')) return 'kitap-hobi';
  if ((t.includes('telefon') || t.includes('iphone') || t.includes('galaxy s') || t.includes('galaxy a') || t.includes('poco') || t.includes('pixel')) && !t.includes('kilif') && !t.includes('kablo')) return 'akilli-telefon';
  if (t.includes('playstation') || t.includes('xbox') || t.includes('nintendo') || t.includes('konsol') || t.includes('dualsense') || t.includes('gamepad') || t.includes('joy con')) return 'oyun-konsollari';
  if (t.includes('kosu') || t.includes('fitness') || t.includes('halter') || t.includes('yoga') || t.includes('spor') || t.includes('bisiklet') || t.includes('dambil') || t.includes('pilates')) return 'spor-outdoor';
  if (t.includes('supurge') || t.includes('airfryer') || t.includes('dyson') || t.includes('robot') || t.includes('kahve makine') || t.includes('cay makine') || t.includes('mikser') || t.includes('utu') || t.includes('blender') || t.includes('kahve')) return 'ev-yasam';
  if (t.includes('laptop') || t.includes('bilgisayar') || t.includes('macbook') || t.includes('notebook') || t.includes('monitor') || t.includes('mouse') || t.includes('klavye')) return 'bilgisayar-laptop';
  if (t.includes('parfum') || t.includes('tiras') || t.includes('epilasyon') || t.includes('kurutma') || t.includes('sac duzlestirici') || t.includes('kozmetik')) return 'kozmetik';
  return 'elektronik';
}

async function run() {
  const { data: categories } = await supabase.from('categories').select('id, slug');
  const { data: products } = await supabase.from('products').select('id, title, category_id');
  
  console.log(`Found ${products.length} products to check.`);
  let updatedCount = 0;

  for (const product of products) {
    const slug = detectCategory(product.title);
    const catObj = categories.find(c => c.slug === slug);
    if (!catObj) {
        console.log("Could not find category for slug:", slug, product.title);
        continue;
    }
    if (product.category_id !== catObj.id) {
        await supabase.from('products').update({ category_id: catObj.id }).eq('id', product.id);
        console.log(`Updated "${product.title}" -> ${slug}`);
        updatedCount++;
    }
  }
  console.log(`Finished. Updated ${updatedCount} products.`);
}

run();
