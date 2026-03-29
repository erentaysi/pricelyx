import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FilterSidebar from "./FilterSidebar";
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: { q?: string, cat?: string, brand?: string } }): Promise<Metadata> {
  const { q, cat, brand } = searchParams;
  let title = "Tüm Ürünler";
  let description = "En güncel ürünleri ve fiyatları karşılaştırın.";

  if (q) {
    title = `"${q}" İçin Sonuçlar`;
    description = `${q} fiyatlarını ve özelliklerini tüm mağazalar arasından karşılaştırın.`;
  } else if (cat) {
    title = `${cat} Kategorisindeki Ürünler`;
    description = `En iyi ${cat} modellerini ve fiyatlarını keşfedin.`;
  } else if (brand) {
    title = `${brand} Ürünleri`;
    description = `${brand} marka ürünlerin fiyatlarını karşılaştırın.`;
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
    product_prices(price)
  `);

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
             const formatPrice = (p: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(p);

             return (
              <Link href={`/urun/${product.id}`} key={product.id}>
                <div className="bg-white border text-center border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:border-brand/30 transition-all cursor-pointer group flex flex-col h-full">
                  <div className="bg-slate-50 rounded-xl h-48 mb-4 flex items-center justify-center p-4 overflow-hidden relative">
                    {(product.image_url?.startsWith('http') || product.image_url?.startsWith('data:image')) ? (
                      <img src={product.image_url} alt={product.title} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300" />
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
                    <div className="text-2xl font-black text-slate-900">{minPrice > 0 ? formatPrice(minPrice) : 'Fiyat Yok'}</div>
                    <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1">
                       🏪 {prices.length} mağazada
                    </div>
                  </div>
                </div>
              </Link>
             )
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500 bg-white rounded-2xl border border-slate-100">
              Bu kriterlere uygun ürün bulunamadı. Aramayı genişletmeyi veya farklı filtreler kullanmayı deneyin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
