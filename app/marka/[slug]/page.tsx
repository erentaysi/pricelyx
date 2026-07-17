import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { routes } from '@/lib/routes';
import ProductCard from '@/app/components/ProductCard';
import { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const { data: brands } = await supabase.from('brands').select('slug').not('slug', 'is', null);
  return (brands || []).map((brand) => ({
    slug: brand.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: brand } = await supabase
    .from('brands')
    .select('name, slug')
    .eq('slug', params.slug)
    .single();

  if (!brand) return { title: 'Bulunamadı' };

  const title = `${brand.name} Ürünleri, Fiyatları ve Kampanyaları | Piinti`;
  const description = routes.seoContent.getBrandDescription(brand.name);
  const canonical = routes.brandCanonical(params.slug);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description }
  };
}

export default async function BrandPage({ params }: Props) {
  const { data: brand } = await supabase
    .from('brands')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .single();

  if (!brand) notFound();

  // Fetch Brand Products
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, slug, image_url, rating, reviews_count,
      brands (name, slug),
      categories (name, slug),
      product_prices (price, vendors(name))
    `)
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })
    .limit(40);

  // Zayıf İçerik Koruması
  if (!products || products.length === 0) notFound();

  // Extract Categories for Internal Linking (e.g. Apple Telefonlar, Apple Tabletler)
  const categoriesMap = new Map();
  products.forEach(p => {
    if (p.categories) {
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
      if (cat?.slug && cat?.name) {
        categoriesMap.set(cat.slug, cat.name);
      }
    }
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: routes.home() },
      { '@type': 'ListItem', position: 2, name: 'Markalar', item: routes.listing() },
      { '@type': 'ListItem', position: 3, name: brand.name, item: routes.brandCanonical(brand.slug) }
    ]
  };

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: brand.name,
    url: routes.brandCanonical(brand.slug),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem', position: i + 1, url: routes.productCanonical(p.slug)
      }))
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd).replace(/</g, '\\u003c') }} />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          
          <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 fade-in flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                {brand.name} <span className="text-primary">Ürünleri</span>
              </h1>
              <p className="text-slate-600 max-w-2xl leading-relaxed text-lg">
                {routes.seoContent.getBrandDescription(brand.name)}
              </p>
            </div>
            {/* Marka Logosu Gelebilir */}
            <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
               <span className="text-3xl font-black text-slate-300">{brand.name.substring(0,2).toUpperCase()}</span>
            </div>
          </div>

          {/* Internal Links (Categories of this Brand) */}
          {categoriesMap.size > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <span className="text-sm font-bold text-slate-400 py-2 mr-2 uppercase tracking-widest">Marka Kategorileri:</span>
              {Array.from(categoriesMap.entries()).map(([catSlug, catName]) => (
                <Link key={catSlug} href={routes.categoryBrand(catSlug, brand.slug)} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:shadow-md transition-all border border-slate-200">
                  {brand.name} {catName}
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
