import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { routes } from '@/lib/routes';
import ProductCard from '@/app/components/ProductCard';
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

type Props = {
  params: { slug: string, brand_slug: string };
};

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [catRes, brandRes] = await Promise.all([
    supabase.from('categories').select('id, name').eq('slug', params.slug).single(),
    supabase.from('brands').select('id, name').eq('slug', params.brand_slug).single(),
  ]);

  if (!catRes.data || !brandRes.data) return { title: 'Bulunamadı' };

  const title = `En Ucuz ${brandRes.data.name} ${catRes.data.name} Fiyatları | Piinti`;
  const description = routes.seoContent.getCategoryBrandDescription(catRes.data.name, brandRes.data.name);
  const canonical = routes.categoryBrandCanonical(params.slug, params.brand_slug);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description }
  };
}

export default async function CategoryBrandPage({ params }: Props) {
  const [catRes, brandRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('slug', params.slug).single(),
    supabase.from('brands').select('id, name, slug').eq('slug', params.brand_slug).single(),
  ]);

  if (!catRes.data || !brandRes.data) notFound();
  
  const category = catRes.data;
  const brand = brandRes.data;

  // Fetch Intersected Products
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, slug, image_url, rating, reviews_count,
      brands (name, slug),
      categories (name, slug),
      product_prices (price, vendors(name))
    `)
    .eq('category_id', category.id)
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(40);

  // Zayıf İçerik Koruması (Thin Content)
  if (!products || products.length === 0) notFound();

  // Related Brands in this Category
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('brands(name, slug)')
    .eq('category_id', category.id)
    .neq('brand_id', brand.id)
    .limit(100);

  const relatedBrandsMap = new Map();
  (relatedProducts || []).forEach(p => {
    if (p.brands) {
      const b = Array.isArray(p.brands) ? p.brands[0] : p.brands;
      if (b?.slug && b?.name) relatedBrandsMap.set(b.slug, b.name);
    }
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: routes.home() },
      { '@type': 'ListItem', position: 2, name: category.name, item: routes.categoryCanonical(category.slug) },
      { '@type': 'ListItem', position: 3, name: `${brand.name} ${category.name}`, item: routes.categoryBrandCanonical(category.slug, brand.slug) }
    ]
  };

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${brand.name} ${category.name}`,
    url: routes.categoryBrandCanonical(category.slug, brand.slug),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem', position: i + 1, url: routes.productCanonical(p.slug)
      }))
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 fade-in flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                En Ucuz {brand.name} <span className="text-primary">{category.name}</span> Fiyatları
              </h1>
              <p className="text-slate-600 max-w-2xl leading-relaxed text-lg">
                {routes.seoContent.getCategoryBrandDescription(category.name, brand.name)}
              </p>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <Link href={routes.category(category.slug)} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 transition-all border border-slate-200 flex items-center gap-2">
              <span className="text-lg">←</span> Tüm {category.name} Modelleri
            </Link>
            <Link href={routes.brand(brand.slug)} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 transition-all border border-slate-200">
              Tüm {brand.name} Ürünleri
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {relatedBrandsMap.size > 0 && (
            <div className="mt-16 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Alternatif Markalar İncele</h3>
              <div className="flex flex-wrap gap-3">
                {Array.from(relatedBrandsMap.entries()).slice(0, 15).map(([bSlug, bName]) => (
                  <Link key={bSlug} href={routes.categoryBrand(category.slug, bSlug)} className="bg-slate-50 hover:bg-primary/5 text-slate-600 hover:text-primary border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    {bName} {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
