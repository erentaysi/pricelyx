export function generateAffiliateLink(vendorName: string, productUrl: string, affiliateUrl?: string | null): string {
  // Veritabanında özel affiliate_url varsa onu kullan
  if (affiliateUrl) return affiliateUrl;
  
  // LG Türkiye Admitad entegrasyonu
  if (vendorName === 'LG Türkiye') {
    const lgAffiliateBase = 'https://kjuzv.com/g/kzqyy0q257e3ccfa16cbef2202fc4d/';
    return `${lgAffiliateBase}?ulp=${encodeURIComponent(productUrl)}`;
  }

  // Civil, e-bebek, Toyzz Shop gibi mağazalar için henüz affiliate aktif değil
  // Geriye ham URL'i döndür
  return productUrl;
}

export function isAffiliateLink(vendorName: string, affiliateUrl?: string | null): boolean {
  if (affiliateUrl) return true;
  if (vendorName === 'LG Türkiye') return true;
  return false;
}
