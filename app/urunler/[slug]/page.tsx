import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { extractIdFromSlug, appendAffiliateTag, generateSeoSlug } from '@/lib/utils';
import SearchForm from '@/app/components/SearchForm';
import Link from 'next/link';
import PriceHistoryChart from '@/app/components/PriceHistoryChart';
import PriceAlertModal from '@/app/components/PriceAlertModal';
import ReviewSummary from '@/app/components/ReviewSummary';
import PriceBadges from '@/app/components/PriceBadges';
import StoreListView from '@/app/components/StoreListView';
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

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: product } = await supabase
    .from('products')
    .select('title, categories(name), brands(name), image_url, product_prices(price)')
    .eq('slug', params.slug)
    .single();

  if (!product) {
    return { title: 'Ürün Bulunamadı | Piinti' };
  }

  const categoryObj: any = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const categoryName = categoryObj?.name || 'Kategori';
  const brandObj: any = Array.isArray(product.brands) ? product.brands[0] : product.brands;
  const brandName = brandObj?.name || '';

  const title = `${product.title} Fiyatları | En Uygun Fiyat - Piinti`;
  const description = `${product.title} ürününün Trendyol, Amazon, Hepsiburada fiyatlarını karşılaştırın. En ucuz fiyatı bulun, fiyat geçmişini inceleyin.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://piinti.com/urunler/${params.slug}`
    },
    openGraph: {
      title,
      description,
      url: `https://piinti.com/urunler/${params.slug}`,
      type: 'website',
      images: [product.image_url || 'https://www.piinti.com/og-image.jpg']
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image_url || 'https://www.piinti.com/og-image.jpg']
    }
  };
}

