import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SearchForm from '@/app/components/SearchForm';
import { 
  Smartphone, 
  Laptop, 
  Shirt, 
  Home as HomeIcon, 
  Cpu, 
  Sparkles, 
  Dribbble, 
  Book, 
  ShieldCheck, 
  Zap, 
  Database,
  Package
} from 'lucide-react';
import Image from 'next/image';
import { analyzePriceTrend } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch products from Supabase
  const { data: dbProducts } = await supabase
    .from('products')
    .select(`
      id, title, image_url, rating, reviews_count, is_trend,
      brands (name),
      product_prices (price, original_price),
      price_history (price, recorded_at)
    `)
    .eq('is_trend', true)
    .order('created_at', { ascending: false }) // En yeni eklenen ürünleri en başta göster
    .limit(8);

  // Dinamik Sayaçlar için veritabanı sorguları
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
  const { count: priceCount } = await supabase.from('product_prices').select('*', { count: 'exact', head: true });

  const categories = [
    { id: 1, name: "Akıllı Telefon", icon: <Smartphone className="w-8 h-8" />, productCount: 5420, slug: "akilli-telefon", color: "bg-blue-50 text-blue-600" },
    { id: 2, name: "Bilgisayar & Laptop", icon: <Laptop className="w-8 h-8" />, productCount: 3200, slug: "bilgisayar-laptop", color: "bg-indigo-50 text-indigo-600" },
    { id: 3, name: "Moda & Giyim", icon: <Shirt className="w-8 h-8" />, productCount: 12500, slug: "moda-giyim", color: "bg-pink-50 text-pink-600" },
    { id: 4, name: "Ev & Yaşam", icon: <HomeIcon className="w-8 h-8" />, productCount: 8900, slug: "ev-yasam", color: "bg-green-50 text-green-600" },
    { id: 5, name: "Elektronik", icon: <Cpu className="w-8 h-8" />, productCount: 6700, slug: "elektronik", color: "bg-purple-50 text-purple-600" },
    { id: 6, name: "Kozmetik", icon: <Sparkles className="w-8 h-8" />, productCount: 4300, slug: "kozmetik", color: "bg-rose-50 text-rose-600" },
    { id: 7, name: "Spor & Outdoor", icon: <Dribbble className="w-8 h-8" />, productCount: 3800, slug: "spor-outdoor", color: "bg-orange-50 text-orange-600" },
    { id: 8, name: "Kitap & Hobi", icon: <Book className="w-8 h-8" />, productCount: 9200, slug: "kitap-hobi", color: "bg-amber-50 text-amber-600" }
  ];

  function trPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(price)) + ' ₺';
  }

  const productsList = dbProducts || [];

  return (
    <>
      <section className="gradient-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center fade-in">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-sm">
                  Türkiye'nin En Gelişmiş Ürün ve Fiyat Karşılaştırma Platformu
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-white/90 font-medium">
                    Milyonlarca ürün arasından en uygun fiyatı bul, karşılaştır, tasarruf et
                </p>
                <div className="max-w-2xl mx-auto items-center justify-center flex">
                    <SearchForm />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold">{productCount || 0}+</div><div className="text-white/80 text-sm">Ürün</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">{vendorCount || 0}+</div><div className="text-white/80 text-sm">Mağaza</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">{priceCount || 0}+</div><div className="text-white/80 text-sm">Fiyat Karşılaştırması</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                <div>
                <text x="45" y="32" fontFamily="'Inter', sans-serif" fontSize="26" fontWeight="900" fill="url(#logoGradient)">Piinti v2</text>
                  <p className="text-gray-500">İhtiyacın olan her şey burada.</p>
                </div>
                <Link href="/urunler" className="text-primary font-semibold hover:underline">Tümünü Gör →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {categories.map(cat => (
                      <Link href={`/urunler?cat=${cat.slug}`} key={cat.id} className="group bg-white rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100 flex flex-col items-center">
                          <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                              {cat.icon}
                          </div>
                          <h3 className="font-bold text-gray-800 mb-1 text-lg">{cat.name}</h3>
                          <p className="text-sm text-gray-400 font-medium">{cat.productCount.toLocaleString('tr-TR')} ürün</p>
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      {/* Trending Products */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">Trend Ürünler</h2>
              
              {productsList.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-gray-500">Henüz veritabanında ürün bulunmuyor. Sistem veri toplamaya başladığında burada görünecek.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productsList.map((product: any) => {
                        const prices = product.product_prices || [];
                        const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => p.price)) : 0;
                        const analytics = analyzePriceTrend(product.price_history || [], minPrice);
                        
                        return (
                            <Link href={`/urun/${product.id}`} key={product.id} className="group bg-white rounded-2xl border border-slate-100 product-card-hover overflow-hidden flex flex-col">
                                <div className="relative h-56 bg-slate-50 flex items-center justify-center overflow-hidden p-6">
                                  {/* Dynamic Analytics Badge */}
                                  <div className={`absolute top-4 right-4 ${analytics.trend === 'bad' ? 'bg-rose-500' : analytics.color} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest flex items-center gap-1 scale-90 origin-right group-hover:scale-100 transition-transform`}>
                                    <span>{analytics.icon}</span> {analytics.message}
                                  </div>

                                  {(!product.image_url || product.image_url === '📦') ? (
                                    <Package className="w-20 h-20 text-slate-200" />
                                  ) : (product.image_url?.startsWith('http') || product.image_url?.includes('data:image')) ? (
                                    <div className="relative w-full h-full">
                                      <Image 
                                        src={product.image_url.replace('http://', 'https://')} 
                                        alt={`${product.title} - En Uygun Fiyat Karşılaştırması`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        className="object-contain group-hover:scale-105 transition-transform duration-500" 
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-4xl">{product.image_url}</span>
                                  )}
                                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black px-3 py-1 rounded-full shadow-sm border border-slate-100 z-10 uppercase tracking-widest">🔥 Trend</div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{product.brands?.name || 'Bilinmiyor'}</div>
                                    <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 h-12 text-base leading-tight group-hover:text-primary transition-colors">{product.title}</h3>
                                    <div className="flex items-center gap-1.5 mb-4 text-xs">
                                        <div className="flex text-yellow-400">
                                          {[...Array(5)].map((_, i) => (
                                            <span key={i}>{i < Math.floor(product.rating) ? '★' : '☆'}</span>
                                          ))}
                                        </div>
                                        <span className="font-bold text-gray-700">{product.rating}</span>
                                        <span className="text-gray-400 font-medium">({product.reviews_count})</span>
                                    </div>
                                    <div className="mt-auto">
                                      <div className="flex items-baseline gap-2 mb-3">
                                          <span className={`text-2xl font-black ${analytics.trend === 'best' || analytics.trend === 'good' ? 'text-emerald-600' : analytics.trend === 'bad' ? 'text-rose-600' : 'text-gray-900'}`}>{minPrice > 0 ? trPrice(minPrice) : 'Fiyat Yok'} {/* cache-bust-v2 */}</span>
                                      </div>
                                      <div className="text-[11px] font-bold text-gray-400 flex items-center gap-2 pt-3 border-t border-slate-100">
                                        <Database className="w-3 h-3" /> {prices.length} farklı satıcıda karşılaştırıldı
                                      </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
              )}
          </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
                <div className="text-center group">
                    <div className="w-20 h-20 bg-blue-50 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-sm border border-blue-100/50">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Güvenilir Karşılaştırma</h3>
                    <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">Apify & n8n mimarisiyle güncel ve kesintisiz fiyat takibi ile asla yanılmazsın.</p>
                </div>
                <div className="text-center group">
                    <div className="w-20 h-20 bg-purple-50 text-accent rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:-rotate-6 transition-transform duration-500 shadow-sm border border-purple-100/50">
                        <Database className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Supabase Altyapısı</h3>
                    <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">Yüz binlerce ürün arasından milisaniyeler içinde sana en uygununu buluruz.</p>
                </div>
                <div className="text-center group">
                    <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-sm border border-amber-100/50">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Anlık Veri Aktarımı</h3>
                    <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">Pazar yerlerindeki fiyat değişimlerini anlık olarak yakalar ve seni uyarırız.</p>
                </div>
            </div>
        </div>
      </section>
    </>
  );
}
