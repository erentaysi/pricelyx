// Daha temiz ve izole olması için normalize ve similarity'yi buraya alalım
function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\sçğıöşü]/g, ' ')
    .replace(/\b(adet|cm|gr|ml|kg|yaş|ay)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (let w of words1) {
    if (words2.has(w)) intersection++;
  }
  
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

/**
 * Gelen ürün için veritabanında "Canonical" bir parent ürün olup olmadığını kontrol eder.
 * @returns {Promise<string|null>} canonical_id (Eğer eşleşen varsa ID'sini döner, yoksa null)
 */
async function findCanonicalProduct(supabase, title, brandId) {
  if (!brandId) return null; // Marka yoksa eşleştirme çok riskli
  
  const normTitle = normalizeTitle(title);
  if (normTitle.length < 3) return null;

  // Aynı markaya ait olan ana ürünleri getir (canonical_id IS NULL)
  // NOT: Şimdilik limit(500) koyduk, marka bazında çok şişerse pg_trgm RPC yazılacak.
  const { data: candidates, error } = await supabase
    .from('products')
    .select('id, title')
    .eq('brand_id', brandId)
    .is('canonical_id', null) 
    .limit(500);

  if (error || !candidates || candidates.length === 0) return null;

  let bestMatch = null;
  let highestSimilarity = 0;

  for (let c of candidates) {
    const cNorm = normalizeTitle(c.title);
    const sim = calculateSimilarity(normTitle, cNorm);
    
    // %75'ten fazla benziyorsa ve en iyi eşleşmeyse
    if (sim > 0.75 && sim > highestSimilarity) {
      highestSimilarity = sim;
      bestMatch = c.id;
    }
  }

  // Eğer eşleşme bulunduysa Parent (Canonical) ID'sini dön
  return bestMatch;
}

module.exports = {
  findCanonicalProduct
};
