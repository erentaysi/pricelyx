require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const brands = ['Apple', 'Samsung', 'Xiaomi', 'Asus', 'Lenovo', 'HP', 'Sony', 'Microsoft', 'LG', 'Philips', 'Dyson', 'Bosch', 'Nike', 'Adidas', 'Puma'];
const vendors = [
  { name: 'Amazon TR', logo: 'A', color: '#FF9900' },
  { name: 'Hepsiburada', logo: 'hb', color: '#FF6000' },
  { name: 'Trendyol', logo: 'ty', color: '#F27A1A' },
  { name: 'N11', logo: 'n11', color: '#5C3EBA' },
  { name: 'MediaMarkt', logo: 'mm', color: '#DF0000' },
  { name: 'Çiçeksepeti', logo: 'çs', color: '#0054A6' }
];

const categoryTemplates = {
  'akilli-telefon': { titles: ['iPhone 15 Pro Max', 'Galaxy S24 Ultra', 'Redmi Note 13 Pro', 'iPhone 14', 'Galaxy A54', 'Poco X6 Pro'], basePrice: 20000 },
  'bilgisayar-laptop': { titles: ['MacBook Pro M3', 'MacBook Air M2', 'ROG Strix G16', 'Legion Pro 5', 'Victus 16', 'IdeaPad Gaming 3'], basePrice: 30000 },
  'oyun-konsollari': { titles: ['PlayStation 5 Slim', 'Xbox Series X', 'Xbox Series S', 'Nintendo Switch OLED', 'DualSense Controller', 'Steam Deck'], basePrice: 15000 },
  'ev-yasam': { titles: ['Airfryer XXL', 'Robot Süpürge S10+', 'Dikey Süpürge V15', 'Filtre Kahve Makinesi', 'Blender Seti', 'Çay Makinesi'], basePrice: 5000 },
  'elektronik': { titles: ['AirPods Pro 2', 'Galaxy Buds 2', 'OLED TV 55 inç', 'QLED TV 65 inç', 'Bluetooth Hoparlör', 'Akıllı Saat Watch 6'], basePrice: 4000 }
};

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 10000);
}

