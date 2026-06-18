import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/app/components/ProductCard';
import CountdownTimer from '@/app/components/CountdownTimer';
import { Tag, ExternalLink, CheckCircle2 } from 'lucide-react';
import CopyButton from './CopyButton';

export const dynamic = 'force-dynamic';

export default async function Kampanyalar() {
  // 1. İndirimli Ürünleri Çek
  const { data: discountedProducts } = await supabase
    .from('products')
    .select(`
      id, title, image_url, rating, reviews_count, is_trend,
      brands (name),
      categories (slug),
      product_prices!inner (price, original_price)
    `)
    .limit(12);

  let realDeals = [];
  if (discountedProducts) {
    realDeals = discountedProducts.map((p: any) => {
      const prices = p.product_prices || [];
      const bestPriceObj = prices.reduce((prev: any, curr: any) => (prev.price < curr.price ? prev : curr), prices[0] || { price: 0, original_price: 0 });
      
      let discountPercent = 0;
      if (bestPriceObj.original_price > bestPriceObj.price) {
        discountPercent = Math.round(((bestPriceObj.original_price - bestPriceObj.price) / bestPriceObj.original_price) * 100);
      }
      
      return {
        ...p,
        calculatedDiscount: discountPercent
      };
    }).filter(p => p.calculatedDiscount > 0)
      .sort((a, b) => b.calculatedDiscount - a.calculatedDiscount)
      .slice(0, 8);
  }

  // 2. Affiliate Kampanya ve Kuponları Çek
  const { data: affiliateCampaigns } = await supabase
    .from('affiliate_campaigns')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const activeCampaigns = affiliateCampaigns || [];

  return (
    <>
      <section className="gradient-bg text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
              <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-shadow-sm">🔥 Fırsat & Kampanyalar</h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">Fiyatı dibe vuran ürünleri saniyeler içinde yakala!</p>
          </div>
      </section>

      <section className="py-8 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  <Link href="#kuponlar" className="px-6 py-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2"><Tag className="w-4 h-4"/> Aktif Kuponlar</Link>
                  <Link href="#urunler" className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold whitespace-nowrap shadow-md shadow-red-500/20 transition-all flex items-center gap-2">🔥 Flaş İndirimler</Link>
                  <Link href="/urunler?cat=akilli-telefon" className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold whitespace-nowrap hover:bg-blue-100 transition-colors flex items-center gap-2">📱 Telefonlar</Link>
                  <Link href="/urunler?cat=bilgisayar-laptop" className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold whitespace-nowrap hover:bg-indigo-100 transition-colors flex items-center gap-2">💻 Laptop & PC</Link>
              </div>
          </div>
      </section>

      <section id="kuponlar" className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <Tag className="w-8 h-8 text-purple-600" /> Mağaza Kuponları & Fırsatlar
              </h2>
              <p className="text-slate-500 mt-2 font-medium text-lg">Anlaşmalı markalarımızın özel indirim kodları ve kampanyaları.</p>
            </div>
          </div>

          {activeCampaigns.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">Şu an için aktif bir indirim kuponu bulunmuyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((camp: any) => {
                const isDecathlon = camp.campaign_name.toLowerCase().includes('decathlon');
                const hasPromo = camp.promo_code && !isDecathlon;

                return (
                  <div key={camp.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-bl-2xl uppercase tracking-widest z-10">
                      {camp.campaign_name}
                    </div>
                    <div className="mb-6 mt-4">
                      <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-primary transition-colors pr-12">{camp.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2">{camp.description}</p>
                    </div>
                    {camp.discount_info && (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold px-4 py-2 rounded-xl text-sm mb-6 self-start">
                        <CheckCircle2 className="w-4 h-4" /> {camp.discount_info} İndirim
                      </div>
                    )}
                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
                      {hasPromo ? (
                        <div className="flex gap-2">
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-700 text-center flex items-center justify-center tracking-widest uppercase truncate">
                            {camp.promo_code}
                          </div>
                          <CopyButton code={camp.promo_code} />
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-500 italic">
                          İndirim linke tanımlıdır, koda gerek yok.
                        </div>
                      )}
                      <a href={camp.tracking_link} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-900 hover:bg-primary text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors uppercase tracking-widest text-sm shadow-lg shadow-slate-900/10">
                        Kampanyaya Git <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="urunler" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-[2rem] p-8 md:p-12 text-white mb-12 shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex flex-col md:flex-row items-center justify-between mb-2 gap-8 relative z-10">
                      <div>
                          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 flex items-center gap-4">⚡ Flaş İndirimler</h2>
                          <p className="text-white/90 text-lg font-medium">Bu fiyatlar gece yarısında son bulacak! Acele et.</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-2xl text-center min-w-[200px]">
                          <div className="text-3xl font-black tracking-widest"><CountdownTimer /></div>
                          <div className="text-xs font-bold uppercase tracking-[0.2em] mt-1 text-white/80">Kalan Süre</div>
                      </div>
                  </div>
              </div>

              {realDeals.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-gray-500 font-medium text-lg">Şu an için büyük bir fırsat radara takılmadı. Sistem taramaya devam ediyor...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {realDeals.map((p: any) => (
                        <div key={p.id} className="relative group">
                            <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                %{p.calculatedDiscount} İNDİRİM
                            </div>
                            <ProductCard product={p} />
                        </div>
                    ))}
                </div>
              )}
          </div>
      </section>
      
      <section className="py-24 bg-slate-900 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-primary opacity-5 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 relative z-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">📧 Dev İndirimleri Kaçırma!</h2>
              <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto font-medium">Günde 1 kez en iyi fiyat düşüşlerini radarımızdan geçirip direkt e-postana gönderiyoruz. Spam yok, sadece fırsat var.</p>
              <form className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3" action="#">
                  <input type="email" placeholder="E-posta adresini yaz..." className="flex-1 px-8 py-4 rounded-2xl text-gray-900 outline-none focus:ring-4 focus:ring-primary/50 font-medium text-lg" />
                  <button type="button" className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl hover:shadow-primary/30 hover:-translate-y-1">Patlat Gelsin 🚀</button>
              </form>
          </div>
      </section>
    </>
  );
}
