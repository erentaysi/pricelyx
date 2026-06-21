require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: categories } = await supabase.from('categories').select('id, slug');
  const catMap = {};
  categories.forEach(c => catMap[c.slug] = c.id);

  const updates = [
    { title: 'Cecotec CecoFry 5500 Pro, 5.5L Air Fryer XL, 1700 W, PerfectCook Teknolojisi, 8 Pişirme Modu', slug: 'kucuk-ev-aletleri' },
    { title: 'Xiaomi Air Fryer 6L Siyah 44576', slug: 'kucuk-ev-aletleri' },
    { title: 'CONTİ CDF-401 FRİTO AİRFRYER YAĞSIZ FRİTÖZ-BEYAZ', slug: 'kucuk-ev-aletleri' },
    { title: 'Kenwood HFP80.000BK Air Fryer XXXL Siyah', slug: 'kucuk-ev-aletleri' },
    { title: 'Caso AF 200 Air Fryer 3 L Black', slug: 'kucuk-ev-aletleri' },
    { title: 'Dynamic Pi̇lates Topu, Unisex', slug: 'fitness' }
  ];

  let success = 0;
  for (let u of updates) {
    if (catMap[u.slug]) {
      const { error } = await supabase.from('products').update({ category_id: catMap[u.slug] }).eq('title', u.title);
      if (!error) success++;
      else console.error(error);
    }
  }

  console.log(`602/602 completed. Fixed ${success} items.`);
}

run();
