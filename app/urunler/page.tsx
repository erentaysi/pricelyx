import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FilterSidebar from "./FilterSidebar";
import { Metadata } from 'next';
import { analyzePriceTrend } from "@/lib/analytics";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: { q?: string, cat?: string, brand?: string } }): Promise<Metadata> {
  const { q, cat, brand } = searchParams;
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

  return {
    title: `${title} | Piinti`,
    description,
  };
}

export default async function UrunlerPage({ searchParams }: { searchParams: { q?: string, cat?: string, brand?: string } }) {
  const { q, cat, brand } = searchParams;

  // Build Supabase query
  let query = supabase.from('products').select(`
    *,
    brands!inner(name),
    categories!inner(name, slug),
    product_prices(price),
    price_history(price, recorded_at)
  `).order('created_at', { ascending: false });

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }
  if (cat) {
    query = query.eq('categories.slug', cat);
  }
  if (brand) {
    query = query.eq('brands.name', brand);
  }

  const { data: products } = await query;
  const filteredProducts = products || [];

  // Get all categories and brands for the sidebar
  const { data: categoriesData } = await supabase.from('categories').select('name, slug');
  const { data: brandsData } = await supabase.from('brands').select('name');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <FilterSidebar 
        categories={categoriesData || []} 
        brands={brandsData || []} 
        currentCat={cat} 
        currentBrand={brand} 
        currentQ={q}
      />

      {/* Product List */}
      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
             {q ? `"${q}" İçin Sonuçlar` : cat ? `Kategori Sonuçları` : "Tüm Ürünler"} 
             <span className="text-slate-500 text-base font-normal ml-2">({filteredProducts.length} sonuç)</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product: any) => {
             const prices = product.product_prices || [];
             const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => p.price)) : 0;
             function trPrice(price: number) {
               return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
             }
             const analytics = analyzePriceTrend(product.price_history || [], minPrice);

             return (
              <Link href={`/urun/${product.id}`} key={product.id}>
                <div className="bg-white border text-center border-slate-100 rounded-2xl p-5 product-card-hover cursor-pointer group flex flex-col h-full overflow-hidden">
                  <div className="bg-slate-50 rounded-xl h-48 mb-4 flex items-center justify-center p-4 overflow-hidden relative">
                    {/* Analytics Badge */}
                    <div className={`absolute top-2 right-2 ${analytics.trend === 'bad' ? 'bg-rose-500' : analytics.color} text-white text-[9px] font-black px-2 py-1 rounded-full z-10 uppercase tracking-tighter`}>
                      {analytics.icon} {analytics.message}
                    </div>

                    {(product.image_url?.startsWith('http') || product.image_url?.startsWith('data:image')) ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={product.image_url.replace('http://', 'https://')} 
                          alt={`${product.title} - En İyi Fiyatlarla Piinti'de`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-contain group-hover:scale-105 transition-transform duration-300" 
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <span className="text-6xl group-hover:scale-110 transition-transform duration-300 break-all text-center">
                        {product.image_url}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-xs text-brand font-semibold mb-1 block">{product.brands?.name}</span>
                    <h3 className="font-bold text-slate-800 mb-2 leading-tight group-hover:text-brand transition-colors line-clamp-2 h-[40px]">{product.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium text-slate-700">{product.rating}</span>
                      <span>({product.reviews_count})</span>
                    </div>
                  </div>
                  <div className="text-left mt-auto">
                    <div className={`text-2xl font-black ${analytics.trend === 'best' || analytics.trend === 'good' ? 'text-emerald-600' : analytics.trend === 'bad' ? 'text-rose-600' : 'text-slate-900'}`}>{minPrice > 0 ? trPrice(minPrice) : 'Fiyat Yok'}</div>
                    <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1">
                       🏪 {prices.length} mağazada
                    </div>
                  </div>
                </div>
              </Link>
             )
          })}
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
        </div>
      </div>
    </div>
  );
}
