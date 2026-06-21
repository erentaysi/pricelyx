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
  t = t.replace(/[^a-z0-9\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

const NEW_TAXONOMY = [
  { name: 'Elektronik', icon: '⚡', isMain: true, subs: ['Cep Telefonu & Aksesuar', 'Bilgisayar & Laptop', 'Bilgisayar Donanımı', 'TV, Ses & Görüntü Sistemleri', 'Küçük Ev Aletleri', 'Beyaz Eşya', 'Isıtma & Soğutma', 'Fotoğraf & Kamera', 'Oyun Konsolları'] },
  { name: 'Ev & Yaşam', icon: '🏠', isMain: true, subs: ['Mobilya & Dekorasyon', 'Ev Tekstili', 'Mutfak Gereçleri & Züccaciye', 'Elektrik & Aydınlatma', 'Banyo & Ev Gereçleri', 'Sanatsal Malzemeler'] },
  { name: 'Ofis & Kırtasiye', icon: '📎', isMain: true, subs: ['Kırtasiye Ürünleri', 'Ofis Mobilyası & Ekipmanları'] },
  { name: 'Anne, Bebek & Oyuncak', icon: '👶', isMain: true, subs: ['Bebek Bakım & Ekipman', 'Anne Ürünleri', 'Oyuncak'] },
  { name: 'Moda, Saat & Takı', icon: '👗', isMain: true, subs: ['Kadın Giyim', 'Erkek Giyim', 'Ayakkabı & Çanta', 'Saat', 'Takı & Mücevher'] },
  { name: 'Kitap, Müzik & Hobi', icon: '📚', isMain: true, subs: ['Kitap', 'Müzik & Enstrüman', 'Hobi & El Sanatları'] },
  { name: 'Spor & Outdoor', icon: '⚽', isMain: true, subs: ['Spor Giyim & Ekipman', 'Outdoor & Kamp', 'Fitness'] },
  { name: 'Sağlık, Bakım & Kozmetik', icon: '💄', isMain: true, subs: ['Kozmetik & Makyaj', 'Kişisel Bakım', 'Sağlık Ürünleri'] },
  { name: 'Oto, Bahçe & Yapı Market', icon: '🚗', isMain: true, subs: ['Oto Aksesuar & Lastik', 'Bahçe Ürünleri', 'Yapı Market & Hırdavat'] },
  { name: 'Petshop', icon: '🐾', isMain: true, subs: ['Kedi Ürünleri', 'Köpek Ürünleri', 'Diğer Evcil Hayvan Ürünleri'] },
  { name: 'Piinti Market', icon: '🛒', isMain: true, subs: [] } // Yakında etiketi için boş
];

function generateSlug(text) {
  let t = text.toLowerCase();
  t = t.replace(/[çğıöşüÇĞİÖŞÜ]/g, m => TR_MAP[m] || m);
  t = t.replace(/[^a-z0-9]+/g, '-');
  return t.replace(/^-+|-+$/g, '');
}

function mapToNewCategory(product) {
  const t = normalizeTitle(product.title);
  
  if (t.includes('kitap') || t.includes('roman') || t.includes('nuls') || t.includes('manuel') || t.includes('guide') || t.includes('dergi') || t.split(' ').includes('book') || t.includes('paperback')) {
    if (t.includes('espresso') || t.includes('kahve') || t.includes('makinesi')) return 'kucuk-ev-aletleri';
    return 'kitap';
  }

  if (t.includes('tiras') || t.includes('epilasyon') || t.includes('kurutma') || t.includes('sac duzlestirici') || t.includes('trimmer') || t.includes('bakim seti') || t.includes('sakal')) return 'kisisel-bakim';
  if (t.includes('parfum') || t.includes('kozmetik')) return 'kozmetik-makyaj';
  if (t.includes('supurge') || t.includes('airfryer') || t.includes('fritoz') || t.includes('frito') || t.includes('air fryer') || t.includes('dyson') || t.includes('robot') || t.includes('kahve') || t.includes('cay') || t.includes('tchibo') || t.includes('mikser') || t.includes('utu') || t.includes('blender') || t.includes('espresso') || t.includes('multicooker') || t.includes('juicer') || t.includes('yikama')) return 'kucuk-ev-aletleri';
  if (t.includes('akilli saat') || t.includes('watch') || t.includes('akilli bileklik') || t.includes('smart band') || t.includes('saati')) return 'cep-telefonu-aksesuar';
  if ((t.includes('telefon') || t.includes('iphone') || t.includes('galaxy s') || t.includes('galaxy a') || t.includes('poco') || t.includes('pixel') || t.includes('kablo') || t.includes('kilif')) && !t.includes('kulaklik')) return 'cep-telefonu-aksesuar';
  if (t.includes('kulaklik') || t.includes('kulakligi') || t.includes('airpods') || t.includes('earbuds') || t.includes('headset') || t.includes('buds') || t.includes('hoparlor') || t.includes('tws') || t.includes('marshall') || t.includes('freeclip') || t.includes('riversong')) return 'tv-ses-goruntu-sistemleri';
  if (t.includes('playstation') || t.includes('xbox') || t.includes('nintendo') || t.includes('konsol') || t.includes('dualsense') || t.includes('gamepad') || t.includes('joy con') || t.includes('mario') || t.includes('metroid') || t.includes('controller') || t.includes('steering wheel')) return 'oyun-konsollari';
  if (t.includes('laptop') || t.includes('bilgisayar') || t.includes('macbook') || t.includes('notebook') || t.includes('ideapad') || t.includes('surface') || t.includes('tablet')) return 'bilgisayar-laptop';
  if (t.includes('monitor') || t.includes('mouse') || t.includes('klavye')) return 'bilgisayar-donanimi';
  if (t.includes('kosu') || t.includes('fitness') || t.includes('halter') || t.includes('yoga') || t.includes('spor') || t.includes('dambil') || t.includes('pilates') || t.includes('mat') || t.includes('stepper') || t.includes('el yayi') || t.includes('egzersiz') || t.includes('agirlik sehpasi') || t.includes('lifting straps') || t.includes('pi lates')) return 'fitness';
  if (t.includes('cay') || t.includes('kahve')) return 'mutfak-gerecleri-zuccaciye';
  if (t.includes('silikon') || t.includes('matkap')) return 'yapi-market-hirdavat';

  return 'BELIRSIZ';
}

async function run() {
  console.log("Migration başlıyor...");

  // 1. Fetch current categories
  const { data: existingCategories } = await supabase.from('categories').select('*');
  let categoryMap = {}; // slug -> id mapping
  existingCategories.forEach(c => categoryMap[c.slug] = c.id);

  // 2. Insert main categories
  console.log("Ana kategoriler ekleniyor...");
  for (let main of NEW_TAXONOMY) {
    let mainSlug = generateSlug(main.name);
    let mainId;

    if (categoryMap[mainSlug]) {
      mainId = categoryMap[mainSlug];
      // Update icon and parent_id just in case
      await supabase.from('categories').update({ parent_id: null, icon: main.icon }).eq('id', mainId);
    } else {
      const { data, error } = await supabase.from('categories').insert([{
        name: main.name,
        slug: mainSlug,
        icon: main.icon,
        parent_id: null
      }]).select().single();
      if (error) { console.error('Error inserting main category:', error); return; }
      mainId = data.id;
      categoryMap[mainSlug] = mainId;
    }

    // Insert subcategories
    for (let sub of main.subs) {
      let subSlug = generateSlug(sub);
      if (!categoryMap[subSlug]) {
        const { data, error } = await supabase.from('categories').insert([{
          name: sub,
          slug: subSlug,
          icon: null,
          parent_id: mainId
        }]).select().single();
        if (error) { console.error('Error inserting subcategory:', error); return; }
        categoryMap[subSlug] = data.id;
      } else {
        // Ensure parent_id is correct
        await supabase.from('categories').update({ parent_id: mainId }).eq('id', categoryMap[subSlug]);
      }
    }
  }

  // 3. Update products
  console.log("Ürünler taşınıyor...");
  const { data: products } = await supabase.from('products').select('id, title, category_id');
  let successCount = 0;
  let failCount = 0;

  for (let p of products) {
    const targetSlug = mapToNewCategory(p);
    if (targetSlug !== 'BELIRSIZ' && categoryMap[targetSlug]) {
      const targetId = categoryMap[targetSlug];
      if (p.category_id !== targetId) {
        const { error } = await supabase.from('products').update({ category_id: targetId }).eq('id', p.id);
        if (error) {
          console.error(`Failed to update ${p.id}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++; // Zaten doğru kategoride
      }
    } else {
      console.log(`Bilinmeyen / Eşleşmeyen Ürün: ${p.title} -> Slug: ${targetSlug}`);
      failCount++;
    }
  }

  console.log(`\n=== MIGRATION TAMAMLANDI ===`);
  console.log(`Başarılı Taşınan Ürün: ${successCount}`);
  console.log(`Eşleşmeyen/Hatalı Ürün: ${failCount}`);
}

run();
