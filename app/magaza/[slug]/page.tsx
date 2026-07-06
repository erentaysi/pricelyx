import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import ProductCard from "@/app/components/ProductCard";
import FilterSidebar from "@/app/urunler/FilterSidebar";
import { generateSeoSlug } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: allVendors } = await supabase.from("vendors").select("name");
  const vendor = (allVendors || []).find(v => generateSeoSlug(v.name) === params.slug);

  if (!vendor) {
    return { title: "Mağaza Bulunamadı" };
  }

  const title = `${vendor.name} Mağazası Ürünleri ve İndirimleri | Piinti`;
  const description = `${vendor.name} mağazasında satılan tüm ürünleri inceleyin. En uygun ${vendor.name} fiyatlarını ve kampanyalarını Piinti'de keşfedin.`;

  return {
    title,
    description,
    alternates: { canonical: `https://piinti.com/magaza/${generateSeoSlug(vendor.name)}` }
  };
}

export default async function MagazaPage({ params, searchParams }: { params: { slug: string }, searchParams: { min_price?: string, max_price?: string, cat?: string, brand?: string } }) {
  const { data: allVendors } = await supabase.from("vendors").select("id, name");
  const vendor = (allVendors || []).find(v => generateSeoSlug(v.name) === params.slug);

  if (!vendor) {
    notFound();
  }

  const { min_price, max_price, cat, brand } = searchParams;

  let query = supabase.from("products").select(`
    *,
    brands${brand ? "!inner" : ""}(name),
    categories${cat ? "!inner" : ""}(name, slug),
    product_prices!inner(price, vendor_id, vendors(id, name)),
    price_history(price, recorded_at)
  `).eq("product_prices.vendor_id", vendor.id).order("created_at", { ascending: false });

  if (cat) {
    query = query.eq("categories.slug", cat);
  }
  if (brand) {
    query = query.eq("brands.name", brand);
  }

  const { data: products } = await query;
  
  // Deduplicate products in case a vendor has multiple prices for the same product
  const uniqueProductsMap = new Map();
  (products || []).forEach(p => {
    if (!uniqueProductsMap.has(p.id)) {
      uniqueProductsMap.set(p.id, p);
    }
  });
  let filteredProducts = Array.from(uniqueProductsMap.values());

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
    name: vendor.name,
    description: `${vendor.name} mağazasında satılan ürünler`,
    url: `https://piinti.com/magaza/${generateSeoSlug(vendor.name)}`
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <FilterSidebar 
        categories={categoriesData || []} 
        brands={brandsData || []} 
        currentCat={cat} 
        currentBrand={brand} 
        currentMinPrice={min_price}
        currentMaxPrice={max_price}
      />

      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
             {vendor.name} Mağazası Ürünleri
             <span className="text-slate-500 text-lg font-medium ml-3">({filteredProducts.length} ürün)</span>
          </h1>
          <p className="text-slate-500 mt-2">
            {vendor.name} mağazasının Piinti üzerinde listelenen tüm indirimli ürünlerini ve avantajlarını keşfedin.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 px-6 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Mağazaya Ait Ürün Bulunamadı</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
