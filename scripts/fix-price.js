const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo'
);

async function fixPrice() {
    const { data: prod } = await supabase.from('products').select('id').ilike('title', '%Robot Süpürge Bakım Paketi%').limit(1).single();
    
    if (prod) {
        console.log("Found product:", prod.id);
        const { error } = await supabase.from('product_prices').update({ price: 1999, original_price: 1999 }).eq('product_id', prod.id);
        if (error) console.error(error);
        else console.log("Successfully fixed price to 1999 TL for the robot vacuum maintenance package.");
    } else {
        console.log("Product not found.");
    }
}

fixPrice();
