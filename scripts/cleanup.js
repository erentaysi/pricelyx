const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co';
const supabaseKey = process.env.GEMINI_API_KEY ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo' : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo');

async function cleanUp() {
  console.log("Cleaning up dummy products...");
  
  // Table Lamp, Plant Pot etc were part of the initial SQL seed.
  const titlesToDelete = [
    'Table Lamp', 
    'Plant Pot', 
    'House Showpiece Plant', 
    'Family Tree Photo Frame', 
    'Decoration Swing',
    'Gaming Mouse',
    'Mechanical Keyboard',
    'Ergonomic Chair'
  ];

  for (const title of titlesToDelete) {
    const { error } = await supabase.from('products').delete().ilike('title', `%${title}%`);
    if (error) console.error("Error deleting", title, error);
    else console.log("Deleted", title);
  }

  // Also delete products with placeholder or broken images
  const { error: err2 } = await supabase.from('products').delete().eq('image_url', 'https://example.com/lamp.jpg');
  
  console.log("Cleanup complete!");
}

cleanUp();
