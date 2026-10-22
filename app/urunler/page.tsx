import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FilterSidebar from "./FilterSidebar";
import { Metadata } from 'next';
import { analyzePriceTrend } from "@/lib/analytics";
import Image from "next/image";
import { generateProductSlug } from "@/lib/utils";
import { routes } from "@/lib/routes";
import ProductCard from "@/app/components/ProductCard";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: { q?: string, cat?: string, brand?: string, page?: string } }): Promise<Metadata> {
  const { q, cat, brand, page } = searchParams;
  let title = "Tüm Ürünler";
  let description = "Milyonlarca ürünü ve en güncel fiyatları Piinti ile saniyeler içinde karşılaştırın.";

  if (q) {
    title = `"${q}" İçin En Ucuz Fiyatlar ve Modeller`;
    description = `"${q}" aramanız için en uygun fiyatlı seçenekleri, mağaza karşılaştırmalarını ve kullanıcı yorumlarını burada bulun.`;
  } else if (cat) {
    title = `${cat} Modelleri ve En Uygun Fiyatlar`;
    description = `En iyi ${cat} ürünlerini, indirimleri ve tüm mağaza fiyatlarını Piinti kalitesiyle karşılaştırın.`;
  } else if (brand) {
    title = `${brand} Ürünleri, Fiyatları ve Kampanyaları`;
    description = `${brand} marka tüm ürünlerin en güncel piyasa fiyatlarını ve indirimlerini keşfedin.`;
  }

  const canonicalUrl = new URL('https://www.piinti.com/urunler');
  if (cat) canonicalUrl.searchParams.set('cat', cat);
  if (brand) canonicalUrl.searchParams.set('brand', brand);
  if (page && page !== '1') canonicalUrl.searchParams.set('page', page);

  return {
    title: `${title} | Piinti`,
    description,
    alternates: {
      canonical: canonicalUrl.toString(),
    },
    robots: {
      index: !q, // Arama (q) parametresi varsa indekslemeyi kapat
      follow: true,
    }
  };
}

