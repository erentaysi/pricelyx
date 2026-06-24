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
  Gamepad2,
  TrendingDown,
  Flame,
  ChevronRight
} from 'lucide-react';
import ProductCard from '@/app/components/ProductCard';

export const revalidate = 3600; // 1 saatlik ISR cache ile TTFB sorununu sıfırlar

export default async function Home() {
  // Tüm sorguları aynı anda başlat (Promise.all) ile TTFB süresini kısaltıyoruz
  const [
    { count: productCount },
    { count: vendorCount },
    { count: priceCount },
    { data: dbCategories },
    { data: allProducts }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('product_prices').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('id, name, slug'),
    supabase
      .from('products')
      .select(`
        id, title, image_url, rating, reviews_count, is_trend, category_id,
        brands (name),
        product_prices (price, original_price)
      `)
      .order('created_at', { ascending: false })
      .limit(500)
  ]);

  const productsList = allProducts || [];

  // Çeşitlilik sağlayan fonksiyon (Aynı kategoriden max 2 ürün alır)
  const getDiverseProducts = (pool: any[], max: number) => {
    const selected: any[] = [];
    const categoryCounts: Record<string, number> = {};
    
    // İlk tur: Her kategoriden max 2 ürün
    for (const p of pool) {
      if (selected.length >= max) break;
      const catId = String(p.category_id || 'unknown');
      if ((categoryCounts[catId] || 0) < 2) {
        selected.push(p);
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }
    }
    
    // İkinci tur: Eğer max sayıya ulaşılamadıysa, kalanlardan tamamla
    if (selected.length < max) {
        for (const p of pool) {
            if (selected.length >= max) break;
            if (!selected.includes(p)) selected.push(p);
        }
    }
    return selected;
  };

  // Fiyatı düşenler
  const discountedPool = productsList.filter(p => {
    if (!p.product_prices || p.product_prices.length === 0) return false;
    const priceObj = Array.isArray(p.product_prices) ? p.product_prices[0] : p.product_prices;
    return priceObj.price < priceObj.original_price;
  });
  const discountedProducts = getDiverseProducts(discountedPool, 8);

  // Günün Trendleri
  const trendPool = productsList.filter(p => p.is_trend);
  const trendProducts = getDiverseProducts(trendPool, 8);

  // Kategorilere göre dinamik bölümler (En az 4 ürünü olanlar)
  const dynamicSections = [];
  if (dbCategories) {
    for (const cat of dbCategories) {
      const catProducts = productsList.filter(p => p.category_id === cat.id);
      if (catProducts.length >= 4) {
        dynamicSections.push({
          category: cat,
          products: catProducts.slice(0, 8)
        });
      }
    }
  }

  const categoryIcons: any = {
    "akilli-telefon": <Smartphone className="w-5 h-5 text-blue-600" />,
    "bilgisayar-laptop": <Laptop className="w-5 h-5 text-indigo-600" />,
    "moda-giyim": <Shirt className="w-5 h-5 text-pink-600" />,
    "ev-yasam": <HomeIcon className="w-5 h-5 text-green-600" />,
    "elektronik": <Cpu className="w-5 h-5 text-purple-600" />,
    "kozmetik": <Sparkles className="w-5 h-5 text-rose-600" />,
    "spor-outdoor": <Dribbble className="w-5 h-5 text-orange-600" />,
    "kitap-hobi": <Book className="w-5 h-5 text-amber-600" />,
    "oyun-konsollari": <Gamepad2 className="w-5 h-5 text-indigo-500" />
  };

  return (
    <>
      {/* Hero Section */}
      <section className="gradient-bg text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-6 text-shadow-sm leading-tight">
                  Türkiye'nin En Gelişmiş Ürün ve Fiyat Karşılaştırma Platformu
                </h1>
                <p className="text-lg md:text-xl mb-10 text-white/90 font-medium">
                    Milyonlarca ürün arasından en uygun fiyatı bul, karşılaştır, tasarruf et
                </p>
                <div className="max-w-2xl mx-auto items-center justify-center flex">
                    <SearchForm />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-black">{productCount || 0}+</div><div className="text-white/80 text-sm font-medium">Ürün</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black">{vendorCount || 0}+</div><div className="text-white/80 text-sm font-medium">Mağaza</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-black">{priceCount || 0}+</div><div className="text-white/80 text-sm font-medium">Fiyat Karşılaştırması</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Kompakt Kategori Menüsü (Cimri.com Stili) */}
      <section className="py-8 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
          <div className="container mx-auto px-4">
              <div className="flex overflow-x-auto hide-scrollbar gap-3 md:flex-wrap md:justify-center pb-2 md:pb-0">
                  {dbCategories?.map(cat => {
                      const count = productsList.filter(p => p.category_id === cat.id).length;
                      if (count === 0) return null; // Ürünü olmayanları gizle
                      return (
                        <Link href={`/urunler?cat=${cat.slug}`} key={cat.id} className="flex items-center gap-3 bg-slate-50 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 border border-slate-100 rounded-full px-5 py-3 whitespace-nowrap">
                            {categoryIcons[cat.slug] || <div className="w-5 h-5 bg-gray-200 rounded-full" />}
                            <span className="font-semibold text-slate-700 text-sm">{cat.name}</span>
                            <span className="bg-white text-xs font-bold text-slate-500 px-2 py-0.5 rounded-full shadow-sm">{count}</span>
                        </Link>
                      );
                  })}
              </div>
          </div>
      </section>

      {/* Fiyatı Düşenler */}
      {discountedProducts.length > 0 && (
        <section className="py-12 bg-rose-50/30">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">Fiyatı Düşenler</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {discountedProducts.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Günün Trendleri */}
      {trendProducts.length > 0 && (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Flame className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800">Günün Trendleri</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {trendProducts.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Dinamik Kategori Bölümleri (4+ Ürünlü) */}
      {dynamicSections.map((section, idx) => (
        <section key={section.category.id} className={`py-12 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                          {categoryIcons[section.category.slug] || <div className="w-6 h-6 bg-slate-200 rounded-full" />}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-800">Popüler {section.category.name}</h2>
                  </div>
                  <Link href={`/urunler?cat=${section.category.slug}`} className="text-primary font-bold hover:underline flex items-center gap-1 bg-white px-4 py-2 rounded-full border border-primary/20 shadow-sm hover:bg-primary/5 transition-colors">
                      Tümünü Gör <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {section.products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
      ))}

      {/* Features Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12">
                <div className="text-center group">
                    <div className="w-20 h-20 bg-blue-50 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-sm border border-blue-100/50">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Güvenilir Karşılaştırma</h3>
                    <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">Gelişmiş bot mimarisiyle güncel ve kesintisiz fiyat takibi ile asla yanılmazsın.</p>
                </div>
                <div className="text-center group">
                    <div className="w-20 h-20 bg-purple-50 text-accent rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:-rotate-6 transition-transform duration-500 shadow-sm border border-purple-100/50">
                        <Database className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Anında Sonuç</h3>
                    <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">Yüz binlerce ürün arasından milisaniyeler içinde sana en uygununu buluruz.</p>
                </div>
                <div className="text-center group">
                    <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-sm border border-amber-100/50">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">Fiyat Alarmları</h3>
                    <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">Pazar yerlerindeki fiyat değişimlerini anlık olarak yakalar ve tasarruf etmeni sağlarız.</p>
                </div>
            </div>
        </div>
      </section>
    </>
  );
}
