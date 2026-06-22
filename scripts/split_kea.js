require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TR_MAP = { 'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','Ö':'o','Ş':'s','Ü':'u' };

function normalizeTitle(title) {
  if (!title) return '';
  let t = title.toLowerCase();
  t = t.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
  return t;
}

async function run() {
  const { data: categories } = await supabase.from('categories').select('id, name, slug, parent_id');
  const elek = categories.find(c => c.slug === 'elektronik');
  const kea = categories.find(c => c.slug === 'kucuk-ev-aletleri');

  if (!elek || !kea) {
    console.log("Kategori bulunamadı!");
    return;
  }

  // 1. Rename Küçük Ev Aletleri to Mutfak Aletleri
  await supabase.from('categories').update({ name: 'Mutfak Aletleri', slug: 'mutfak-aletleri' }).eq('id', kea.id);

  // 2. Create new categories if not exist
  let temizlik = categories.find(c => c.slug === 'supurge-temizlik');
  if (!temizlik) {
    const res = await supabase.from('categories').insert([{
      name: 'Süpürge & Temizlik',
      slug: 'supurge-temizlik',
      parent_id: elek.id
    }]).select().single();
    temizlik = res.data;
  }

  let utu = categories.find(c => c.slug === 'utu-giysi-bakimi');
  if (!utu) {
    const res = await supabase.from('categories').insert([{
      name: 'Ütü & Giysi Bakımı',
      slug: 'utu-giysi-bakimi',
      parent_id: elek.id
    }]).select().single();
    utu = res.data;
  }

  // 3. Move products
  const { data: products } = await supabase.from('products').select('id, title, category_id').eq('category_id', kea.id);

  let mCount = 0, tCount = 0, uCount = 0;

  for (let p of products) {
    const t = normalizeTitle(p.title);
    if (t.includes('utu') || t.includes('buhar kazanli') || t.includes('tefal pro')) {
      await supabase.from('products').update({ category_id: utu.id }).eq('id', p.id);
      uCount++;
    } else if (t.includes('supurge') || t.includes('robot') || t.includes('dyson') || t.includes('yikama')) {
      await supabase.from('products').update({ category_id: temizlik.id }).eq('id', p.id);
      tCount++;
    } else {
      mCount++; // Remains in kea (now Mutfak Aletleri)
    }
  }

  console.log(`Bölünme Tamamlandı!`);
  console.log(`- Mutfak Aletleri: ${mCount}`);
  console.log(`- Süpürge & Temizlik: ${tCount}`);
  console.log(`- Ütü & Giysi Bakımı: ${uCount}`);
}

run();