export default async function UrunDetay({ params }: { params: { slug: string } }) {
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      asin,
      brands (name),
      categories (name)
    `)
    .eq('slug', params.slug)
    .single();

  if (!product) {
    notFound();
  }

  // AŞAMA 2: Canonical Aile Tespiti (Parent-Child birleştirmesi)
  let familyIds = [product.id];
  if (product.canonical_id) {
    // Bu ürün bir child ise, parent'ı ve diğer child'ları bul
    const { data: siblings } = await supabase.from('products').select('id').eq('canonical_id', product.canonical_id);
    familyIds.push(product.canonical_id);
    if (siblings) siblings.forEach((s: any) => familyIds.push(s.id));
  } else {
    // Bu ürün bir parent ise, child'ları bul
    const { data: children } = await supabase.from('products').select('id').eq('canonical_id', product.id);
    if (children) children.forEach((c: any) => familyIds.push(c.id));
  }
  familyIds = Array.from(new Set(familyIds)); // Tekilleştir

  // Tüm ailenin güncel fiyatlarını çek
  const { data: familyPrices } = await supabase
    .from('product_prices')
    .select(`
      price, original_price, shipping_info, product_url, in_stock, vendor_id, last_updated_at,
      vendors (id, name, logo, color)
    `)
    .in('product_id', familyIds);

  // Tüm ailenin geçmiş fiyatlarını çek
  const { data: familyHistory } = await supabase
    .from('price_history')
    .select('id, price, recorded_at, vendors(name)')
    .in('product_id', familyIds);

  if (!product) {
    notFound();
  }

  // Gerçek yorumları çek — sahte veri KULLANILMAZ
  const { data: realReviews } = await supabase
    .from('product_reviews')
    .select('id, user_name, rating, comment, created_at')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const categoryObj: any = Array.isArray(product.categories) ? product.categories[0] : product.categories;
  const categoryName = categoryObj?.name;
  const brandObj: any = Array.isArray(product.brands) ? product.brands[0] : product.brands;
  const brandName = brandObj?.name;
  
  const rawPrices = familyPrices || [];
  
  const now = new Date();
  const validPrices = rawPrices.map((p: any) => {
    let hoursDiff = 0;
    if (p.last_updated_at) {
      const updatedTime = new Date(p.last_updated_at);
      hoursDiff = (now.getTime() - updatedTime.getTime()) / (1000 * 60 * 60);
    }
    return { ...p, hoursDiff, isStale: hoursDiff > 48 };
  }).filter((p: any) => p.hoursDiff <= 72); // 72 saati geçenleri arayüzden gizle

  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices.map((p:any) => p.price)) : 0;
  const highestPrice = validPrices.length > 0 ? Math.max(...validPrices.map((p:any) => p.price)) : 0;
  const sortedPrices = [...validPrices].sort((a:any, b:any) => a.price - b.price);

  function trPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
  }

  const priceValidUntil = new Date();
  priceValidUntil.setDate(priceValidUntil.getDate() + 7); // 1 haftalık geçerlilik
  
  // JSON-LD Structured Data for Google
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title || 'Ürün',
    image: product.image_url ? [product.image_url.replace('http://', 'https://')] : undefined,
    description: (product.title || 'Ürün') + ' modeli en ucuz fiyat seçenekleriyle Piinti\'de! Tüm mağazaların fiyatlarını tek ekranda karşılaştırın.',
    sku: product.id.toString(),
    mpn: product.id.toString(),
    brand: {
      '@type': 'Brand',
      name: brandName || 'Diğer',
    },
    offers: {
      '@type': 'AggregateOffer',
      url: `https://www.piinti.com/urunler/${params.slug}`,
      priceCurrency: 'TRY',
      lowPrice: lowestPrice > 0 ? lowestPrice : undefined,
      highPrice: highestPrice > 0 ? highestPrice : undefined,
      offerCount: sortedPrices.length > 0 ? sortedPrices.length : 1,
      offers: sortedPrices.map((sp: any) => ({
        '@type': 'Offer',
        price: sp.price,
        priceCurrency: 'TRY',
        priceValidUntil: priceValidUntil.toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        availability: sp.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: sp.product_url ? sp.product_url : `https://www.piinti.com/git/${product.id}?vendor=${sp.vendor_id || sp.vendors?.id}`,
        seller: {
          '@type': 'Organization',
          name: sp.vendors?.name || 'Bilinmeyen Satıcı'
        }
      }))
    },
    aggregateRating: product.rating && product.reviews_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews_count
    } : undefined
  };

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentHistory = (familyHistory || [])
    .filter((h: any) => new Date(h.recorded_at) >= ninetyDaysAgo)
    .sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((h: any) => ({
      date: h.recorded_at,
      price: h.price,
      vendor: h.vendors?.name || 'Bilinmeyen Mağaza'
    }));

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://piinti.com/' },
      ...(categoryName ? [{ '@type': 'ListItem', position: 2, name: categoryName, item: `https://piinti.com/kategori/${generateSeoSlug(categoryName)}` }] : []),
      { '@type': 'ListItem', position: categoryName ? 3 : 2, name: product.title, item: `https://piinti.com/urunler/${params.slug}` }
    ]
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${product.title} en ucuz nerede?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${product.title} için en düşük fiyat şu an ${lowestPrice > 0 ? trPrice(lowestPrice) : 'bulunamadı'}. Tüm mağaza fiyatlarını Piinti üzerinden karşılaştırabilirsiniz.`
        }
      },
      {
        '@type': 'Question',
        name: `${product.title} fiyatı düştü mü?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Son 90 günlük fiyat geçmişini grafiklerimizden inceleyebilir, ${product.title} fiyatının düşüp düşmediğini öğrenebilirsiniz.`
        }
      },
      {
        '@type': 'Question',
        name: `${product.title} için fiyat alarmı nasıl kurulur?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Fiyat alarmı butonuna tıklayarak ${product.title} ürününün belirlediğiniz fiyata düştüğünde size e-posta ile haber vermesini sağlayabilirsiniz.`
        }
      }
    ]
  };

  return (
    <main className="min-h-screen pb-16 bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productLd, breadcrumbLd, faqLd]) }}
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
                      <Image src="/logo.jpg" alt="Görsel Bekleniyor" fill priority className="object-contain p-8" />
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
            


          </div>

          {/* Details Column */}
          <div className="w-full lg:w-2/3">
            <div className="mb-4 flex items-center gap-2">
                <span className="bg-primary/10 text-primary text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-primary/20">{brandName || 'PREMIUM BRAND'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">&gt;</span>
            <span className="text-slate-600 truncate">{product.title}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tighter">
            {product.title} <span className="text-slate-400 font-medium">Fiyatları</span>
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
            <div className="bg-slate-900 p-8 rounded-[2rem] mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-2xl shadow-slate-900/10 border border-slate-800 gap-8">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">En Rekabetçi Fiyat</p>
                <p className="text-5xl font-black text-white tracking-tighter">{lowestPrice > 0 ? trPrice(lowestPrice) : 'Fiyat Yok'}</p>
              </div>
              <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
                <PriceAlertModal productId={product.id} productTitle={product.title} currentPrice={lowestPrice} />
                {sortedPrices.length > 0 && sortedPrices[0].product_url && sortedPrices[0].product_url.startsWith('http') && (
                  <a href={`/git/${product.id}?vendor=${sortedPrices[0].vendor_id || sortedPrices[0].vendors?.id}`} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-slate-100 text-slate-900 font-black h-14 px-10 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-3 group">
                    Mağazaya İlerle <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            {/* Dinamik Fiyat Rozetleri — price_history'den gerçek hesaplama */}
            <PriceBadges
              priceHistory={recentHistory}
              currentPrice={lowestPrice}
              windowDays={30}
            />

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
                
                {/* SEO Invisible Chart Image for Indexing */}
                <img 
                  src={product.image_url?.replace('http://', 'https://') || '/logo.jpg'} 
                  alt={`${product.title} fiyat geçmişi ve değişim grafiği`}
                  className="hidden" 
                  aria-hidden="true" 
                />
                
                <PriceHistoryChart historyData={recentHistory} productName={product.title} />
            </div>

            {/* AI PREDICTOR / BEKLENTİ ANALİZİ */}
            {(() => {
              const analytics = analyzePriceTrend(recentHistory, lowestPrice);
              return (
                <div className="bg-slate-900 p-8 rounded-[2rem] mb-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-${analytics.color}-500/20 rounded-full blur-[100px] -mr-32 -mt-32 transition-colors duration-1000`}></div>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Piinti AI Fiyat Tahmini</span>
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-20 h-20 bg-${analytics.color}-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-${analytics.color}-500/20 border border-white/10 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
                        <span className="text-3xl font-black">{analytics.dropProbability}%</span>
                      </div>
                      <div>
                        <h3 className="text-white font-black text-2xl mb-1 tracking-tight">{analytics.title}</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                          {analytics.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex flex-col gap-3">
                      <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-2xl text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Yapay Zeka Kararı</p>
                        <p className={`text-lg font-black text-${analytics.color}-400 uppercase tracking-tighter`}>
                          {analytics.actionText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <StoreListView productId={product.id} prices={sortedPrices} />
          </div>
        </div>

        {/* ReviewSummary — gerçek veritabanı yorumları geçilir; yorum yoksa dürüst boş durum gösterilir */}
        <ReviewSummary productId={product.id} reviews={realReviews || []} />

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
                  <h2 className="text-2xl font-bold mb-4 tracking-tight uppercase">Piinti Güvencesi</h2>
                  <div className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6 tracking-tighter">DOĞRULANMIŞ</div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] leading-loose">
                    Piinti Analytics Motoru<br />
                    Tüm fiyatları anlık olarak<br />
                    <span className="text-white border-b-2 border-primary">orijinal mağazalardan</span><br />
                    doğrular ve günceller.
                  </p>
                </div>
             </section>
         </div>

         {/* SEO DYNAMIC CONTENT BLOCK */}
         <div className="mt-16 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-sm text-slate-600 leading-loose">
            <h3 className="text-lg font-black text-slate-900 mb-4">{product.title} Hakkında Fiyat Bilgisi</h3>
            <p>
              Şu an Piinti veritabanında <strong>{product.title}</strong> için en ucuz fiyat {sortedPrices.length > 0 ? <>{sortedPrices[0].vendors?.name} üzerinde <strong>{trPrice(lowestPrice)}</strong></> : "henüz listelenmemiştir"} olarak görüntülenmektedir.
              {highestPrice > lowestPrice && <> Piyasada bu ürün <strong>{trPrice(highestPrice)}</strong> seviyesine kadar çıkabilmektedir.</>} 
              {product.price_history && product.price_history.length > 0 && <> Ayrıca, ürünün son 90 günlük <strong>fiyat geçmişi grafiğine</strong> baktığımızda piyasadaki anlık fiyat değişimlerini ve en uygun alım fırsatlarını gözlemleyebilirsiniz.</>}
              Kullanıcı yorumları, teknik özellikleri ve mağaza güvenilirlik puanlarını inceleyerek <em>{brandName}</em> marka bu modeli en güvenli ve en uygun fiyata satın alabilirsiniz.
            </p>
          </div>
        </div>

        {/* INTERNAL LINKING (SEO) */}
        <div className="mt-12 mb-8 pt-8 border-t border-slate-200 max-w-7xl mx-auto px-6">
           <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Benzer {categoryName} Modelleri</h3>
           <div className="flex flex-wrap gap-3">
             <InternalLinks categoryId={product.category_id} brandId={product.brand_id} currentProductId={product.id} />
           </div>
        </div>
      </main>
  );
}


async function InternalLinks({ categoryId, brandId, currentProductId }: { categoryId: number, brandId: number, currentProductId: string }) {
  const { data: related } = await supabase
    .from('products')
    .select('title, slug')
    .eq('category_id', categoryId)
    .neq('id', currentProductId)
    .limit(10);

  const { data: brandRelated } = await supabase
    .from('products')
    .select('title, slug')
    .eq('brand_id', brandId)
    .neq('id', currentProductId)
    .limit(5);

  const allLinks = [...(related || []), ...(brandRelated || [])].filter((v,i,a)=>a.findIndex(t=>(t.slug === v.slug))===i);

  if (allLinks.length === 0) return <span className="text-sm text-slate-400 italic">Şu an benzer ürün bulunmamaktadır.</span>;

  return (
    <>
      {allLinks.map((item, idx) => (
        <Link 
          key={idx} 
          href={`/urunler/${item.slug}`}
          className="bg-white border border-slate-200 hover:border-primary text-slate-600 hover:text-primary px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
        >
          {item.title}
        </Link>
      ))}
    </>
  );
}
