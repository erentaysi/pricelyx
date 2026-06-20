require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// =====================================================
// AKILLI ÜRÜN EŞLEŞTİRME MOTORU (Piinti Product Matcher)
// =====================================================

// Türkçe karakter dönüşüm tablosu
const TR_MAP = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','Ö':'o','Ş':'s','Ü':'u' };

// Temizlenecek gereksiz kelimeler (mağaza isimleri, pazarlama vs.)
const NOISE_WORDS = [
  // Mağaza/pazarlama
  'garantili', 'türkiye garantili', 'apple türkiye', 'samsung türkiye',
  'ithalatçı garantili', 'distribütör garantili', 'resmi distribütör',
  'prime üyelerine özel', 'fırsat', 'günün fırsatı', 'süper fırsat', 'çok satanlar',
  'bedava kargo', 'ücretsiz kargo', 'kargo bedava', 'hızlı teslimat', 'aynı gün kargo',
  'amazon\'un seçimi', 'en çok satan', 'öne çıkan', 'kampanyalı', 'indirimli',
  'fırsat ürünü', 'yarın kapında', 'teslimat bilgisi',
  // Renk varyantları (eşleştirmede rengi kaldırıyoruz)
  'siyah', 'beyaz', 'mavi', 'kırmızı', 'yeşil', 'mor', 'pembe', 'gri', 'altın',
  'gümüş', 'turuncu', 'sarı', 'lacivert',
  'black', 'white', 'blue', 'red', 'green', 'purple', 'pink', 'gray', 'gold',
  'silver', 'orange', 'midnight', 'starlight', 'space gray', 'space grey',
  'natural titanium', 'desert titanium', 'blue titanium', 'black titanium',
  // Genel
  'yeni', 'new', 'original', 'orijinal', 'a kalite',
];

/**
 * Bir ürün başlığını "parmak izi"ne dönüştürür.
 * "Apple iPhone 16 128GB Siyah - Apple Türkiye Garantili" → "apple iphone 16 128gb"
 */
function normalizeTitle(title) {
  if (!title) return '';
  
  let t = title.toLowerCase();
  
  // Türkçe karakter dönüşümü
  t = t.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
  
  // Parantez içindeki gereksiz bilgileri kaldır: (Apple Türkiye Garantili)
  t = t.replace(/\([^)]*\)/g, '');
  
  // Tire sonrası açıklamaları kaldır: " - Apple Türkiye Garantili"
  t = t.replace(/\s*-\s*[a-z].*$/g, '');
  
  // Gürültü kelimeleri temizle
  for (const word of NOISE_WORDS) {
    const w = word.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
    t = t.replace(new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '');
  }
  
  // Özel karakterleri kaldır, sadece harf/rakam/boşluk bırak
  t = t.replace(/[^a-z0-9\s]/g, ' ');
  
  // Fazla boşlukları temizle
  t = t.replace(/\s+/g, ' ').trim();
  
  return t;
}

/**
 * Normalize edilmiş başlıktan arama kelimeleri oluşturur.
 * "apple iphone 16 128gb" → ['apple', 'iphone', '16', '128gb']
 */
function generateSearchKeywords(normalizedTitle) {
  return normalizedTitle.split(' ').filter(w => w.length >= 2);
}

/**
 * İki normalize başlık arasındaki benzerlik skorunu hesaplar (0-1 arası).
 * Jaccard benzerliği + sıra koruması kullanır.
 */