async function seed() {
  console.log('Seeding started...');

  // 1. Get Categories
  const { data: dbCategories, error: catErr } = await supabase.from('categories').select('id, slug');
  if (catErr) { console.error('Categories error:', catErr); return; }

  // 2. Get or Create Brands
  const { data: dbBrands } = await supabase.from('brands').select('id, name');
  let brandMap = {};
  for (const dbb of dbBrands || []) brandMap[dbb.name] = dbb.id;

  for (const b of brands) {
    if (!brandMap[b]) {
      const { data: newBrand, error } = await supabase.from('brands').insert({ name: b }).select('id').single();
      if (error) console.error('Brand insert error:', error.message);
      if (newBrand) brandMap[b] = newBrand.id;
    }
  }

  // 3. Get or Create Vendors
  const { data: dbVendors } = await supabase.from('vendors').select('id, name');
  let vendorMap = {};
  for (const dbv of dbVendors || []) vendorMap[dbv.name] = dbv.id;

  for (const v of vendors) {
    if (!vendorMap[v.name]) {
      const { data: newVendor, error } = await supabase.from('vendors').insert({ name: v.name, logo: v.logo, color: v.color }).select('id').single();
      if (error) console.error('Vendor insert error:', error.message);
      if (newVendor) vendorMap[v.name] = newVendor.id;
    }
  }

  // Delete weird existing products to clear out joystick in phones etc.
  // Actually, let's just insert the new ones and they will dominate.
  
  // Generate 100 products
  for (let i = 0; i < 100; i++) {
    const catKeys = Object.keys(categoryTemplates);
    const catSlug = catKeys[Math.floor(Math.random() * catKeys.length)];
    const cat = dbCategories.find(c => c.slug === catSlug);
    if (!cat) continue;

    const tpl = categoryTemplates[catSlug];
    const baseName = tpl.titles[Math.floor(Math.random() * tpl.titles.length)];
    const brandName = brands[Math.floor(Math.random() * brands.length)];
    const title = `${brandName} ${baseName} ${Math.floor(Math.random() * 512)}GB Özel Seri`;
    
    // Insert Product
    const { data: prod, error: prodErr } = await supabase.from('products').insert({
      title,
      slug: generateSlug(title),
      category_id: cat.id,
      brand_id: brandMap[brandName],
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews_count: Math.floor(Math.random() * 5000) + 10,
      is_trend: Math.random() > 0.8
    }).select('id').single();

    if (prodErr) { console.log('Err prod:', prodErr.message); continue; }

    // Insert Prices
    const numPrices = Math.floor(Math.random() * 4) + 1; // 1 to 4 prices
    const selectedVendors = [...vendors].sort(() => 0.5 - Math.random()).slice(0, numPrices);
    
    let basePrice = tpl.basePrice + (Math.random() * tpl.basePrice);
    
    for (const v of selectedVendors) {
      const isDiscount = Math.random() > 0.5;
      const originalPrice = isDiscount ? basePrice * (1 + (Math.random() * 0.3)) : basePrice;
      
      await supabase.from('product_prices').insert({
        product_id: prod.id,
        vendor_id: vendorMap[v.name],
        price: basePrice,
        original_price: originalPrice,
        product_url: `https://example.com/product/${prod.id}`,
        in_stock: Math.random() > 0.1,
        shipping_info: Math.random() > 0.5 ? 'Ücretsiz Kargo' : 'Kargo 39.90 TL'
      });
      basePrice += Math.random() * 1000; // varying prices across vendors
    }
    
    // Price history
    for(let d=1; d<=10; d++) {
        await supabase.from('price_history').insert({
            product_id: prod.id,
            price: basePrice + (Math.random() * 2000 - 1000),
            recorded_at: new Date(Date.now() - (d * 86400000)).toISOString()
        });
    }

    if (i % 20 === 0) console.log(`Inserted ${i} products...`);
  }
  
  // Add some campaigns
  await supabase.from('affiliate_campaigns').insert([
    {
      title: 'Amazon Bahar Fırsatları %60 İndirim',
      campaign_name: 'Amazon TR',
      description: 'Elektronik ürünlerde dev bahar fırsatı başladı.',
      tracking_link: 'https://amazon.com.tr',
      promo_code: 'AMZ60',
      discount_info: '%60',
      is_active: true
    },
    {
      title: 'Trendyol Teknoloji Günleri',
      campaign_name: 'Trendyol',
      description: 'Seçili laptop ve telefonlarda sepette ek indirim.',
      tracking_link: 'https://trendyol.com',
      promo_code: 'TRNDTECH',
      discount_info: '%15',
      is_active: true
    },
    {
      title: 'Hepsiburada Premium Özel Fırsat',
      campaign_name: 'Hepsiburada',
      description: 'Sadece Premium üyelere özel ekstra indirimler.',
      tracking_link: 'https://hepsiburada.com',
      promo_code: null,
      discount_info: '%20',
      is_active: true
    }
  ]);

  // FIX CATEGORY MISS-MATCH (Joystick in Phones etc)
  const phoneCat = dbCategories.find(c => c.slug === 'akilli-telefon');
  const gameCat = dbCategories.find(c => c.slug === 'oyun-konsollari');
  const sportCat = dbCategories.find(c => c.slug === 'spor-outdoor');
  
  if (phoneCat && gameCat) {
     await supabase.from('products').update({ category_id: gameCat.id }).ilike('title', '%joystick%').eq('category_id', phoneCat.id);
     await supabase.from('products').update({ category_id: sportCat.id }).ilike('title', '%koşu%').eq('category_id', phoneCat.id);
  }
  
  const tvCat = dbCategories.find(c => c.slug === 'tv-ses-goruntu'); // Or whatever it is. Let's just fix the generic ones via SQL.
  
  console.log('Seeding finished!');
}

seed();
