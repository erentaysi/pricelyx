const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo'
);

async function addVendors() {
    const vendors = [
        { name: 'PttAVM', logo: '📮', color: '#FFCC00' },
        { name: 'MediaMarkt', logo: '🔴', color: '#DF0000' },
        { name: 'Vatan Bilgisayar', logo: '💻', color: '#0066CC' },
        { name: 'Pazarama', logo: '🛒', color: '#FF6B00' },
        { name: 'Teknosa', logo: '🟠', color: '#FF6600' },
        { name: 'Çiçeksepeti', logo: '🌸', color: '#8B5CF6' }
    ];

    for (const v of vendors) {
        const { data, error } = await supabase
            .from('vendors')
            .upsert({ name: v.name, logo: v.logo, color: v.color }, { onConflict: 'name' })
            .select();
        
        if (error) {
            console.error('Hata:', error.message);
        } else {
            console.log('Eklendi:', v.name);
        }
    }
}

addVendors();
