require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function generateSeoSlug(text) {
  const trMap = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
  };
  
  return text
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, match => trMap[match])
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
}

async function runMigration() {
  console.log('Fetching products...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, brands(name), categories(name)');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products. Generating slugs...`);

  const duplicates = {};
  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    const brandName = Array.isArray(product.brands) ? product.brands[0]?.name : product.brands?.name;
    const catName = Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name;
    
    let baseText = product.title;
    if (brandName && !baseText.toLowerCase().includes(brandName.toLowerCase())) {
        baseText = `${brandName} ${baseText}`;
    }

    let rawSlug = generateSeoSlug(baseText);
    let finalSlug = `${rawSlug}-fiyatlari`;

    // Handle duplicates
    if (duplicates[finalSlug]) {
        duplicates[finalSlug]++;
        finalSlug = `${rawSlug}-${duplicates[finalSlug]}-fiyatlari`;
    } else {
        duplicates[finalSlug] = 1;
    }

    const metaDesc = `${product.title} en ucuz fiyat seçenekleri, fiyat geçmişi ve özellikleri Piinti'de. ${brandName ? brandName + ' marka ' : ''}ürünleri karşılaştırın.`;

    const { error: updateError } = await supabase
        .from('products')
        .update({ 
            slug: finalSlug,
            meta_description: metaDesc
        })
        .eq('id', product.id);

    if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError.message);
        failCount++;
    } else {
        successCount++;
        process.stdout.write(`\rUpdated: ${successCount}/${products.length}`);
    }
  }

  console.log(`\nMigration complete. Success: ${successCount}, Failed: ${failCount}`);
}

runMigration();
