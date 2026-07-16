require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Metin temizleme fonksiyonu:
// - Küçük harfe çevir
// - Gereksiz boşlukları sil
// - Özel karakterleri temizle
// - 'adet', 'cm', 'gr' gibi ölçü birimlerini sil
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\sçğıöşü]/g, ' ') // Özel karakterleri boşluğa çevir
    .replace(/\b(adet|cm|gr|ml|kg|yaş|ay)\b/g, '') // Ölçüleri sil
    .replace(/\s+/g, ' ') // Fazla boşlukları tek boşluğa indir
    .trim();
}

// İki metin arasındaki benzerlik oranını hesaplar (Jaccard Index benzeri basit yaklaşım)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (let w of words1) {
    if (words2.has(w)) intersection++;
  }
  
  const union = new Set([...words1, ...words2]).size;
  return intersection / union; // 1.0 = Birebir aynı kelimeler
}

async function findDuplicates() {
  console.log("🔍 Veritabanındaki ürünler taranıyor (Duplicate Tespiti)...");
  console.log("UYARI: Bu script HİÇBİR VERİ SİLMEZ. Sadece potansiyel duplicate'leri raporlar.\n");

  const { data: products, error } = await supabase.from('products').select('id, title, brand_id');
  
  if (error) {
    console.error("Ürünler çekilirken hata:", error);
    return;
  }

  // Aynı markaya sahip ürünleri grupla
  const productsByBrand = {};
  for (let p of products) {
    if (!p.brand_id) continue;
    if (!productsByBrand[p.brand_id]) productsByBrand[p.brand_id] = [];
    productsByBrand[p.brand_id].push(p);
  }

  let duplicateGroupsFound = 0;

  for (let brandId in productsByBrand) {
    const items = productsByBrand[brandId];
    if (items.length < 2) continue; // Sadece 1 ürün varsa geç

    // Bu markadaki ürünleri kendi aralarında kıyasla
    const processed = new Set();
    
    for (let i = 0; i < items.length; i++) {
      if (processed.has(items[i].id)) continue;
      
      const title1 = normalizeTitle(items[i].title);
      const duplicates = [items[i]];
      
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(items[j].id)) continue;
        
        const title2 = normalizeTitle(items[j].title);
        const similarity = calculateSimilarity(title1, title2);
        
        // %70'ten fazla benzer kelime varsa duplicate kabul et
        if (similarity > 0.7) {
          duplicates.push(items[j]);
          processed.add(items[j].id);
        }
      }
      
      if (duplicates.length > 1) {
        duplicateGroupsFound++;
        console.log(`\n📌 [EŞLEŞME GRUBU #${duplicateGroupsFound}] (Benzerlik > %70)`);
        console.log(`   Ana (Olası Parent): ${duplicates[0].title} (ID: ${duplicates[0].id})`);
        for (let k = 1; k < duplicates.length; k++) {
          console.log(`   Child (Duplicate) : ${duplicates[k].title} (ID: ${duplicates[k].id})`);
        }
      }
      processed.add(items[i].id);
    }
  }

  console.log(`\n✅ Tarama tamamlandı. Toplam ${duplicateGroupsFound} adet ürün grubu bulundu.`);
  console.log("NOT: Bu listeyi inceleyerek eşleşmelerin mantıklı olup olmadığını teyit edin.");
}

findDuplicates();
