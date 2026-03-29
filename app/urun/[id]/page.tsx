import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SearchForm from '@/app/components/SearchForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UrunDetay({ params }: { params: { id: string } }) {
  // Fetch real product from Supabase
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      brands (name),
      categories (name),
      product_prices (
        price,
        original_price,
        shipping_info,
        product_url,
        in_stock,
        vendors (name, logo, color)
      )
    `)
    .eq('id', params.id)
    .single();

  if (!product) {
    notFound();
  }

  const prices = product.product_prices || [];
  const lowestPrice = prices.length > 0 ? Math.min(...prices.map((p:any) => p.price)) : 0;
  
  // Create a sorted list from cheapest to most expensive
  const sortedPrices = [...prices].sort((a:any, b:any) => a.price - b.price);

  function formatPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price);
  }

  return (
    <main className="min-h-screen pb-16 bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-100 py-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
           <SearchForm />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {/* Breadcrumb */}
        <div className="text-sm font-medium text-slate-500 mb-8 flex items-center gap-2">
           <Link href="/" className="hover:text-brand transition-colors">Ana Sayfa</Link>
           <span>/</span>
           <Link href={`/urunler?cat=${product.categories?.name}`} className="hover:text-brand transition-colors">{product.categories?.name}</Link>
           <span>/</span>
           <span className="text-slate-800">{product.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Visual */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white shadow border border-slate-100 aspect-square rounded-3xl flex items-center justify-center relative p-8">
               {product.is_trend && (
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-brand text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                    🔥 Trend
                  </span>
               )}
               <div className="text-9xl">{product.image_url}</div>
               
               <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                 <button className="w-10 h-10 bg-white/50 backdrop-blur border border-slate-200 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110">♡</button>
                 <button className="w-10 h-10 bg-white/50 backdrop-blur border border-slate-200 text-slate-400 hover:text-brand rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-110">Share</button>
               </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-4">
               {[1,2,3,4].map(idx => (
                 <div key={idx} className="bg-white border border-slate-100 aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer hover:border-brand transition-all opacity-60 hover:opacity-100">
                   {product.image_url}
                 </div>
               ))}
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 leading-tight">
              {product.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-1.5 bg-yellow-100/50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200">
                <span className="text-yellow-500">★</span> {product.rating}
              </div>
              <span className="text-slate-400 text-sm">{product.reviews_count} Değerlendirme</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-semibold">{product.brands?.name}</span>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl mb-8 flex items-center justify-between shadow-sm border border-blue-100">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">En Ucuz Fiyat</p>
                <p className="text-4xl font-black text-primary">{lowestPrice > 0 ? formatPrice(lowestPrice) : 'Fiyat Yok'}</p>
              </div>
              {sortedPrices.length > 0 && (
                <a href={sortedPrices[0].product_url} target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                  Hemen Al
                </a>
              )}
            </div>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
               Karşılaştırma <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{sortedPrices.length} Mağaza</span>
            </h2>
            
            <div className="bg-white shadow border border-slate-100 rounded-2xl overflow-hidden">
               {sortedPrices.map((storeConfig:any, idx:number) => {
                 const store = storeConfig.vendors;
                 const isCheapest = idx === 0;

                 return (
                  <div key={idx} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${isCheapest ? 'bg-orange-50/30' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{backgroundColor: `${store?.color}15`, color: store?.color}}>
                        {store?.logo || '🏪'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          {store?.name || 'Mağaza'}
                          {isCheapest && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-md uppercase font-black uppercase tracking-wider border border-green-200">En Ucuz</span>}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                           <span className="flex items-center gap-1">🚚 {storeConfig.shipping_info || 'Kargo Bilgisi Yok'}</span>
                           {storeConfig.in_stock ? (
                             <span className="text-green-600 font-medium ml-2">• Stokta</span>
                           ) : (
                             <span className="text-red-500 font-medium ml-2">• Tükendi!</span>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 text-right">
                       <span className="text-2xl font-black text-slate-800">{formatPrice(storeConfig.price)}</span>
                       <a href={storeConfig.product_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg transition-all shadow-md w-full md:w-auto text-center">
                         Mağazaya Git
                       </a>
                    </div>
                  </div>
                 );
               })}
               
               {sortedPrices.length === 0 && (
                 <div className="p-8 text-center text-slate-500">
                   Şu an bu ürün için mağaza fiyat bilgisi bulunmuyor.
                 </div>
               )}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-200 pt-16">
          <div className="grid md:grid-cols-2 gap-12">
             <section className="bg-white shadow border border-slate-100 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">Teknik Özellikler</h2>
                <div className="space-y-4">
                  {product.specs && Object.keys(product.specs).length > 0 ? (
                    Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex border-b border-slate-100 pb-3 last:border-0 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                        <span className="w-1/3 text-slate-500 font-medium">{key}</span>
                        <span className="w-2/3 text-slate-900 font-semibold">{typeof value === 'string' ? value : String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Kayıtlı teknik özellik yok.</p>
                  )}
                </div>
             </section>
             
             <section className="bg-white shadow border border-slate-100 rounded-2xl p-6 text-center">
                <h2 className="text-xl font-bold mb-2">Supabase Bağlantısı Hazır</h2>
                <div className="text-4xl font-black text-primary mb-4">Mükemmel!</div>
                <p className="text-slate-600 font-medium">
                  Artık tüm veriler statik dosyalardan değil,<br />direkt veritabanından, <span className="font-bold underline text-brand">Piyasa Sürümü</span> tadında çalışıyor!
                </p>
             </section>
          </div>
        </div>

      </div>
    </main>
  );
}