export default async function UrunlerPage({ searchParams }: { searchParams: { q?: string, cat?: string, brand?: string, min_price?: string, max_price?: string, sort?: string, page?: string } }) {
  // Not: min_price, max_price ve sort parametreleri DB seviyesine taşınana kadar şimdilik yok sayılıyor
  const { q, cat, brand, page } = searchParams;

  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const pageSize = 24;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  // Build Supabase query
  let query = supabase.from('products').select(`
    *,
    brands${brand ? '!inner' : ''}(name),
    categories!inner(name, slug),
    product_prices!inner(price, vendor_id, vendors(id, name))
  `, { count: 'exact' }).order('created_at', { ascending: false });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }
  if (cat) {
    query = query.eq('categories.slug', cat);
  }
  if (brand) {
    query = query.eq('brands.name', brand);
  }

  // Sayfalama aralığı ekle
  query = query.range(from, to);

  const { data: products, error: productsError, count: totalCount } = await query;

  let hasError = false;
  if (productsError) {
    console.error('[UrunlerPage] Ürünler yüklenirken Supabase hatası:', productsError);
    hasError = true;
  }

  let filteredProducts = products || [];

  // Sadece en az 1 fiyatı olan (fiyatı toplanmış) ürünleri listele
  filteredProducts = filteredProducts.filter((p: any) => p.product_prices && p.product_prices.length > 0);

  // Sayfadaki ürünler için son 30 günlük fiyat geçmişini ayrı hafif sorguyla çek
  if (filteredProducts.length > 0) {
    const productIds = filteredProducts.map((p: any) => p.id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: historyData, error: historyErr } = await supabase
      .from('price_history')
      .select('product_id, price, recorded_at')
      .in('product_id', productIds)
      .gte('recorded_at', thirtyDaysAgo)
      .order('recorded_at', { ascending: false });

    if (historyErr) {
      console.error('[UrunlerPage] Fiyat geçmişi yüklenirken hata:', historyErr);
    }

    const historyByProduct: Record<string, any[]> = {};
    (historyData || []).forEach((h: any) => {
      if (!historyByProduct[h.product_id]) historyByProduct[h.product_id] = [];
      historyByProduct[h.product_id].push(h);
    });

    filteredProducts.forEach((p: any) => {
      p.price_history = historyByProduct[p.id] || [];
    });
  }

  /* Şimdilik devre dışı: DB seviyesinde min_price kolonu eklenene kadar client-side filtreleme yok sayılıyor
  if (min_price || max_price) {
    const min = min_price ? parseFloat(min_price) : 0;
    const max = max_price ? parseFloat(max_price) : Infinity;
    filteredProducts = filteredProducts.filter((p: any) => {
      const priceStr = p.product_prices?.[0]?.price || p.price_history?.[0]?.price;
      const currentPrice = priceStr ? parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) : 0;
      return currentPrice >= min && currentPrice <= max;
    });
  }
  */

  // Sıralama: Şimdilik sadece 'En Yeniler' aktif (Supabase created_at DESC)
  const currentSort = 'newest';

  /* Şimdilik devre dışı: Fiyata göre sıralama DB seviyesine taşınana kadar gizlendi
  const getPrice = (p: any) => {
    const priceStr = p.product_prices?.[0]?.price || p.price_history?.[0]?.price;
    return priceStr ? parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) : 0;
  };

  if (sort === 'price_asc') {
    filteredProducts.sort((a: any, b: any) => getPrice(a) - getPrice(b));
  } else if (sort === 'price_desc') {
    filteredProducts.sort((a: any, b: any) => getPrice(b) - getPrice(a));
  }
  */

  const totalItems = totalCount ?? filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('cat', cat);
    if (brand) params.set('brand', brand);
    // if (min_price) params.set('min_price', min_price);
    // if (max_price) params.set('max_price', max_price);
    // if (sort) params.set('sort', sort);
    if (targetPage > 1) params.set('page', targetPage.toString());
    const qs = params.toString();
    return qs ? `/urunler?${qs}` : '/urunler';
  };

  // Get all categories to build hierarchy
  const { data: allCategories } = await supabase.from('categories').select('*');
  const { data: productsForFilters } = await supabase.from('products').select('category_id, brands(name)');

  const brandsData = Array.from(new Map((productsForFilters || [])
    .filter((p: any) => p.brands)
    .map((p: any) => {
      const b = Array.isArray(p.brands) ? p.brands[0] : p.brands;
      return [b.name, b];
    })
  ).values());

  const usedCategoryIds = new Set((productsForFilters || []).map((p: any) => p.category_id));
  const activeSubs = (allCategories || []).filter(c => usedCategoryIds.has(c.id) && c.parent_id !== null);
  
  // Get ALL main categories so they always show in the sidebar (except Piinti Market)
  const allMains = (allCategories || []).filter(c => c.parent_id === null && c.name !== 'Piinti Market');

  // Build hierarchical structure
  const categoriesData = allMains.map(main => ({
    ...main,
    subs: activeSubs.filter(sub => sub.parent_id === main.id)
  }));

  // Schema.org: CollectionPage & ItemList & BreadcrumbList
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: routes.home() },
      { '@type': 'ListItem', position: 2, name: 'Tüm Ürünler', item: routes.listing() },
      ...(cat ? [{ '@type': 'ListItem', position: 3, name: cat, item: `https://www.piinti.com/urunler?cat=${cat}` }] : [])
    ]
  };

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: q ? `"${q}" Arama Sonuçları` : cat ? `${cat} Modelleri` : 'Tüm Ürünler',
    url: typeof window !== 'undefined' ? window.location.href : 'https://www.piinti.com/urunler',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredProducts.slice(0, 20).map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: routes.productCanonical(p.slug || generateProductSlug(p.title, p.id))
      }))
    }
  };

  return (
    <>
      {/* Schema Injections */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <FilterSidebar 
        categories={categoriesData || []} 
        brands={brandsData || []} 
        currentCat={cat} 
        currentBrand={brand} 
        currentQ={q}
        currentMinPrice={undefined} 
        currentMaxPrice={undefined}
        currentSort={currentSort}
      />

      {/* Product List */}
      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
             {q ? `"${q}" İçin Sonuçlar` : cat ? `Kategori Sonuçları` : "Tüm Ürünler"} 
             <span className="text-slate-500 text-base font-normal ml-2">({totalItems} sonuç{totalPages > 1 ? ` - Sayfa ${currentPage}/${totalPages}` : ''})</span>
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hasError ? (
            <div className="col-span-full py-20 px-6 flex flex-col items-center justify-center text-center bg-red-50/50 rounded-[2rem] border border-red-100">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ürünler Yüklenemedi</h3>
              <p className="text-slate-500 font-medium mb-6 max-w-sm">
                Sunucudan ürün listesi alınırken bir sorun oluştu. Lütfen sayfayı yenilemeyi deneyin.
              </p>
              <Link 
                href={buildPageUrl(currentPage)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs uppercase tracking-wider"
              >
                Tekrar Dene
              </Link>
            </div>
          ) : (
            <>
              {filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-32 px-6 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-8">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Kanka Aradığını Bulamadık! 🕵️‍♂️</h3>
                  <p className="text-slate-500 font-medium mb-10 max-w-sm leading-relaxed">
                    Bu kriterlere uygun bir ürün şu an radarımızda yok. Filtreleri temizleyerek veya farklı bir arama yaparak tekrar deneyebilirsin.
                  </p>
                  <Link 
                    href="/urunler" 
                    className="bg-slate-900 hover:bg-primary text-white font-black px-10 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-slate-900/10 uppercase tracking-widest text-[10px]"
                  >
                    Filtreleri Temizle
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sayfalama Kontrolleri */}
        {totalPages > 1 && !hasError && (
          <div className="mt-12 flex justify-center items-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:border-slate-400 transition"
              >
                ← Önceki
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 font-bold text-xs cursor-not-allowed">
                ← Önceki
              </span>
            )}

            <span className="text-xs font-semibold text-slate-500 px-3">
              Sayfa {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:border-slate-400 transition"
              >
                Sonraki →
              </Link>
            ) : (
              <span className="px-5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 font-bold text-xs cursor-not-allowed">
                Sonraki →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
