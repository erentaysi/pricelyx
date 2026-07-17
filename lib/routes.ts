/**
 * Centralized Route Helpers for Piinti Programmatic SEO
 * Gelicekte URL yapısı (Örn: /urunler -> /kategori/marka/urun) değişirse sadece bu dosya düzenlenecek.
 */

const BASE_URL = 'https://www.piinti.com';

export const routes = {
  home: () => '/',
  
  // Ürün Detay
  product: (slug: string) => `/urunler/${slug}`,
  productCanonical: (slug: string) => `${BASE_URL}/urunler/${slug}`,
  
  // Kategori (Programmatic)
  category: (slug: string) => `/kategori/${slug}`,
  categoryCanonical: (slug: string) => `${BASE_URL}/kategori/${slug}`,

  // Marka (Programmatic)
  brand: (slug: string) => `/marka/${slug}`,
  brandCanonical: (slug: string) => `${BASE_URL}/marka/${slug}`,

  // Kategori + Marka Kesişimi (Programmatic)
  categoryBrand: (catSlug: string, brandSlug: string) => `/kategori/${catSlug}/${brandSlug}`,
  categoryBrandCanonical: (catSlug: string, brandSlug: string) => `${BASE_URL}/kategori/${catSlug}/${brandSlug}`,

  // Karşılaştırma Motoru (Programmatic)
  compare: (slug1: string, slug2: string) => `/karsilastir/${slug1}-vs-${slug2}`,
  compareCanonical: (slug1: string, slug2: string) => `${BASE_URL}/karsilastir/${slug1}-vs-${slug2}`,

  // Arama / Liste Ana Sayfası
  listing: () => `/urunler`,
  
  // Yardımcı SEO Metinleri (İleride DB veya AI'a bağlanacak)
  seoContent: {
    getCategoryDescription: (catName: string) => `En ucuz ${catName} modellerini inceleyin, farklı mağazaların ${catName} fiyatlarını karşılaştırın ve indirimleri kaçırmayın. ${catName} kategorisinde en iyi fiyat/performans ürünlerini keşfedin.`,
    getBrandDescription: (brandName: string) => `${brandName} markasının tüm ürünleri, en düşük fiyat garantisi ve kullanıcı yorumlarıyla Piinti'de. ${brandName} indirimleri, kampanyaları ve fiyat geçmişi analizleri.`,
    getCategoryBrandDescription: (catName: string, brandName: string) => `En iyi ${brandName} ${catName} modelleri ve güncel fiyatları. ${brandName} marka ${catName} arayışınızda mağaza fiyatlarını karşılaştırarak en ucuz seçeneği bulun.`
  }
};
