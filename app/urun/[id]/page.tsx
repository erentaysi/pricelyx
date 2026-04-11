import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { extractIdFromSlug } from '@/lib/utils';
import SearchForm from '@/app/components/SearchForm';
import Link from 'next/link';
import PriceHistoryChart from '@/app/components/PriceHistoryChart';
import PriceAlertModal from '@/app/components/PriceAlertModal';
import ReviewSummary from '@/app/components/ReviewSummary';
import FavoriteButton from '@/app/components/FavoriteButton';
import { 
  Star, 
  Truck, 
  Store, 
  LineChart, 
  Package, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Flame,
  ArrowRight
} from 'lucide-react';
import { analyzePriceTrend } from '@/lib/analytics';
import Image from 'next/image';

import { Metadata } from 'next';

export const revalidate = 3600; // 1 saatte bir önbelleği tazele (ISR)

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const actualId = extractIdFromSlug(params.id);
  const { data: product } = await supabase
    .from('products')
    .select('title, categories(name), brands(name), image_url, product_prices(price)')
    .eq('id', actualId)
    .single();

  if (!product) {
    return { title: 'Ürün Bulunamadı | Piinti' };
  }

  const categoryObj: any = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const categoryName = categoryObj?.name || 'Kategori';
  const brandObj: any = Array.isArray(product.brands) ? product.brands[0] : product.brands;
  const brandName = brandObj?.name || '';

  const prices = product.product_prices || [];
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => p.price)) : 0;
  const priceText = minPrice > 0 ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(minPrice))} ₺'den başlayan fiyatlarla. ` : '';

  const title = `${product.title} ${brandName} En Ucuz Fiyatı ve Özellikleri - Piinti`;
  const description = `${product.title} ${brandName} modelini ${priceText}${categoryName} kategorisindeki en güncel fiyatları, fiyat geçmişini ve mağaza karşılaştırmalarını Piinti'de görün.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [product.image_url || 'https://www.piinti.com/og-image.jpg']
    },
  };
}

export default async function UrunDetay({ params }: { params: { id: string } }) {
  const actualId = extractIdFromSlug(params.id);
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
      ),
      price_history (
        id,
        price,
        recorded_at
      )
    `)
    .eq('id', actualId)
    .single();

  if (!product) {
    notFound();
  }

  const categoryObj: any = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const categoryName = categoryObj?.name;
  const brandObj: any = Array.isArray(product.brands) ? product.brands[0] : product.brands;
  const brandName = brandObj?.name;

  const prices = product.product_prices || [];
  const lowestPrice = prices.length > 0 ? Math.min(...prices.map((p:any) => p.price)) : 0;
  const sortedPrices = [...prices].sort((a:any, b:any) => a.price - b.price);

  function trPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
  }

  // JSON-LD Structured Data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title || 'Ürün',
    image: product.image_url || '',
    description: (product.title || 'Ürün') + ' en uygun fiyatlarla Piinti\'de.',
    brand: {
      '@type': 'Brand',
      name: brandName || 'Diğer',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'TRY',
      lowPrice: lowestPrice,
      offerCount: sortedPrices.length,
      offers: sortedPrices.map(sp => ({
        '@type': 'Offer',
        price: sp.price,
        url: sp.product_url,
        seller: {
          '@type': 'Organization',
          name: sp.vendors?.name
        }
      }))
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews_count
    } : undefined
  };

  return (
    <main className="min-h-screen pb-16 bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-white border-b border-slate-100 py-6 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6">
           <SearchForm />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {/* Breadcrumb */}
        <div className="text-xs font-bold text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-widest">
           <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
           <ChevronRight className="w-3 h-3" />
           {categoryName && (
             <>
               <Link href={`/urunler?cat=${categoryName}`} className="hover:text-primary transition-colors">{categoryName}</Link>
               <ChevronRight className="w-3 h-3" />
             </>
           )}
           <span className="text-slate-800">{product.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Visual Column */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 aspect-square rounded-[2.5rem] flex items-center justify-center relative p-12 overflow-hidden transition-all duration-500 hover:shadow-primary/5 group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
               {product.is_trend && (
                  <span className="absolute top-6 left-6 bg-slate-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg z-10 uppercase tracking-widest flex items-center gap-2">
                    <Flame className="w-3 h-3 text-orange-400" /> Trend Seçim
                  </span>
               )}
               <div className="w-full h-full flex items-center justify-center relative z-10">
                 {(!product.image_url || !(product.image_url?.startsWith('http') || product.image_url?.includes('data:image'))) ? (
                    <div className="relative w-full h-full opacity-60 mix-blend-multiply transition-opacity duration-700 hover:opacity-100">
                      <Image src="/placeholder.png" alt="Görsel Bekleniyor" fill priority className="object-contain p-8" />
                    </div>
                 ) : (
                    <div className="relative w-full h-full">
                      <Image 
                        src={product.image_url.replace('http://', 'https://')} 
                        alt={`${product.title} - Piinti Fiyat Karşılaştırması`}
                        fill
                        priority
                        sizes="(max-width: 640px) 100vw, 400px"
                        className="object-contain group-hover:scale-105 transition-transform duration-700" 
                      />
                    </div>
                  )}
               </div>
               
               <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
                 <FavoriteButton productId={product.id} />
                 <button className="w-12 h-12 bg-white/80 backdrop-blur border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110">Share</button>
               </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-6">
               {[1,2,3,4].map(idx => (
                 <div key={idx} className="bg-white border border-slate-100 aspect-square rounded-2xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all opacity-40 hover:opacity-100 overflow-hidden p-3 shadow-sm">
                   {(!product.image_url || !(product.image_url?.startsWith('http') || product.image_url?.includes('data:image'))) ? (
                      <div className="relative w-full h-full opacity-40 mix-blend-multiply">
                        <Image src="/placeholder.png" alt="Görsel Bekleniyor" fill className="object-contain p-2" />
                      </div>
                   ) : (
                      <div className="relative w-full h-full">
                        <Image 
                          src={product.image_url.replace('http://', 'https://')} 
                          alt={`${product.title} Thumbnail - Piinti`}
                          fill
                          sizes="100px"
                          className="object-contain" 
                        />
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="w-full lg:w-2/3">
            <div className="mb-4 flex items-center gap-2">
                <span className="bg-primary/10 text-primary text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/20">{brandName || 'PREMIUM BRAND'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{categoryName || 'GENERAL CATEGORY'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              {product.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 mb-10 pb-10 border-b border-dashed border-slate-200">
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl text-sm font-black border border-amber-100">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {product.rating}
              </div>
              <span className="text-slate-400 text-sm font-bold tracking-tight">{product.reviews_count.toLocaleString('tr-TR')} DOĞRULANMIŞ YORUM</span>
              <span className="hidden sm:block text-slate-200">|</span>
              <span className="text-slate-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> %100 Orijinal Ürün
              </span>
            </div>

            {/* Lowest Price Banner */}
            <div className="bg-slate-900 p-8 rounded-[2rem] mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-2xl shadow-slate-900/10 border border-slate-800 gap-8">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">En Rekabetçi Fiyat</p>
                <p className="text-5xl font-black text-white tracking-tighter">{lowestPrice > 0 ? trPrice(lowestPrice) : 'Fiyat Yok'}</p>
              </div>
              <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                <PriceAlertModal productId={product.id} productTitle={product.title} currentPrice={lowestPrice} />
                {sortedPrices.length > 0 && (
                  <a href={sortedPrices[0].product_url} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-100 text-slate-900 font-black h-14 px-10 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-3 group">
                    Mağazaya İlerle <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            {/* FİYAT GEÇMİŞİ */}
            <div className="bg-white p-8 rounded-[2rem] mb-10 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-10"></div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 leading-none mb-2">
                      <LineChart className="w-6 h-6 text-primary" /> Fiyat Geçmişi Analizi
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PIINTI SMART ANALYTICS</p>
                  </div>
                  <div className="bg-indigo-50 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">Son 90 Gün</div>
                </div>
                <PriceHistoryChart historyData={product.price_history || []} />
            </div>

            {/* AI PREDICTOR / BEKLENTİ ANALİZİ */}
            {(() => {
              const analytics = analyzePriceTrend(product.price_history || [], lowestPrice);
              return (
                <div className="bg-slate-900 p-8 rounded-[2rem] mb-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 ${analytics.color} rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-black/20`}>
                        {analytics.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-black text-xl mb-1 uppercase tracking-tight">{analytics.message}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Piinti AI Fiyat Beklentisi</p>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-2xl text-center md:text-left">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Analiz Özeti</p>
                      <p className="text-white text-sm font-medium leading-relaxed max-w-xs">
                        {analytics.trend === 'best' ? "Şu an ürünün kaydedilmiş en düşük fiyatındasın. Kaçırmanı önermeyiz!" :
                         analytics.trend === 'good' ? "Fiyat ortalamanın altında seyrediyor, alım için uygun bir dönem." :
                         analytics.trend === 'bad' ? "Fiyat son dönem ortalamasının üzerinde. Acil değilse beklemeni öneririz." :
                         "Fiyat istikrarlı görünüyor, piyasa koşulları normal."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-tight">
               Fiyat Karşılaştırması <span className="bg-slate-100 text-slate-500 text-[10px] px-3 py-1 rounded-full font-black tracking-widest">{sortedPrices.length} MAĞAZA</span>
            </h2>
            
            <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] overflow-hidden">
               {sortedPrices.map((storeConfig:any, idx:number) => {
                 const store = storeConfig.vendors;
                 const isCheapest = idx === 0;

                 return (
                  <div key={idx} className={`p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all duration-300 ${isCheapest ? 'bg-emerald-50/20' : ''}`}>
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm border border-slate-100 bg-white" style={{color: store?.color}}>
                        {store?.logo || <Store className="w-10 h-10 text-slate-200" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-xl text-slate-900 tracking-tight">
                            {store?.name || 'Seçkin Mağaza'}
                          </h3>
                          {isCheapest && <span className="bg-emerald-500 text-white text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-1"><Zap className="w-3 h-3" /> En Uygun</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                           <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-slate-300" /> {storeConfig.shipping_info || 'Standart Kargo'}</span>
                           {storeConfig.in_stock ? (
                             <span className="text-emerald-500 flex items-center gap-1.5">• Stokta Hazır</span>
                           ) : (
                             <span className="text-rose-500 flex items-center gap-1.5">• Stok Bekleniyor</span>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 text-right">
                       <span className="text-3xl font-black text-slate-900">{trPrice(storeConfig.price)}</span>
                       <a href={storeConfig.product_url} target="_blank" rel="noopener noreferrer" className="text-xs font-black bg-slate-900 hover:bg-primary text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-slate-900/10 w-full md:w-auto text-center uppercase tracking-widest">
                         Mağazaya İlerle
                       </a>
                    </div>
                  </div>
                 );
               })}
               
               {sortedPrices.length === 0 && (
                 <div className="p-12 text-center text-slate-500 italic">
                   Üzgünüz, henüz bu ürün için doğrulanmış fiyat bilgisi bulunmuyor.
                 </div>
               )}
            </div>
          </div>
        </div>

        <ReviewSummary productId={product.id} />

        {/* Specs and Analytics Section */}
        <div className="mt-24 border-t border-slate-200 pt-24 grid md:grid-cols-2 gap-20">
             <section>
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-white shadow-xl rounded-2xl flex items-center justify-center text-primary border border-slate-100"><Package className="w-6 h-6" /></div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Teknik Özellikler</h2>
                </div>
                <div className="space-y-2">
                  {product.specs && Object.keys(product.specs).length > 0 ? (
                    Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex border-b border-slate-50 pb-4 pt-4 last:border-0 hover:bg-white hover:px-4 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 rounded-xl group">
                        <span className="w-1/3 text-slate-400 font-bold text-xs uppercase tracking-widest group-hover:text-primary transition-colors">{key}</span>
                        <span className="w-2/3 text-slate-800 font-bold">{typeof value === 'string' ? value : String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">SPESİFİKASYON DATA BEKLENİYOR...</p>
                  )}
                </div>
             </section>
             
             <section className="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary opacity-5 mix-blend-overlay"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-[2rem] flex items-center justify-center text-primary border border-white/10 mx-auto mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4 tracking-tight uppercase">Veri Güvenliği Hazır</h2>
                  <div className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6 tracking-tighter">SUCCESS</div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] leading-loose">
                    Piinti Analytics Motoru<br />
                    Tüm verileri anlık olarak<br />
                    <span className="text-white border-b-2 border-primary">Supabase Bulutu</span><br />
                    üzerinden doğrular.
                  </p>
                </div>
             </section>
        </div>

      </div>
    </main>
  );
}
