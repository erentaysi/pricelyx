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
import AnimatedCounter from '@/app/components/AnimatedCounter';

export const revalidate = 3600; // 1 saatlik ISR caching

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
        product_prices (price, original_price, vendor_id, vendors(id, name))
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
  const discountedIds = new Set(discountedProducts.map((p: any) => p.id));
  const trendPool = productsList.filter(p => p.is_trend && !discountedIds.has(p.id));
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

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.piinti.com/#website",
        "url": "https://www.piinti.com/",
        "name": "Piinti",
        "description": "Türkiye'nin En Akıllı Fiyat Karşılaştırma Platformu",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.piinti.com/urunler?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://www.piinti.com/#organization",
        "name": "Piinti",
        "url": "https://www.piinti.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.piinti.com/logo.jpg"
        },
        "sameAs": [
          "https://www.instagram.com/piinti",
          "https://www.twitter.com/piinti"
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        {/* Background Gradients & Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/40 blur-[120px] mix-blend-screen"></div>
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/30 blur-[120px] mix-blend-screen"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center fade-in">
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-bold tracking-widest uppercase mb-8 shadow-2xl backdrop-blur-md">
                  <Sparkles className="w-4 h-4" /> Yeni Nesil Akıllı Alışveriş
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-[1.1] tracking-tighter">
                  Aradığın Ürün. <br/>
                  <span className="text-primary">En Ucuz Fiyat.</span> <br/>
                  Tek Tıkla.
                </h1>
                
                <p className="text-lg md:text-xl mb-12 text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                    Milyonlarca ürün, yüzlerce mağaza ve şeffaf fiyat geçmişi ile alışverişin kontrolünü elinize alın. Fazla ödemeye son verin.
                </p>

                <div className="max-w-3xl mx-auto items-center justify-center flex relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-full">
                       <SearchForm />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-16 max-w-4xl mx-auto pt-8 border-t border-white/10">
                    <AnimatedCounter value={productCount || 0} label="Ürün" />
                    <div className="hidden md:block w-px h-16 bg-white/10 mx-auto mt-4"></div>
                    <AnimatedCounter value={vendorCount || 0} label="Mağaza" />
                    <div className="hidden md:block w-px h-16 bg-white/10 mx-auto mt-4"></div>
                    <AnimatedCounter value={priceCount || 0} label="Fiyat Analizi" />
                </div>
            </div>
        </div>
      </section>

      {/* Premium Category Menu */}
      <section className="py-6 bg-white border-b border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] sticky top-[72px] z-30">
          <div className="container mx-auto px-4">
              <div className="flex overflow-x-auto hide-scrollbar gap-4 md:justify-center pb-2 md:pb-0 px-2">
                  {dbCategories?.map(cat => {
                      const count = productsList.filter(p => p.category_id === cat.id).length;
                      return (
                          <Link 
                            href={`/urunler?cat=${cat.name}`} 
                            key={cat.id}
                            className="flex items-center gap-3 bg-slate-50 hover:bg-primary/5 text-slate-700 hover:text-primary px-5 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 border border-slate-100 hover:border-primary/20 group shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          >
                              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                                {categoryIcons[cat.slug] || <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-primary" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{cat.name}</span>
                                {count > 0 && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{count} Ürün</span>}
                              </div>
                          </Link>
                      )
                  })}
              </div>
          </div>
      </section>

      {/* Fiyatı Düşenler */}
      {discountedProducts.length > 0 && (
        <section className="py-20 relative bg-slate-50">
            <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent h-40"></div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100/50">
                          <TrendingDown className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Büyük Fırsatlar</h2>
                        <p className="text-slate-500 font-medium mt-1">Fiyatı son 24 saatte sert düşüş yaşayan ürünler</p>
                      </div>
                  </div>
                  <Link href="/urunler?sort=discount" className="text-rose-600 font-bold hover:text-rose-700 flex items-center gap-1 px-6 py-3 rounded-full bg-white border border-rose-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                      Tüm Fırsatları Gör <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {discountedProducts.map((product: any) => (
                        <div key={product.id} className="transform transition-all duration-300 hover:-translate-y-2">
                           <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Günün Trendleri */}
      {trendProducts.length > 0 && (
        <section className="py-20 relative bg-white border-t border-slate-100">
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                          <Flame className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Günün Trendleri</h2>
                        <p className="text-slate-500 font-medium mt-1">Şu an en çok incelenen ve popüler ürünler</p>
                      </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {trendProducts.map((product: any) => (
                        <div key={product.id} className="transform transition-all duration-300 hover:-translate-y-2">
                           <ProductCard product={product} />
                        </div>
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
