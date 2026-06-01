/**
 * MERGE DUPLICATES SCRIPT
 * Veritabanındaki aynı ürüne ait duplike kayıtları birleştirir.
 * 
 * Kullanım: node scripts/merge-duplicates.js
 * 
 * Dikkat: Bu script TEK SEFERLIK çalıştırılmalıdır. 
 * Çalıştırmadan önce veritabanı yedeği almanız önerilir.
 */

const { normalizeTitle, similarityScore, supabase } = require('./product-matcher');

async function mergeDuplicates() {
    console.log('🔍 Duplike ürün taraması başlıyor...\n');
    
    // 1. Tüm ürünleri çek
    const { data: allProducts, error } = await supabase
        .from('products')
        .select('id, title')
        .order('created_at', { ascending: true }); // En eski = master
    
    if (error || !allProducts) {
        console.error('❌ Ürünler çekilemedi:', error?.message);
        return;
    }
    
    console.log(`📦 Toplam ${allProducts.length} ürün bulundu.\n`);
    
    // 2. Parmak izlerini çıkar
    const fingerprints = allProducts.map(p => ({
        ...p,
        fingerprint: normalizeTitle(p.title)
    }));
    
    // 3. Grupla (aynı parmak izine sahip olanlar)
    const groups = {};
    for (const p of fingerprints) {
        if (!p.fingerprint || p.fingerprint.length < 5) continue;
        if (!groups[p.fingerprint]) groups[p.fingerprint] = [];
        groups[p.fingerprint].push(p);
    }
    
    // 4. Fuzzy eşleştirme: Tam eşleşmeyen ama çok benzer olanları da bul
    const fingerprintKeys = Object.keys(groups);
    const mergedGroups = new Map();
    const visited = new Set();
    
    for (let i = 0; i < fingerprintKeys.length; i++) {
        if (visited.has(fingerprintKeys[i])) continue;
        
        const group = [...groups[fingerprintKeys[i]]];
        visited.add(fingerprintKeys[i]);
        
        for (let j = i + 1; j < fingerprintKeys.length; j++) {
            if (visited.has(fingerprintKeys[j])) continue;
            
            const score = similarityScore(fingerprintKeys[i], fingerprintKeys[j]);
            if (score >= 0.7) { // %70+ benzerlik = aynı ürün
                group.push(...groups[fingerprintKeys[j]]);
                visited.add(fingerprintKeys[j]);
            }
        }
        
        if (group.length > 1) {
            mergedGroups.set(fingerprintKeys[i], group);
        }
    }
    
    console.log(`🔗 ${mergedGroups.size} duplike grubu tespit edildi.\n`);
    
    if (mergedGroups.size === 0) {
        console.log('✅ Hiç duplike bulunamadı! Veritabanı temiz.');
        return;
    }
    
    // 5. Birleştirme işlemi
    let totalMerged = 0;
    
    for (const [fp, group] of mergedGroups) {
        const master = group[0]; // En eski = master
        const dupes = group.slice(1);
        const dupeIds = dupes.map(d => d.id);
        
        console.log(`\n📋 Grup: "${master.title}"`);
        console.log(`   Master: ${master.id}`);
        console.log(`   Duplikeler (${dupes.length}): ${dupes.map(d => d.title).join(' | ')}`);
        
        for (const dupeId of dupeIds) {
            // product_prices: duplike ürünün fiyatlarını master'a taşı
            const { data: dupePrices } = await supabase
                .from('product_prices')
                .select('id, vendor_id')
                .eq('product_id', dupeId);
            
            if (dupePrices) {
                for (const dp of dupePrices) {
                    // Master'da aynı vendor var mı?
                    const { data: masterPrice } = await supabase
                        .from('product_prices')
                        .select('id')
                        .eq('product_id', master.id)
                        .eq('vendor_id', dp.vendor_id)
                        .single();
                    
                    if (!masterPrice) {
                        // Yoksa taşı
                        await supabase.from('product_prices')
                            .update({ product_id: master.id })
                            .eq('id', dp.id);
                    }
                    // Varsa duplike fiyatı sil (unique kısıtı nedeniyle)
                }
            }
            
            // price_history: duplike geçmişi master'a taşı
            await supabase.from('price_history')
                .update({ product_id: master.id })
                .eq('product_id', dupeId);
            
            // user_favorites: duplike favorileri master'a taşı
            const { data: dupeFavs } = await supabase
                .from('user_favorites')
                .select('id, user_id')
                .eq('product_id', dupeId);
            
            if (dupeFavs) {
                for (const fav of dupeFavs) {
                    const { data: masterFav } = await supabase
                        .from('user_favorites')
                        .select('id')
                        .eq('product_id', master.id)
                        .eq('user_id', fav.user_id)
                        .single();
                    
                    if (!masterFav) {
                        await supabase.from('user_favorites')
                            .update({ product_id: master.id })
                            .eq('id', fav.id);
                    } else {
                        // Kullanıcı zaten master'ı favorilemişse duplike favoriyi sil
                        await supabase.from('user_favorites').delete().eq('id', fav.id);
                    }
                }
            }
            
            // price_alerts: duplike alarmları master'a taşı
            await supabase.from('price_alerts')
                .update({ product_id: master.id })
                .eq('product_id', dupeId);
            
            // Son olarak duplike ürünü sil
            await supabase.from('product_prices').delete().eq('product_id', dupeId);
            await supabase.from('products').delete().eq('id', dupeId);
            
            totalMerged++;
        }
    }
    
    console.log(`\n\n🎉 Birleştirme tamamlandı!`);
    console.log(`   📊 ${totalMerged} duplike ürün, ${mergedGroups.size} ana ürüne birleştirildi.`);
    
    // Son durum raporu
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`   📦 Veritabanındaki toplam ürün sayısı: ${count}`);
}

mergeDuplicates().catch(console.error);
