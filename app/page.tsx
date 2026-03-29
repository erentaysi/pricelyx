import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SearchForm from '@/app/components/SearchForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch products from Supabase
  const { data: dbProducts } = await supabase
    .from('products')
    .select(`
      id, title, image_url, rating, reviews_count, is_trend,
      brands (name),
      product_prices (price, original_price)
    `)
    .eq('is_trend', true)
    .limit(8);

  const categories = [
    { id: 1, name: "Akıllı Telefon", icon: "📱", productCount: 5420, slug: "akilli-telefon" },
    { id: 2, name: "Bilgisayar & Laptop", icon: "💻", productCount: 3200, slug: "bilgisayar-laptop" },
    { id: 3, name: "Moda & Giyim", icon: "👕", productCount: 12500, slug: "moda-giyim" },
    { id: 4, name: "Ev & Yaşam", icon: "🏠", productCount: 8900, slug: "ev-yasam" },
    { id: 5, name: "Elektronik", icon: "🎮", productCount: 6700, slug: "elektronik" },
    { id: 6, name: "Kozmetik", icon: "💄", productCount: 4300, slug: "kozmetik" },
    { id: 7, name: "Spor & Outdoor", icon: "⚽", productCount: 3800, slug: "spor-outdoor" },
    { id: 8, name: "Kitap & Hobi", icon: "📚", productCount: 9200, slug: "kitap-hobi" }
  ];

  function formatPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(price);
  }

  // Ensure products list is robust
  const productsList = dbProducts || [];

  return (
    <>
      <section className="gradient-bg text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center fade-in">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">En İyi Fiyat, En Akıllı Seçim</h1>
                <p className="text-xl md:text-2xl mb-8 text-white/90">
                    Milyonlarca ürün arasından en uygun fiyatı bul, karşılaştır, tasarruf et
                </p>
                <div className="max-w-2xl mx-auto">
                    <SearchForm />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold">500K+</div><div className="text-white/80 text-sm">Ürün</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">50+</div><div className="text-white/80 text-sm">Mağaza</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold">%40</div><div className="text-white/80 text-sm">Tasarruf</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">Popüler Kategoriler</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {categories.map(cat => (
                      <Link href={`/urunler?cat=${cat.slug}`} key={cat.id} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border border-slate-100">
                          <div className="text-5xl mb-3 leading-tight">{cat.icon}</div>
                          <h3 className="font-semibold text-gray-800 mb-1">{cat.name}</h3>
                          <p className="text-sm text-gray-500">{cat.productCount.toLocaleString('tr-TR')} ürün</p>
                      </Link>
                  ))}
              </div>
          </div>
      </section>

      {/* Trending Products (Gercek Veri) */}
      <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">Trend Ürünler (Veritabanı)</h2>
              
              {productsList.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-gray-500">Henüz veritabanında ürün bulunmuyor. Sistem veri toplamaya başladığında burada görünecek.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productsList.map((product: any) => {
                        const prices = product.product_prices || [];
                        const minPrice = prices.length > 0 ? Math.min(...prices.map((p: any) => p.price)) : 0;
                        
                        return (
                            <Link href={`/urun/${product.id}`} key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className="relative h-40 bg-slate-100 flex items-center justify-center text-6xl">
                                    {product.image_url}
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow">🔥 Trend</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-gray-500 mb-1">{product.brands?.name || 'Bilinmiyor'}</div>
                                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 h-10 text-sm">{product.title}</h3>
                                    <div className="flex items-center gap-1 mb-2 text-xs">
                                        <span className="text-yellow-400">⭐</span>
                                        <span className="font-semibold">{product.rating}</span>
                                        <span className="text-gray-400">({product.reviews_count})</span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-xl font-bold text-primary">{minPrice > 0 ? formatPrice(minPrice) : 'Fiyat Yok'}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 border-t pt-2 mt-2">🏪 {prices.length} mağazada</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
              )}
          </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">✓</div>
                    <h3 className="text-xl font-semibold mb-2">Güvenilir Karşılaştırma</h3>
                    <p className="text-gray-600">Apify & n8n mimarisiyle güncel ve kesintisiz fiyat takibi.</p>
                </div>
                <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">₺</div>
                    <h3 className="text-xl font-semibold mb-2">Supabase Altyapısı</h3>
                    <p className="text-gray-600">Devasa veriler bile PostgreSQL gücü sayesinde anında karşında.</p>
                </div>
                <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">⚡</div>
                    <h3 className="text-xl font-semibold mb-2">Hızlı ve Kolay</h3>
                    <p className="text-gray-600">Saniyeler içinde yüzlerce mağazayı karşılaştır</p>
                </div>
            </div>
        </div>
      </section>
    </>
  );
}