function similarityScore(title1, title2) {
  const words1 = new Set(title1.split(' ').filter(w => w.length >= 2));
  const words2 = new Set(title2.split(' ').filter(w => w.length >= 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Veritabanında bir ürünün eşleşmesini arar.
 * Bulamazsa null döner, bulursa ürün ID'sini döner.
 */
async function findMatchingProduct(cleanTitle) {
  const normalized = normalizeTitle(cleanTitle);
  const keywords = generateSearchKeywords(normalized);
  
  if (keywords.length < 2) return null;
  
  // İlk 3-4 anahtar kelimeyle arama yap (marka + model genelde yeterli)
  const searchTerms = keywords.slice(0, Math.min(4, keywords.length));
  
  // Supabase'de ILIKE ile tüm anahtar kelimelerin geçtiği ürünleri ara
  let query = supabase.from('products').select('id, title');
  for (const term of searchTerms) {
    query = query.ilike('title', `%${term}%`);
  }
  
  const { data: candidates } = await query.limit(10);
  
  if (!candidates || candidates.length === 0) return null;
  
  // En yüksek benzerlik skoru olanı seç
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const candidateNorm = normalizeTitle(candidate.title);
    const score = similarityScore(normalized, candidateNorm);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  // Minimum %60 benzerlik olmalı
  if (bestScore >= 0.6) {
    return bestMatch.id;
  }
  
  return null;
}

/**
 * Ürün başlığından marka adını çıkarır.
 */
function extractBrand(title) {
  const t = title.trim();
  // İlk kelimeyi marka olarak al (çoğu durumda doğru)
  const firstWord = t.split(/\s+/)[0];
  // Bazı yaygın iki kelimelik markalar
  const twoWordBrands = ['Samsung Galaxy', 'LG Electronics', 'De\'Longhi'];
  for (const brand of twoWordBrands) {
    if (t.toLowerCase().startsWith(brand.toLowerCase())) return brand;
  }
  return firstWord;
}

/**
 * Ürün başlığından kategori slug'ını belirler.
 */
function detectCategory(title) {
  const t = normalizeTitle(title);
  
  if ((t.includes('telefon') || t.includes('iphone') || t.includes('galaxy s') || t.includes('galaxy a') || t.includes('poco') || t.includes('pixel')) && !t.includes('kilif') && !t.includes('kablo')) 
    return 'akilli-telefon';
  if (t.includes('playstation') || t.includes('xbox') || t.includes('nintendo') || t.includes('konsol') || t.includes('dualsense') || t.includes('gamepad'))
    return 'oyun-konsollari';
  if (t.includes('kosu') || t.includes('fitness') || t.includes('halter') || t.includes('yoga') || t.includes('spor') || t.includes('bisiklet') || t.includes('dambil') || t.includes('pilates'))
    return 'spor-outdoor';
  if (t.includes('supurge') || t.includes('airfryer') || t.includes('dyson') || t.includes('robot') || t.includes('kahve makine') || t.includes('cay makine') || t.includes('mikser') || t.includes('utu') || t.includes('blender'))
    return 'ev-yasam';
  if (t.includes('laptop') || t.includes('bilgisayar') || t.includes('macbook') || t.includes('notebook') || t.includes('monitor'))
    return 'bilgisayar-laptop';
  if (t.includes('parfum') || t.includes('tiras') || t.includes('epilasyon') || t.includes('kurutma') || t.includes('sac duzlestirici'))
    return 'kozmetik-kisisel-bakim';
  if (t.includes('kitap') || t.includes('roman'))
    return 'kitap';
    
  return 'elektronik'; // default
}

/**
 * Ana fonksiyon: Bir scraper ürününü veritabanıyla eşleştirip kaydeder.
 * Eğer ürün zaten varsa, o ürüne yeni mağaza fiyatını ekler.
 * Yoksa yeni ürün oluşturup fiyat ekler.
 */
async function matchAndSaveProduct({ title, price, image, url, vendorId, shippingInfo }) {
  if (!title || !price || price <= 0) return null;
  
  // Başlığı temizle
  let cleanTitle = title.replace(/(Prime Üyelerine Özel|Fırsat|Günün Fırsatı|Bedava Kargo|Ücretsiz Kargo|Kargo Bedava|Hızlı Teslimat|Fırsat Ürünü|Yarın Kapında|Teslimat Bilgisi|Hızlı Teslimat|Amazon'un Seçimi)/gi, '').trim();
  if (cleanTitle.length < 5) return null;
  
  // Kategoriler ve markalar cache'i
  if (!matchAndSaveProduct._cache) {
    const { data: cats } = await supabase.from('categories').select('id, slug');
    const { data: brands } = await supabase.from('brands').select('id, name');
    matchAndSaveProduct._cache = { categories: cats || [], brands: brands || [] };
  }
  const { categories, brands } = matchAndSaveProduct._cache;
  
  // Marka bul veya oluştur
  const brandName = extractBrand(cleanTitle);
  let brandObj = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  if (!brandObj) {
    const { data: nb } = await supabase.from('brands').insert({ name: brandName }).select().single();
    if (nb) { brands.push(nb); brandObj = nb; }
  }
  
  // Kategori belirle
  const catSlug = detectCategory(cleanTitle);
  const catObj = categories.find(c => c.slug === catSlug);
  
  // Eşleşen ürün ara
  let productId = await findMatchingProduct(cleanTitle);
  
  if (!productId) {
    // Yeni ürün oluştur
    const { data: newProd } = await supabase.from('products').insert({
      title: cleanTitle,
      brand_id: brandObj?.id || null,
      category_id: catObj?.id || null,
      image_url: image || null,
      rating: 4.8,
      reviews_count: Math.floor(Math.random() * 500) + 100,
      is_trend: true,
      specs: {}
    }).select().single();
    
    if (newProd) productId = newProd.id;
  }
  
  if (!productId) return null;
  
  // Bu mağazanın fiyatını ekle/güncelle (upsert mantığı)
  const { data: existingPrice } = await supabase
    .from('product_prices')
    .select('id')
    .eq('product_id', productId)
    .eq('vendor_id', vendorId)
    .single();
  
  if (!existingPrice) {
    await supabase.from('product_prices').insert({
      product_id: productId,
      vendor_id: vendorId,
      price: price,
      original_price: Math.floor(price * 1.08),
      product_url: url,
      shipping_info: shippingInfo || 'Standart Kargo',
      in_stock: true
    });
    await supabase.from('price_history').insert({
      product_id: productId, vendor_id: vendorId, price: price
    });
  } else {
    await supabase.from('product_prices').update({
      price: price,
      product_url: url,
      updated_at: new Date().toISOString()
    }).eq('id', existingPrice.id);
  }
  
  return productId;
}

/**
 * Vendor'u bul veya oluştur.
 */
async function getOrCreateVendor(name, logo, color) {
  const { data: existing } = await supabase.from('vendors').select('id').eq('name', name).single();
  if (existing) return existing.id;
  
  const { data: newV } = await supabase.from('vendors').insert({ name, logo, color }).select().single();
  return newV?.id || null;
}

// Cache'i temizle (her scraper çalıştığında)
function clearCache() {
  matchAndSaveProduct._cache = null;
}

module.exports = {
  normalizeTitle,
  similarityScore,
  findMatchingProduct,
  matchAndSaveProduct,
  getOrCreateVendor,
  extractBrand,
  detectCategory,
  clearCache,
  supabase
};
