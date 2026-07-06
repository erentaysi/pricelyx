import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import ProductCard from "@/app/components/ProductCard";
import FilterSidebar from "@/app/urunler/FilterSidebar";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", params.slug)
    .single();

  if (!category) {
    return { title: "Kategori Bulunamadı" };
  }

  const title = `${category.name} Modelleri ve En Uygun Fiyatlar | Piinti`;
  const description = `En iyi ${category.name} ürünlerini, indirimleri ve tüm mağaza fiyatlarını Piinti kalitesiyle karşılaştırın.`;

  return {
    title,
    description,
    alternates: { canonical: `https://piinti.com/kategori/${category.slug}` }
  };
}

export default async function KategoriPage({ params, searchParams }: { params: { slug: string }, searchParams: { min_price?: string, max_price?: string, brand?: string } }) {
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", params.slug)
    .single();

  if (!category) {
    notFound();
  }

  const { min_price, max_price, brand } = searchParams;

  let query = supabase.from("products").select(`
    *,
    brands${brand ? "!inner" : ""}(name),
    categories!inner(name, slug),
    product_prices(price),
    price_history(price, recorded_at)
  `).eq("categories.slug", params.slug).order("created_at", { ascending: false });

  if (brand) {
    query = query.eq("brands.name", brand);
  }

  const { data: products } = await query;
  let filteredProducts = products || [];

  if (min_price || max_price) {
    const min = min_price ? parseFloat(min_price) : 0;
    const max = max_price ? parseFloat(max_price) : Infinity;
    filteredProducts = filteredProducts.filter((p: any) => {
      const priceStr = p.product_prices?.[0]?.price || p.price_history?.[0]?.price;
      const currentPrice = priceStr ? parseFloat(priceStr.toString().replace(/[^0-9.]/g, "")) : 0;
      return currentPrice >= min && currentPrice <= max;
    });
  }

  // Categories & Brands for Sidebar
  const { data: allCategories } = await supabase.from("categories").select("*");
  const { data: productsForFilters } = await supabase.from("products").select("category_id, brands(name)");

  const brandsData = Array.from(new Map((productsForFilters || [])
    .filter((p: any) => p.brands)
    .map((p: any) => {
      const b = Array.isArray(p.brands) ? p.brands[0] : p.brands;
      return [b.name, b];
    })
  ).values());

  const usedCategoryIds = new Set((productsForFilters || []).map((p: any) => p.category_id));
  const activeSubs = (allCategories || []).filter(c => usedCategoryIds.has(c.id) && c.parent_id !== null);
  const allMains = (allCategories || []).filter(c => c.parent_id === null && c.name !== "Piinti Market");

  const categoriesData = allMains.map(main => ({
    ...main,
    subs: activeSubs.filter(sub => sub.parent_id === main.id)
  }));

  // Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: `En iyi ${category.name} fiyatları ve indirimleri`,
    url: `https://piinti.com/kategori/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: filteredProducts.map((p: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          url: `https://piinti.com/urunler/${p.slug}`,
          name: p.title
        }
      }))
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <FilterSidebar 
        categories={categoriesData || []} 
        brands={brandsData || []} 
        currentCat={category.slug} 
        currentBrand={brand} 
        currentMinPrice={min_price}
        currentMaxPrice={max_price}
      />

      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
             {category.name} Modelleri ve Fiyatları
             <span className="text-slate-500 text-lg font-medium ml-3">({filteredProducts.length} sonuç)</span>
          </h1>
          <p className="text-slate-500 mt-2">
            Piyasadaki en güncel {category.name} fiyatlarını karşılaştırın. Aradığınız özellikleri filtreleyerek en ucuz seçeneği bulun.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 px-6 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bu Kategori Boş 🕵️‍♂️</h3>
              <p className="text-slate-500">Şu anda bu kategoride listelenen ürün bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
