require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fix() {
  console.log('Fixing categories...');
  
  // Get all categories
  const { data: cats } = await supabase.from('categories').select('id, slug, name');
  console.log('Categories:', cats?.map(c => `${c.id}: ${c.name} (${c.slug})`));
  
  if (!cats) { console.log('No categories found'); return; }
  
  // Find the gaming/konsol category
  const gameCat = cats.find(c => c.slug?.includes('oyun') || c.slug?.includes('konsol'));
  const sportCat = cats.find(c => c.slug?.includes('spor') || c.slug?.includes('outdoor'));
  const elektronikCat = cats.find(c => c.slug?.includes('elektronik'));
  
  console.log('Game cat:', gameCat);
  console.log('Sport cat:', sportCat);
  console.log('Elektronik cat:', elektronikCat);
  
  // Get all products with mismatched categories
  const { data: allProducts } = await supabase.from('products').select('id, title, category_id');
  
  if (!allProducts) return;
  
  for (const p of allProducts) {
    const titleLower = p.title.toLowerCase();
    
    // Joystick, gamepad, xbox, playstation -> gaming
    if (gameCat && (titleLower.includes('joystick') || titleLower.includes('gamepad') || titleLower.includes('xbox') || titleLower.includes('playstation') || titleLower.includes('nintendo') || titleLower.includes('dualsense'))) {
      if (p.category_id !== gameCat.id) {
        console.log(`Moving "${p.title}" to ${gameCat.name}`);
        await supabase.from('products').update({ category_id: gameCat.id }).eq('id', p.id);
      }
    }
    
    // Koşu bandı, spor -> sport
    if (sportCat && (titleLower.includes('koşu') || titleLower.includes('kosu') || titleLower.includes('fitness') || titleLower.includes('spor'))) {
      if (p.category_id !== sportCat.id) {
        console.log(`Moving "${p.title}" to ${sportCat.name}`);
        await supabase.from('products').update({ category_id: sportCat.id }).eq('id', p.id);
      }
    }
    
    // Kulaklık, hoparlör -> elektronik (if not already)
    if (elektronikCat && (titleLower.includes('kulaklık') || titleLower.includes('kulaklik') || titleLower.includes('hoparlör') || titleLower.includes('hoparlor'))) {
      const tvCat = cats.find(c => c.slug?.includes('tv'));
      const cleanCat = cats.find(c => c.slug?.includes('supurge') || c.slug?.includes('temizlik'));
      if (tvCat && p.category_id === tvCat.id) {
        console.log(`Moving "${p.title}" from TV to ${elektronikCat.name}`);
        await supabase.from('products').update({ category_id: elektronikCat.id }).eq('id', p.id);
      }
      if (cleanCat && p.category_id === cleanCat.id) {
        console.log(`Moving "${p.title}" from Temizlik to ${elektronikCat.name}`);
        await supabase.from('products').update({ category_id: elektronikCat.id }).eq('id', p.id);
      }
    }
  }
  
  console.log('Category fixes completed!');
}

fix();
