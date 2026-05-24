import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/app/components/ProductCard';
import CountdownTimer from '@/app/components/CountdownTimer';

export const dynamic = 'force-dynamic';

export default async function Kampanyalar() {
  // Veritabanından gerçek indirimli ürünleri çek (original_price > price)
  const { data: discountedProducts } = await supabase
    .from('products')
    .select(`
      id, title, image_url, rating, reviews_count, is_trend,
      brands (name),
      categories (slug),
      product_prices!inner (price, original_price)
    `)
    .limit(12);

  // Gelen ürünleri filtrele ve indirim oranı hesapla
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
      .slice(0, 8); // En yüksek indirimli 8 ürün
  }

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
                  <Link href="/urunler" className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold whitespace-nowrap shadow-md shadow-red-500/20 transition-all flex items-center gap-2">🔥 Tüm İndirimler</Link>
                  <Link href="/urunler?cat=akilli-telefon" className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold whitespace-nowrap hover:bg-blue-100 transition-colors flex items-center gap-2">📱 Telefonlar</Link>
                  <Link href="/urunler?cat=bilgisayar-laptop" className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold whitespace-nowrap hover:bg-indigo-100 transition-colors flex items-center gap-2">💻 Laptop & PC</Link>
                  <Link href="/urunler?cat=ev-yasam" className="px-6 py-3 bg-green-50 text-green-600 rounded-xl font-bold whitespace-nowrap hover:bg-green-100 transition-colors flex items-center gap-2">🏠 Ev & Yaşam</Link>
                  <Link href="/urunler?cat=moda-giyim" className="px-6 py-3 bg-pink-50 text-pink-600 rounded-xl font-bold whitespace-nowrap hover:bg-pink-100 transition-colors flex items-center gap-2">👕 Moda</Link>
                  <Link href="/urunler?cat=kozmetik" className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold whitespace-nowrap hover:bg-rose-100 transition-colors flex items-center gap-2">💄 Kozmetik</Link>
              </div>
          </div>
      </section>

      <section className="py-16 bg-gray-50">
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
                    {realDeals.map((p: any, idx: number) => (
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

      <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 tracking-tight text-center">🛍️ Mağazalardan Özel Fırsatlar</h2>
              <div className="grid md:grid-cols-3 gap-8">
                  {/* Trendyol */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-500 group flex flex-col h-full">
                      <div className="flex items-center gap-6 mb-8">
                          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm group-hover:scale-110 transition-transform">TY</div>
                          <div>
                              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Trendyol</h3>
                              <p className="text-orange-500 font-bold text-sm">Ücretsiz Kargo Fırsatı</p>
                          </div>
                      </div>
                      <ul className="space-y-4 mb-8 flex-1">
                          <li className="flex items-start gap-3"><span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">✓</span><span className="text-gray-600 font-medium">Seçili elektronikte %30'a varan indirim</span></li>
                          <li className="flex items-start gap-3"><span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">✓</span><span className="text-gray-600 font-medium">Moda kategorisinde 3 Al 2 Öde</span></li>
                      </ul>
                      <Link href="/urunler" className="block w-full bg-slate-900 hover:bg-orange-500 text-white text-center py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-colors shadow-lg">
                          Trendyol Ürünleri
                      </Link>
                  </div>
                  
                  {/* Hepsiburada */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-orange-600/10 hover:border-orange-200 transition-all duration-500 group flex flex-col h-full">
                      <div className="flex items-center gap-6 mb-8">
                          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm group-hover:scale-110 transition-transform">HB</div>
                          <div>
                              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Hepsiburada</h3>
                              <p className="text-orange-600 font-bold text-sm">Premium Avantajları</p>
                          </div>
                      </div>
                      <ul className="space-y-4 mb-8 flex-1">
                          <li className="flex items-start gap-3"><span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">✓</span><span className="text-gray-600 font-medium">Premium üyelere özel ekstra indirimler</span></li>
                          <li className="flex items-start gap-3"><span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">✓</span><span className="text-gray-600 font-medium">Hepsipay ile anında %5 nakit iade</span></li>
                      </ul>
                      <Link href="/urunler" className="block w-full bg-slate-900 hover:bg-orange-600 text-white text-center py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-colors shadow-lg">
                          Hepsiburada Ürünleri
                      </Link>
                  </div>

                  {/* Amazon */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-500 group flex flex-col h-full">
                      <div className="flex items-center gap-6 mb-8">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-sm group-hover:scale-110 transition-transform">AMZ</div>
                          <div>
                              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Amazon Türkiye</h3>
                              <p className="text-blue-600 font-bold text-sm">Gülümseten Fırsatlar</p>
                          </div>
                      </div>
                      <ul className="space-y-4 mb-8 flex-1">
                          <li className="flex items-start gap-3"><span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">✓</span><span className="text-gray-600 font-medium">Prime üyelerine bedava ve hızlı kargo</span></li>
                          <li className="flex items-start gap-3"><span className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">✓</span><span className="text-gray-600 font-medium">Yurt dışı ürünlerde dev indirimler</span></li>
                      </ul>
                      <Link href="/urunler" className="block w-full bg-slate-900 hover:bg-blue-600 text-white text-center py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-colors shadow-lg">
                          Amazon Fırsatları
                      </Link>
                  </div>
              </div>
          </div>
      </section>
      
      <section className="py-24 bg-slate-900 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-primary opacity-5 mix-blend-overlay"></div>
          <div className="container mx-auto px-4 relative z-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">📧 Dev İndirimleri Kaçırma!</h2>
              <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto font-medium">Günde 1 kez en iyi fiyat düşüşlerini radarımızdan geçirip direkt e-postana gönderiyoruz. Spam yok, sadece fırsat var.</p>
              <form className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="E-posta adresini yaz..." className="flex-1 px-8 py-4 rounded-2xl text-gray-900 outline-none focus:ring-4 focus:ring-primary/50 font-medium text-lg" />
                  <button className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl hover:shadow-primary/30 hover:-translate-y-1">Patlat Gelsin 🚀</button>
              </form>
          </div>
      </section>
    </>
  );
}
